import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { normalizeEventKey } from '@/lib/couponHelper';
import { verifyScannerOrAdmin } from '@/lib/auth/serverAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const authCheck = await verifyScannerOrAdmin(req);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const decodedToken = authCheck.user.token;

    const body = await req.json().catch(() => ({}));
    const { 
      ticketId, 
      registrationID, 
      qrData, 
      eventId, 
      eventTitle, 
      scannerId = 'ADMIN_STAFF', 
      volunteerName = 'Staff Member' 
    } = body;

    const idParam = typeof ticketId === 'string' ? ticketId : (typeof registrationID === 'string' ? registrationID : (typeof qrData === 'string' ? qrData : ''));
    const rawIdentifier = idParam.trim();

    if (!rawIdentifier || !/^[a-zA-Z0-9_\-\.:]{1,128}$/.test(rawIdentifier)) {
      return NextResponse.json({
        success: false,
        code: 'INVALID_TICKET',
        error: 'Invalid or missing ticket or QR data provided.'
      }, { status: 400 });
    }

    const safeScannerId = typeof scannerId === 'string' ? scannerId.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 50) : 'ADMIN_STAFF';
    const safeVolunteerName = typeof volunteerName === 'string' ? volunteerName.replace(/[^a-zA-Z0-9_\- ]/g, '').slice(0, 50) : 'Staff Member';

    if (!adminDb) {
      return NextResponse.json({
        success: false,
        code: 'SERVER_ERROR',
        error: 'Database connection is unavailable.'
      }, { status: 500 });
    }

    // 1. Locate Ticket / Registration in Firestore
    let regDoc = await adminDb.collection('registrations').doc(rawIdentifier).get();
    
    // If not found by direct Doc ID, query by ticketId, orderId, or rollNumber
    if (!regDoc.exists) {
      const qById = await adminDb.collection('registrations').where('ticketId', '==', rawIdentifier).limit(1).get();
      if (!qById.empty) {
        regDoc = qById.docs[0];
      } else {
        const qByOrder = await adminDb.collection('registrations').where('orderId', '==', rawIdentifier).limit(1).get();
        if (!qByOrder.empty) {
          regDoc = qByOrder.docs[0];
        } else {
          const qByRoll = await adminDb.collection('registrations').where('rollNumber', '==', rawIdentifier).limit(1).get();
          if (!qByRoll.empty) {
            regDoc = qByRoll.docs[0];
          }
        }
      }
    }

    if (!regDoc.exists) {
      return NextResponse.json({
        success: false,
        code: 'INVALID_TICKET',
        error: 'INVALID TICKET: This ticket could not be verified.'
      }, { status: 404 });
    }

    const regData = regDoc.data() || {};
    const regId = regDoc.id;
    const attendeeName = regData.name || 'Attendee';
    const attendeeEmail = regData.email || 'N/A';
    const attendeeRoll = regData.rollNumber || regData.registrationNumber || 'N/A';
    const regTicketId = regData.ticketId || regData.orderId || `TKT-${regId.substring(0, 8).toUpperCase()}`;

    // 2. Validate Event Specificity
    // If scanner specified an event, verify that the registration belongs to this event
    const registeredEventsList: string[] = [];
    if (Array.isArray(regData.selectedEvents)) {
      registeredEventsList.push(...regData.selectedEvents.map((e: any) => typeof e === 'object' ? (e.id || e.title || '') : String(e)));
    }
    if (Array.isArray(regData.events)) {
      registeredEventsList.push(...regData.events.map((e: any) => typeof e === 'object' ? (e.id || e.title || '') : String(e)));
    }
    if (regData.eventName) registeredEventsList.push(regData.eventName);
    if (regData.eventTitle) registeredEventsList.push(regData.eventTitle);
    if (regData.eventId) registeredEventsList.push(regData.eventId);
    if (regData.visitorConfig) registeredEventsList.push('visitor', 'Visitor Pass');
    if (registeredEventsList.length === 0) registeredEventsList.push('General Fest Entry');

    const ticketEvent = (regData.eventName || regData.eventTitle || regData.eventId || registeredEventsList[0] || 'General Fest Entry').trim();
    
    if (eventId && eventId !== 'all' && eventId !== 'general') {
      const targetKey = normalizeEventKey(eventId);
      
      const isMatch = registeredEventsList.some(ev => {
        const ticketEventKey = normalizeEventKey(ev);
        return ticketEventKey.includes(targetKey) || 
               targetKey.includes(ticketEventKey) ||
               ticketEventKey === 'all' || 
               ticketEventKey === 'generalfestentry';
      });

      if (!isMatch) {
        return NextResponse.json({
          success: false,
          code: 'WRONG_EVENT',
          error: `WRONG EVENT: This ticket is for "${registeredEventsList.join(', ')}", not for "${eventTitle || eventId}".`,
          attendeeName,
          ticketEvent: registeredEventsList.join(', '),
          expectedEvent: eventTitle || eventId,
        }, { status: 400 });
      }
    }

    // 3. Atomic Transaction & Duplicate Scan Prevention
    // Use Firestore Transaction on registration doc to prevent simultaneous race conditions
    const regRef = adminDb.collection('registrations').doc(regId);
    const lockRef = adminDb.collection('entryLocks').doc(regId);

    let alreadyEnteredData: any = null;

    await adminDb.runTransaction(async (transaction) => {
      const freshDoc = await transaction.get(regRef);
      if (!freshDoc.exists) {
        throw new Error('REGISTRATION_NOT_FOUND');
      }

      const freshData = freshDoc.data() || {};

      if (freshData.hasEntered || freshData.attended) {
        alreadyEnteredData = {
          hasEntered: true,
          enteredAt: freshData.enteredAt || freshData.attendedAt || new Date().toISOString(),
          enteredBy: freshData.enteredBy || freshData.checkedInBy || 'Staff Member',
        };
        return;
      }

      // Mark registration as entered
      transaction.update(regRef, {
        hasEntered: true,
        attended: true,
        enteredAt: FieldValue.serverTimestamp(),
        attendedAt: FieldValue.serverTimestamp(),
        enteredBy: volunteerName || scannerId || 'Staff Member',
        checkedInBy: scannerId || 'STAFF',
        entryEvent: eventTitle || ticketEvent,
      });

      // Write Entry Lock
      transaction.set(lockRef, {
        lockedAt: FieldValue.serverTimestamp(),
        registrationId: regId,
        eventId: eventId || 'general',
      });
    });

    if (alreadyEnteredData) {
      return NextResponse.json({
        success: false,
        code: 'ALREADY_ENTERED',
        error: 'ALREADY ENTERED: This ticket has already been used for entry.',
        attendeeName,
        eventTitle: ticketEvent,
        ticketId: regTicketId,
        originalEntryTime: alreadyEnteredData.enteredAt,
        scannedBy: alreadyEnteredData.enteredBy,
      }, { status: 400 });
    }

    // 4. Create Entry Log Record in entryLogs Collection
    const entryLogPayload = {
      ticketId: regTicketId,
      registrationId: regId,
      eventId: eventId || regData.eventId || 'general',
      eventTitle: eventTitle || ticketEvent,
      attendeeName,
      attendeeEmail,
      attendeeRoll,
      entryTime: FieldValue.serverTimestamp(),
      scannedBy: volunteerName || scannerId || 'Staff Member',
      scannerId: scannerId || 'STAFF',
      status: 'ACCEPTED',
      createdAt: new Date().toISOString(),
    };

    const entryLogRef = await adminDb.collection('entryLogs').add(entryLogPayload);

    // Also mirror to scanLogs for backward compatibility
    await adminDb.collection('scanLogs').add({
      scannerId: scannerId || 'STAFF',
      volunteerName: volunteerName || 'Staff Member',
      registrationID: regId,
      attendeeName,
      eventTitle: eventTitle || ticketEvent,
      timestamp: FieldValue.serverTimestamp(),
      result: 'accepted'
    });

    // Write audit trail
    await adminDb.collection('auditLogs').add({
      timestamp: FieldValue.serverTimestamp(),
      action: 'EVENT_ENTRY_SCAN',
      performedBy: volunteerName || scannerId || 'Staff Member',
      targetEntity: `entryLogs/${entryLogRef.id}`,
      details: `Verified entry for ${attendeeName} (${regTicketId}) into ${eventTitle || ticketEvent}`
    });

    return NextResponse.json({
      success: true,
      code: 'ENTRY_SUCCESS',
      message: 'ENTRY SUCCESSFUL',
      attendee: {
        name: attendeeName,
        email: attendeeEmail,
        rollNumber: attendeeRoll,
        ticketId: regTicketId,
      },
      event: eventTitle || ticketEvent,
      ticketId: regTicketId,
      entryTime: new Date().toISOString(),
      scannedBy: volunteerName || scannerId || 'Staff Member',
    });

  } catch (err: any) {
    console.error('Scan verification error:', err);
    return NextResponse.json({
      success: false,
      code: 'SCAN_ERROR',
      error: err.message || 'An unexpected error occurred during scan validation.'
    }, { status: 500 });
  }
}
