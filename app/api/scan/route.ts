import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { normalizeEventKey } from '@/lib/couponHelper';
import { extractAllTeamMembers, isTeamEventRegistration, isStaffRegistration } from '@/lib/registrationDataHelper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing or invalid Authorization header" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (authErr: any) {
      console.error("Token verification failed:", authErr);
      return NextResponse.json({ error: `Unauthorized: Token verification failed (${authErr.message})` }, { status: 401 });
    }

    // Role check
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    let userRole = userDoc.data()?.role;
    if (!userRole) {
      const roleDoc = await adminDb.collection("roles").doc(decodedToken.uid).get();
      userRole = roleDoc.data()?.role;
    }
    
    // Match frontend behavior: default to 'admin' if no role is found in database
    const normalizedRole = userRole ? String(userRole).toLowerCase() : "admin";
    const normalizedTokenRole = decodedToken.role ? String(decodedToken.role).toLowerCase() : "admin";

    if (
      normalizedRole !== "admin" && 
      normalizedRole !== "scanner" && 
      decodedToken.admin !== true && 
      normalizedTokenRole !== "admin" && 
      normalizedTokenRole !== "scanner"
    ) {
      console.error(`Forbidden: User ${decodedToken.uid} has role '${userRole}' (Token role: '${decodedToken.role}')`);
      return NextResponse.json({ error: `Forbidden: Your account role '${userRole || 'NONE'}' is not authorized to scan` }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { 
      ticketId, 
      registrationID, 
      qrData, 
      eventId, 
      eventTitle, 
      scannerId = 'ADMIN_STAFF', 
      volunteerName = 'Staff Member',
      action = 'APPROVE', // 'APPROVE' | 'APPROVE_MEMBER' | 'UNDO_MEMBER' | 'APPROVE_ALL'
      memberId,
      memberName,
    } = body;

    const rawIdentifier = (ticketId || registrationID || qrData || '').trim();

    if (!rawIdentifier) {
      return NextResponse.json({
        success: false,
        code: 'INVALID_TICKET',
        error: 'No ticket or QR data provided.'
      }, { status: 400 });
    }

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

    // Validate registration is not deleted/refunded
    if (regData.isDeleted || regData.status === 'deleted') {
      return NextResponse.json({
        success: false,
        code: 'REGISTRATION_DELETED',
        error: `REGISTRATION CANCELLED: Registration for ${attendeeName} was deleted/refunded. Entry is prohibited.`,
        attendeeName,
      }, { status: 400 });
    }

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

    // 3. Team Member Resolution & Duplicate Prevention
    const isStaff = isStaffRegistration(regData);
    const allMembers = extractAllTeamMembers(regData);
    const isTeam = isTeamEventRegistration(regData) || allMembers.length > 1 || isStaff;

    const regRef = adminDb.collection('registrations').doc(regId);
    const lockRef = adminDb.collection('entryLocks').doc(regId);

    let alreadyEnteredData: any = null;
    let memberAlreadyEntered = false;
    let memberAlreadyEnteredInfo: any = null;
    let updatedEnteredMembers: Record<string, any> = {};
    let targetMemberResult: any = null;
    let isFullTeamApproved = false;
    let newEnteredCount = 0;
    let totalMembersCount = Math.max(allMembers.length, 1);

    await adminDb.runTransaction(async (transaction) => {
      const freshDoc = await transaction.get(regRef);
      if (!freshDoc.exists) {
        throw new Error('REGISTRATION_NOT_FOUND');
      }

      const freshData = freshDoc.data() || {};

      if (freshData.isDeleted || freshData.status === 'deleted') {
        throw new Error('REGISTRATION_DELETED');
      }

      const isFreshStaff = isStaffRegistration(freshData);
      const existingEnteredMembers: Record<string, any> = freshData.enteredMembers || {};
      const currentAllMembers = extractAllTeamMembers(freshData);
      totalMembersCount = Math.max(currentAllMembers.length, isFreshStaff ? 4 : 1);
      
      const currentEnteredMembersCount = Object.values(existingEnteredMembers).filter((m: any) => m && (m.entered === true || m.entered === 'true')).length;
      
      // Determine if the entire registration is already completely inside
      const isCompletelyEntered = isTeam
        ? (freshData.allEntered === true || (currentEnteredMembersCount >= totalMembersCount && totalMembersCount > 0))
        : (freshData.hasEntered || freshData.attended);

      // If action is general APPROVE or APPROVE_ALL and all are already inside:
      if (isCompletelyEntered && (action === 'APPROVE' || action === 'APPROVE_ALL')) {
        alreadyEnteredData = {
          hasEntered: true,
          allEntered: true,
          enteredAt: freshData.enteredAt || freshData.attendedAt || new Date().toISOString(),
          enteredBy: freshData.enteredBy || freshData.checkedInBy || 'Staff Member',
        };
        return;
      }

      const nowIso = new Date().toISOString();
      const operatorName = volunteerName || scannerId || 'Staff Member';

      if (action === 'APPROVE_MEMBER' && memberId) {
        // Check if THIS specific member already entered
        if (existingEnteredMembers[memberId]?.entered) {
          memberAlreadyEntered = true;
          memberAlreadyEnteredInfo = existingEnteredMembers[memberId];
          return;
        }

        const targetMem = currentAllMembers.find(m => m.id === memberId) || {
          id: memberId,
          name: memberName || (isFreshStaff ? (memberId === 'leader' ? 'Faculty / Staff Member' : 'Guest / Family') : 'Member'),
          isLeader: memberId === 'leader',
          role: memberId === 'leader' ? (isFreshStaff ? 'Faculty / Staff (Primary)' : 'Team Leader') : (isFreshStaff ? 'Guest / Family' : 'Teammate'),
        };

        updatedEnteredMembers = {
          ...existingEnteredMembers,
          [memberId]: {
            entered: true,
            name: targetMem.name,
            role: targetMem.role || (targetMem.isLeader ? (isFreshStaff ? 'Faculty / Staff (Primary)' : 'Team Leader') : (isFreshStaff ? 'Guest / Family' : 'Teammate')),
            enteredAt: nowIso,
            enteredBy: operatorName,
          }
        };

        newEnteredCount = Object.values(updatedEnteredMembers).filter((m: any) => m && m.entered).length;
        isFullTeamApproved = newEnteredCount >= totalMembersCount;

        targetMemberResult = {
          id: targetMem.id,
          name: targetMem.name,
          role: targetMem.role,
          entered: true,
          enteredAt: nowIso,
          enteredBy: operatorName,
        };

        const updatePayload: Record<string, any> = {
          enteredMembers: updatedEnteredMembers,
          enteredCount: newEnteredCount,
          totalMembersCount,
          hasEntered: true,
          attended: true,
          allEntered: isFullTeamApproved,
          lastMemberEnteredAt: FieldValue.serverTimestamp(),
          lastMemberEnteredBy: operatorName,
          entryEvent: eventTitle || ticketEvent,
        };

        if (!freshData.hasEntered && !freshData.attended) {
          updatePayload.enteredAt = FieldValue.serverTimestamp();
          updatePayload.attendedAt = FieldValue.serverTimestamp();
          updatePayload.enteredBy = operatorName;
          updatePayload.checkedInBy = scannerId || 'STAFF';
        }

        transaction.update(regRef, updatePayload);

        if (isFullTeamApproved) {
          transaction.set(lockRef, {
            lockedAt: FieldValue.serverTimestamp(),
            registrationId: regId,
            eventId: eventId || 'general',
            allEntered: true,
          });
        }
      } else if (action === 'UNDO_MEMBER' && memberId) {
        updatedEnteredMembers = { ...existingEnteredMembers };
        delete updatedEnteredMembers[memberId];

        newEnteredCount = Object.values(updatedEnteredMembers).filter((m: any) => m && m.entered).length;
        const hasAnyEntered = newEnteredCount > 0;

        transaction.update(regRef, {
          enteredMembers: updatedEnteredMembers,
          enteredCount: newEnteredCount,
          hasEntered: hasAnyEntered,
          attended: hasAnyEntered,
          allEntered: false,
        });

        targetMemberResult = {
          id: memberId,
          name: memberName || 'Member',
          entered: false,
        };
      } else {
        // APPROVE_ALL or legacy solo APPROVE
        updatedEnteredMembers = { ...existingEnteredMembers };
        
        currentAllMembers.forEach(m => {
          if (!updatedEnteredMembers[m.id]?.entered) {
            updatedEnteredMembers[m.id] = {
              entered: true,
              name: m.name,
              role: m.role || (m.isLeader ? (isFreshStaff ? 'Faculty / Staff (Primary)' : 'Team Leader') : (isFreshStaff ? 'Guest / Family' : 'Teammate')),
              enteredAt: nowIso,
              enteredBy: operatorName,
            };
          }
        });

        newEnteredCount = Object.values(updatedEnteredMembers).filter((m: any) => m && m.entered).length;
        isFullTeamApproved = true;

        transaction.update(regRef, {
          enteredMembers: updatedEnteredMembers,
          enteredCount: newEnteredCount,
          totalMembersCount,
          hasEntered: true,
          attended: true,
          allEntered: true,
          enteredAt: freshData.enteredAt || FieldValue.serverTimestamp(),
          attendedAt: freshData.attendedAt || FieldValue.serverTimestamp(),
          enteredBy: freshData.enteredBy || operatorName,
          checkedInBy: scannerId || 'STAFF',
          entryEvent: eventTitle || ticketEvent,
        });

        transaction.set(lockRef, {
          lockedAt: FieldValue.serverTimestamp(),
          registrationId: regId,
          eventId: eventId || 'general',
          allEntered: true,
        });
      }
    });

    if (alreadyEnteredData) {
      return NextResponse.json({
        success: false,
        code: 'ALREADY_ENTERED',
        error: isTeam 
          ? 'ALL MEMBERS ENTERED: All team members have already checked in.' 
          : 'ALREADY ENTERED: This ticket has already been used for entry.',
        attendeeName,
        eventTitle: ticketEvent,
        ticketId: regTicketId,
        originalEntryTime: alreadyEnteredData.enteredAt,
        scannedBy: alreadyEnteredData.enteredBy,
      }, { status: 400 });
    }

    if (memberAlreadyEntered) {
      return NextResponse.json({
        success: false,
        code: 'MEMBER_ALREADY_ENTERED',
        error: `ALREADY ENTERED: ${memberAlreadyEnteredInfo?.name || 'Member'} has already entered.`,
        attendeeName: memberAlreadyEnteredInfo?.name || 'Member',
        originalEntryTime: memberAlreadyEnteredInfo?.enteredAt,
        scannedBy: memberAlreadyEnteredInfo?.enteredBy,
      }, { status: 400 });
    }

    if (action === 'UNDO_MEMBER') {
      await adminDb.collection('auditLogs').add({
        timestamp: FieldValue.serverTimestamp(),
        action: 'EVENT_ENTRY_UNDO',
        performedBy: volunteerName || scannerId || 'Staff Member',
        targetEntity: `registrations/${regId}`,
        details: `Undid entry approval for team member ${memberName || memberId} of registration ${regTicketId}`
      });

      return NextResponse.json({
        success: true,
        code: 'MEMBER_UNDO_SUCCESS',
        message: `Approval undone for ${memberName || 'member'}`,
        enteredMembers: updatedEnteredMembers,
        enteredCount: newEnteredCount,
        totalMembersCount,
        allEntered: false,
      });
    }

    // 4. Create Entry Log Record in entryLogs Collection
    const loggedAttendeeName = targetMemberResult?.name || attendeeName;
    const entryLogPayload = {
      ticketId: regTicketId,
      registrationId: regId,
      eventId: eventId || regData.eventId || 'general',
      eventTitle: eventTitle || ticketEvent,
      attendeeName: loggedAttendeeName,
      attendeeEmail,
      attendeeRoll,
      memberId: targetMemberResult?.id || (isTeam ? 'team' : 'solo'),
      memberRole: targetMemberResult?.role || (isTeam ? 'Teammate' : 'Participant'),
      isTeamMember: Boolean(targetMemberResult && !targetMemberResult.isLeader),
      primaryAttendeeName: attendeeName,
      entryTime: FieldValue.serverTimestamp(),
      timestamp: FieldValue.serverTimestamp(),
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
      attendeeName: loggedAttendeeName,
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
      details: `Verified entry for ${loggedAttendeeName} (${regTicketId}) into ${eventTitle || ticketEvent}`
    });

    return NextResponse.json({
      success: true,
      code: action === 'APPROVE_MEMBER' ? 'MEMBER_ENTRY_SUCCESS' : 'ENTRY_SUCCESS',
      message: action === 'APPROVE_MEMBER' ? `ENTRY APPROVED • ${loggedAttendeeName}` : 'ENTRY SUCCESSFUL',
      attendee: {
        name: loggedAttendeeName,
        email: attendeeEmail,
        rollNumber: attendeeRoll,
        ticketId: regTicketId,
      },
      member: targetMemberResult || undefined,
      enteredMembers: updatedEnteredMembers,
      enteredCount: newEnteredCount,
      totalMembersCount,
      allEntered: isFullTeamApproved,
      event: eventTitle || ticketEvent,
      ticketId: regTicketId,
      entryTime: new Date().toISOString(),
      scannedBy: volunteerName || scannerId || 'Staff Member',
    });

  } catch (err: any) {
    console.error('Scan verification error:', err);
    if (err.message === 'REGISTRATION_DELETED') {
      return NextResponse.json({
        success: false,
        code: 'REGISTRATION_DELETED',
        error: 'REGISTRATION CANCELLED: This registration was marked as deleted/refunded. Entry is prohibited.'
      }, { status: 400 });
    }
    return NextResponse.json({
      success: false,
      code: 'SCAN_ERROR',
      error: err.message || 'An unexpected error occurred during scan validation.'
    }, { status: 500 });
  }
}
