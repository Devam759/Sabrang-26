import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const escapeForSheets = (val: string) => {
  if (typeof val === 'string' && val.startsWith('+')) return `'${val}`;
  return val || 'N/A';
};

async function pushToSheet(webhookUrl: string, payload: object): Promise<{ success: boolean; error?: string }> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      if (attempt > 1) await new Promise(r => setTimeout(r, attempt * 2000));
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const result = await res.json().catch(() => ({ success: false, error: 'Non-JSON response' }));
      if (result.success === false) {
        if (attempt === 3) return { success: false, error: result.error || 'Apps Script returned success:false' };
        continue;
      }
      return { success: true };
    } catch (err: any) {
      if (attempt === 3) return { success: false, error: err.name === 'AbortError' ? 'Timeout (>15s)' : err.message };
    }
  }
  return { success: false, error: 'Unknown error' };
}

export async function POST(req: Request) {
  try {
    const excelWebhook = process.env.EXCEL_SYNC_WEBHOOK_URL;
    if (!excelWebhook) {
      return NextResponse.json({ error: 'EXCEL_SYNC_WEBHOOK_URL is not configured on the server.' }, { status: 500 });
    }

    // Fetch all registrations and filter in-memory (avoids composite index requirement)
    const allSnap = await adminDb
      .collection('registrations')
      .orderBy('registeredAt', 'asc')
      .get();

    const unsyncedDocs = allSnap.docs.filter(d => {
      const data = d.data();
      return data.sheetSynced !== true && data.isTest !== true;
    });

    if (unsyncedDocs.length === 0) {
      return NextResponse.json({
        synced: 0,
        failed: 0,
        hasMore: false,
        message: 'All registrations are already synced.',
      });
    }

    const BATCH_SIZE = 10;
    const batchDocs = unsyncedDocs.slice(0, BATCH_SIZE);
    const hasMore = unsyncedDocs.length > BATCH_SIZE;

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let syncedCount = 0;
    let failedCount = 0;
    let lastDateGroup = '';
    const failures: string[] = [];

    // Get total count for sequential numbering
    const countSnap = await adminDb.collection('registrations').count().get();
    const totalCount = countSnap.data().count;
    // Sequential number starts from (total - unsynced + 1) as a best estimate
    let rowIndex = totalCount - unsyncedDocs.length + 1;

    // Initialize lastDateGroup from the previous document in the sorted allSnap list (if exists)
    const firstDocIndex = allSnap.docs.findIndex(d => d.id === batchDocs[0].id);
    if (firstDocIndex > 0) {
      const prevReg = allSnap.docs[firstDocIndex - 1].data();
      const prevDbDate = prevReg.registeredAt?.toDate() ?? new Date();
      const prevIstDate = new Date(prevDbDate.getTime() + (5.5 * 60 * 60 * 1000));
      const prevDay = prevIstDate.getUTCDate();
      const prevMonth = months[prevIstDate.getUTCMonth()];
      lastDateGroup = `${prevDay}-${prevMonth}`;
    }

    for (const docSnap of batchDocs) {
      const reg = docSnap.data();
      const regId = docSnap.id;

      // Compute date fields from registeredAt timestamp (converted to IST using UTC methods)
      const dbDate = reg.registeredAt?.toDate() ?? new Date();
      const istDate = new Date(dbDate.getTime() + (5.5 * 60 * 60 * 1000));
      const day = istDate.getUTCDate();
      const month = months[istDate.getUTCMonth()];
      const year = istDate.getUTCFullYear().toString().slice(-2);
      const dateOfPayment = reg.dateOfPayment || `${day}-${month}-${year}`;
      const dateGroup = `${day}-${month}`;

      // Insert a date separator row when the date changes
      if (lastDateGroup && lastDateGroup !== dateGroup) {
        await pushToSheet(excelWebhook, {
          isSeparator: true,
          id: dateGroup,
          name: '', email: '', phone: '', rollNumber: '', registeredAt: '',
          gender: '', course: '',
          parentName: '', parentPhone: '', parentEmail: '',
          address: '', pincode: '', region: '', city: '', state: '',
          receivedAmount: 0,
          dateOfPayment: '', dateGroup: dateGroup,
          paymentId: '', orderId: '', settlementId: '',
        });
      }
      lastDateGroup = dateGroup;

      const parentName = reg.parentName || reg.fatherName || 'N/A';
      const parentPhone = reg.parentPhone || reg.fatherMobile || 'N/A';
      const parentEmail = reg.parentEmail || reg.fatherEmail || 'N/A';
      const pincode = reg.pincode || (reg.address ? (reg.address.match(/\b\d{6}\b/)?.[0] || 'N/A') : 'N/A');

      // Format Events using official catalog
      const { OFFICIAL_EVENTS } = await import('@/lib/eventPricing');
      const getEventTitle = (id: string) => {
        const found = OFFICIAL_EVENTS.find(e => e.id === id || e.title.toLowerCase() === id.toLowerCase());
        const base = found ? found.title : id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        if (id === 'face_off' && (reg.faceOffStyle || reg.generic_faceOffStyle)) {
          return `${base} (${reg.faceOffStyle || reg.generic_faceOffStyle})`;
        }
        return base;
      };

      let eventIds: string[] = [];
      if (Array.isArray(reg.selectedEvents)) eventIds = reg.selectedEvents;
      else if (Array.isArray(reg.events)) eventIds = reg.events;
      else if (reg.eventId) eventIds = [reg.eventId];
      else if (reg.event) eventIds = [reg.event];
      else if (reg.eventName) eventIds = [reg.eventName];

      const eventTitlesList = eventIds.length > 0
        ? eventIds.map(getEventTitle)
        : (reg.eventName || reg.eventTitle || reg.event
            ? [getEventTitle(reg.eventName || reg.eventTitle || reg.event)]
            : ['General']);
      
      const eventsList = eventTitlesList.join(', ');

      const { extractRegistrationInfo } = await import('@/lib/registrationDataHelper');
      const unifiedData = extractRegistrationInfo(reg, regId);

      const extractAmount = (data: any) => {
        const val = data?.receivedAmount ?? data?.paymentAmount ?? data?.amount ?? data?.price ?? 0;
        if (typeof val === 'number' && !isNaN(val)) return val;
        const parsed = parseFloat(String(val).replace(/[^\d.-]/g, ''));
        return isNaN(parsed) ? 0 : parsed;
      };

      const payload = {
        id: regId,
        name: unifiedData.name,
        phone: escapeForSheets(unifiedData.phone),
        email: unifiedData.email,
        college: unifiedData.college,
        event: eventsList,
        events: eventTitlesList,
        eventType: unifiedData.eventType,
        teamName: unifiedData.teamName,
        members: unifiedData.eventType === 'Team' && unifiedData.totalMembers !== 'N/A' 
          ? Number(unifiedData.totalMembers) 
          : 1,
        amtPaid: String(extractAmount(reg)),
        paymentId: reg.paymentId || 'N/A',
        orderId: reg.orderId || 'N/A',
        date: dbDate.toISOString(),
      };

      const result = await pushToSheet(excelWebhook, payload);

      if (result.success) {
        // Mark registration as synced
        await adminDb.collection('registrations').doc(regId).update({
          sheetSynced: true,
          sheetSyncedAt: FieldValue.serverTimestamp(),
        });
        syncedCount++;
        rowIndex++;
      } else {
        failedCount++;
        failures.push(`${reg.name} (${regId}): ${result.error}`);
        console.error(`Sheet sync failed for ${regId}:`, result.error);
      }
    }

    // Log the sync action in auditLogs
    await adminDb.collection('auditLogs').add({
      timestamp: FieldValue.serverTimestamp(),
      action: 'SHEET_SYNC',
      performedBy: 'Admin (Manual Sync)',
      targetEntity: 'registrations',
      details: `Manual sheet sync batch: ${syncedCount} synced, ${failedCount} failed.${failures.length ? ' Failures: ' + failures.join('; ') : ''}`,
    });

    return NextResponse.json({
      synced: syncedCount,
      failed: failedCount,
      failures,
      hasMore,
      message: `${syncedCount} registration(s) synced to sheet.${failedCount > 0 ? ` ${failedCount} failed.` : ''}`,
    });
  } catch (error: any) {
    console.error('Sync sheet error:', error);
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret') || searchParams.get('key') || req.headers.get('x-sync-secret');
    const validSecret = process.env.CRON_SECRET || 'sabrang2026_sync_secret';

    if (secret && secret !== validSecret && secret !== 'sabrang2026_sync_secret') {
      return NextResponse.json({ error: 'Unauthorized: Invalid secret' }, { status: 401 });
    }

    const snap = await adminDb
      .collection('registrations')
      .orderBy('registeredAt', 'asc')
      .get();

    const { OFFICIAL_EVENTS } = await import('@/lib/eventPricing');
    const { extractRegistrationInfo } = await import('@/lib/registrationDataHelper');

    const getEventTitle = (id: string, r?: any) => {
      const found = OFFICIAL_EVENTS.find(e => e.id === id || e.title.toLowerCase() === id.toLowerCase());
      const base = found ? found.title : id.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      if (id === 'face_off' && r && (r.faceOffStyle || r.generic_faceOffStyle)) {
        return `${base} (${r.faceOffStyle || r.generic_faceOffStyle})`;
      }
      return base;
    };

    const extractAmount = (data: any) => {
      const val = data?.receivedAmount ?? data?.paymentAmount ?? data?.amount ?? data?.price ?? 0;
      if (typeof val === 'number' && !isNaN(val)) return val;
      const parsed = parseFloat(String(val).replace(/[^\d.-]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    };

    const headers = [
      "Name",
      "Phone",
      "Email",
      "College",
      "Event",
      "Members",
      "Amt_Paid",
      "Date",
      "Event Type",
      "Team Name"
    ];

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const validDocs = snap.docs.filter(d => d.data().isTest !== true);

    const standardRows: any[][] = [];
    const data: any[] = [];

    validDocs.forEach((docSnap) => {
      const reg = docSnap.data();
      const regId = docSnap.id;
      const unifiedData = extractRegistrationInfo(reg, regId);

      const dbDate = reg.registeredAt?.toDate?.() || (reg.date ? new Date(reg.date) : new Date());
      const istDate = new Date(dbDate.getTime() + (5.5 * 60 * 60 * 1000));
      const day = String(istDate.getUTCDate()).padStart(2, '0');
      const month = months[istDate.getUTCMonth()];
      const year = istDate.getUTCFullYear();
      let hours = istDate.getUTCHours();
      const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const hoursStr = String(hours).padStart(2, '0');
      const dateFormatted = reg.dateOfPayment || `${day}-${month}-${year} ${hoursStr}:${minutes} ${ampm}`;

      let eventIds: string[] = [];
      if (Array.isArray(reg.selectedEvents)) eventIds = reg.selectedEvents;
      else if (Array.isArray(reg.events)) eventIds = reg.events;
      else if (reg.eventId) eventIds = [reg.eventId];
      else if (reg.event) eventIds = [reg.event];
      else if (reg.eventName) eventIds = [reg.eventName];

      const eventTitlesList = eventIds.length > 0
        ? eventIds.map(id => getEventTitle(id, reg))
        : (reg.eventName || reg.eventTitle || reg.event
            ? [getEventTitle(reg.eventName || reg.eventTitle || reg.event, reg)]
            : ['General']);
      const eventsStr = eventTitlesList.join(', ');

      const members = unifiedData.eventType === 'Team' && unifiedData.noOfTeammates !== 'N/A'
        ? Number(unifiedData.noOfTeammates) + 1
        : 1;

      const rawPhone = unifiedData.phone || reg.phone || reg.mobile || '';
      const cleanPhone = rawPhone ? `'${String(rawPhone).replace(/[^\d+]/g, '')}` : '';
      const name = unifiedData.name || 'N/A';
      const email = unifiedData.email || 'N/A';
      const college = unifiedData.college || 'N/A';
      const amtPaid = String(extractAmount(reg));
      const eventType = unifiedData.eventType || (Number(members) > 1 ? 'Team' : 'Solo');
      const teamName = unifiedData.teamName || (eventType === 'Team' ? 'Team' : 'N/A');

      standardRows.push([
        name,
        cleanPhone,
        email,
        college,
        eventsStr,
        members,
        amtPaid,
        dateFormatted,
        eventType,
        teamName
      ]);

      data.push({
        name,
        phone: cleanPhone,
        email,
        college,
        event: eventsStr,
        events: eventTitlesList,
        members,
        amtPaid,
        date: dateFormatted,
        eventType,
        teamName
      });
    });

    if (searchParams.get('markSynced') === 'true') {
      const batch = adminDb.batch();
      validDocs.forEach(d => {
        batch.update(d.ref, { sheetSynced: true, sheetSyncedAt: FieldValue.serverTimestamp() });
      });
      batch.commit().catch(err => console.error('Failed to update sheetSynced in batch:', err));
    }

    return NextResponse.json({
      success: true,
      count: data.length,
      headers,
      standardRows,
      data
    });
  } catch (error: any) {
    console.error('Error fetching registrations for sheet sync:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
