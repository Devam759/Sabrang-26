import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { getStudentBatchDetails, sendCheckInEmail } from '@/lib/batchHelper';
import { verifyScannerOrAdmin } from '@/lib/auth/serverAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const authCheck = await verifyScannerOrAdmin(req);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const { registrationID, scannerId, volunteerName } = await req.json().catch(() => ({}));

    if (!registrationID || typeof registrationID !== 'string' || !/^[a-zA-Z0-9_\-\.:]{1,128}$/.test(registrationID.trim())) {
      return NextResponse.json({ error: 'Invalid or missing registrationID' }, { status: 400 });
    }
    const cleanRegId = registrationID.trim();
    const cleanVolunteer = typeof volunteerName === 'string' 
      ? volunteerName.replace(/[^a-zA-Z0-9_\- ]/g, '').slice(0, 50) 
      : (typeof scannerId === 'string' ? scannerId.replace(/[^a-zA-Z0-9_\- ]/g, '').slice(0, 50) : 'UNKNOWN');

    const regRef = adminDb.collection('registrations').doc(cleanRegId);
    const regDoc = await regRef.get();

    if (!regDoc.exists) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    const data = regDoc.data() || {};

    if (data.hasEntered) {
      return NextResponse.json({ 
        error: 'Attendee has already checked in',
        alreadyCheckedIn: true,
        enteredAt: data.enteredAt,
        enteredBy: data.enteredBy
      }, { status: 400 });
    }

    const checkInTime = new Date();

    // 1. Update registration record in Firestore
    await regRef.update({
      hasEntered: true,
      enteredAt: FieldValue.serverTimestamp(),
      enteredBy: volunteerName || scannerId || 'UNKNOWN'
    });

    // 2. Add document to entryLogs and scanLogs
    const eventName = data.eventName || data.eventTitle || 'General Fest Entry';
    const regTicketId = data.ticketId || data.orderId || `TKT-${registrationID.substring(0, 8).toUpperCase()}`;

    await Promise.allSettled([
      adminDb.collection('entryLogs').add({
        ticketId: regTicketId,
        registrationId: registrationID,
        eventId: data.eventId || 'general',
        eventTitle: eventName,
        attendeeName: data.name || 'N/A',
        attendeeEmail: data.email || 'N/A',
        attendeeRoll: data.rollNumber || data.registrationNumber || 'N/A',
        entryTime: FieldValue.serverTimestamp(),
        scannedBy: volunteerName || scannerId || 'Gate Scanner',
        scannerId: scannerId || 'API_GATE',
        status: 'ACCEPTED',
        createdAt: new Date().toISOString(),
      }),
      adminDb.collection('scanLogs').add({
        scannerId: scannerId || 'API_GATE',
        volunteerName: volunteerName || 'Gate Scanner',
        registrationID: registrationID,
        attendeeName: data.name || 'N/A',
        timestamp: FieldValue.serverTimestamp(),
        result: 'accepted'
      }),
    ]);

    // 3. Write Audit Log
    try {
      await adminDb.collection('auditLogs').add({
        timestamp: FieldValue.serverTimestamp(),
        action: 'SCANNER_APPROVE_API',
        performedBy: volunteerName || scannerId || 'Gate Scanner',
        targetEntity: `registrations/${registrationID}`,
        details: `Approved check-in for attendee ${data.name || 'N/A'} at gate`
      });
    } catch (auditErr) {
      console.error("Audit log creation failed during check-in:", auditErr);
    }

    // 4. Resolve Batch assignment and dispatch Batch Confirmation Email in the background using after()
    after(async () => {
      try {
        console.log(`Executing check-in email pipeline for: ${data.email}...`);
        
        const studentEmail = data.email;
        if (!studentEmail) {
          console.warn("Student email is missing in registration record. Email will not be sent.");
          return;
        }

        const appNumber = data.registrationNumber || data.rollNumber || 'N/A';
        const { batchName, pdfFileName } = await getStudentBatchDetails(data, registrationID);

        // Update registration record with assigned batch info in Firestore
        await regRef.update({
          assignedBatch: batchName,
          assignedBatchPdf: pdfFileName
        });

        await sendCheckInEmail(
          studentEmail,
          data.name || 'Student',
          appNumber,
          batchName,
          pdfFileName
        );
      } catch (emailErr) {
        console.error("Background check-in email pipeline failed:", emailErr);
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Gate check-in completed successfully',
      attendeeName: data.name
    });

  } catch (error: any) {
    console.error('Check-in Approve API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process gate check-in' }, { status: 500 });
  }
}
