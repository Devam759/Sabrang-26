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
    const body = await req.json().catch(() => ({}));
    const resyncAll = !!body.resyncAll;
    const batchSize = Math.max(1, Math.min(100, Number(body.batchSize) || 20));
    const offset = Math.max(0, Number(body.offset) || 0);

    const excelWebhook = process.env.EXCEL_SYNC_WEBHOOK_URL;
    if (!excelWebhook) {
      return NextResponse.json({ error: 'EXCEL_SYNC_WEBHOOK_URL is not configured on the server.' }, { status: 500 });
    }

    // Fetch all registrations
    const allSnap = await adminDb
      .collection('registrations')
      .orderBy('registeredAt', 'asc')
      .get();

    const candidateDocs = allSnap.docs.filter(d => {
      const data = d.data();
      if (data.isTest === true || data.isDeleted === true || data.status === 'deleted') {
        return false;
      }
      if (resyncAll) return true;
      return data.sheetSynced !== true;
    });

    if (candidateDocs.length === 0 || offset >= candidateDocs.length) {
      return NextResponse.json({
        synced: 0,
        failed: 0,
        hasMore: false,
        total: candidateDocs.length,
        offset,
        message: resyncAll ? 'All registrations have been resynced.' : 'All registrations are already synced.',
      });
    }

    const batchDocs = candidateDocs.slice(offset, offset + batchSize);
    const hasMore = offset + batchSize < candidateDocs.length;

    let syncedCount = 0;
    let failedCount = 0;
    const failures: string[] = [];

    const { OFFICIAL_EVENTS } = await import('@/lib/eventPricing');
    const { extractRegistrationInfo } = await import('@/lib/registrationDataHelper');

    const getEventTitle = (id: string) => {
      const found = OFFICIAL_EVENTS.find(e => e.id === id || e.title.toLowerCase() === id.toLowerCase());
      if (found) return found.title;
      return id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const extractAmount = (data: any) => {
      const val = data?.receivedAmount ?? data?.paymentAmount ?? data?.amount ?? data?.price ?? 0;
      if (typeof val === 'number' && !isNaN(val)) return val;
      const parsed = parseFloat(String(val).replace(/[^\d.-]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    };

    for (const docSnap of batchDocs) {
      const reg = docSnap.data();
      const regId = docSnap.id;

      const dbDate = reg.registeredAt?.toDate?.() ?? (reg.createdAt?.toDate?.() ?? new Date());

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
      const unifiedData = extractRegistrationInfo(reg, regId);

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
        members: unifiedData.eventType === 'Team' && unifiedData.noOfTeammates !== 'N/A' 
          ? (Number(unifiedData.noOfTeammates) + 1) 
          : 1,
        amtPaid: String(extractAmount(reg)),
        paymentId: reg.paymentId || 'N/A',
        orderId: reg.orderId || 'N/A',
        settlementId: reg.settlementId || 'N/A',
        date: dbDate.toISOString(),
      };

      const result = await pushToSheet(excelWebhook, payload);

      if (result.success) {
        await adminDb.collection('registrations').doc(regId).update({
          sheetSynced: true,
          sheetSyncedAt: FieldValue.serverTimestamp(),
        }).catch(() => {});
        syncedCount++;
      } else {
        failedCount++;
        failures.push(`${reg.name} (${regId}): ${result.error}`);
        console.error(`Sheet sync failed for ${regId}:`, result.error);
      }
    }

    // Log the sync action in auditLogs
    await adminDb.collection('auditLogs').add({
      timestamp: FieldValue.serverTimestamp(),
      action: resyncAll ? 'SHEET_FULL_RESYNC' : 'SHEET_SYNC',
      performedBy: 'Admin (API Sync)',
      targetEntity: 'registrations',
      details: `Sheet sync batch (offset ${offset}, batch ${batchDocs.length}): ${syncedCount} synced, ${failedCount} failed.${failures.length ? ' Failures: ' + failures.join('; ') : ''}`,
    }).catch(() => {});

    return NextResponse.json({
      synced: syncedCount,
      failed: failedCount,
      failures,
      total: candidateDocs.length,
      offset: offset + batchDocs.length,
      hasMore,
      message: `${syncedCount} registration(s) synced to sheet.${failedCount > 0 ? ` ${failedCount} failed.` : ''}`,
    });
  } catch (error: any) {
    console.error('Sync sheet error:', error);
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}
