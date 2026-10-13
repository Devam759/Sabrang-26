import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { generatePDF, sendEmail } from '@/lib/registrationHelper';
import { logSystemError } from '@/lib/errorAlertService';
import { verifyAdmin } from '@/lib/auth/serverAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const authCheck = await verifyAdmin(req);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const body = await req.json().catch(() => ({}));
    const { ids, sendAllUnsent } = body;

    let targetDocs: any[] = [];

    let hasMore = false;

    if (ids && Array.isArray(ids) && ids.length > 0) {
      console.log(`Manual email trigger requested for ${ids.length} specific IDs.`);
      for (const id of ids) {
        const docSnap = await adminDb.collection('registrations').doc(id).get();
        if (docSnap.exists) {
          targetDocs.push(docSnap);
        }
      }
    } else if (sendAllUnsent) {
      console.log("Manual email trigger requested for all unsent registrations.");
      // Fetch all registrations
      const allRegs = await adminDb.collection('registrations').get();
      // Filter in-memory to avoid needing a composite index
      const unsent = allRegs.docs.filter(doc => {
        const data = doc.data();
        return data.emailSent !== true;
      });
      const BATCH_SIZE = 5;
      targetDocs = unsent.slice(0, BATCH_SIZE);
      hasMore = unsent.length > BATCH_SIZE;
    } else {
      return NextResponse.json({ error: 'Invalid parameters. Please specify ids or sendAllUnsent.' }, { status: 400 });
    }

    if (targetDocs.length === 0) {
      return NextResponse.json({ success: true, sentCount: 0, hasMore: false, message: 'No unsent registrations found.' });
    }

    console.log(`Beginning manual email dispatch for ${targetDocs.length} records.`);
    let successCount = 0;
    let failCount = 0;
    const failures: string[] = [];

    for (const doc of targetDocs) {
      const regData = doc.data();
      const regId = doc.id;

      try {
        console.log(`Sending email to ${regData.name} (${regData.email}) for order ${regData.orderId}...`);
        
        // 1. Generate receipt
        const pdfBytes = await generatePDF(
          regData,
          regId,
          regData.paymentId || 'N/A',
          regData.orderId || 'N/A',
          regData.dateOfPayment
        );

        // 2. Dispatch email
        await sendEmail(regData.email, regData.name, pdfBytes);
        console.log(`Email successfully sent to ${regData.email}.`);

        // 3. Update database
        await doc.ref.update({
          emailSent: true,
          emailSentAt: FieldValue.serverTimestamp(),
          emailError: null
        });

        // 4. Log in audit logs
        await adminDb.collection('auditLogs').add({
          timestamp: FieldValue.serverTimestamp(),
          action: 'EMAIL_RESEND',
          performedBy: 'Admin Console',
          targetEntity: `registration/${regId}`,
          details: `Resent registration confirmation email to ${regData.email} via admin console.`
        });

        successCount++;
      } catch (err: any) {
        console.error(`Failed to send email to ${regData.email}:`, err);
        
        // Update database with error
        await doc.ref.update({
          emailSent: false,
          emailError: err.message || String(err)
        }).catch(() => {});

        failures.push(`${regData.name} (${regData.email}): ${err.message || err}`);
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      sentCount: successCount,
      failedCount: failCount,
      failures,
      hasMore,
      message: `Dispatched ${successCount} emails successfully.${failCount > 0 ? ` ${failCount} failed.` : ''}`
    });

  } catch (error: any) {
    console.error("Resend emails endpoint error:", error);
    await logSystemError({
      message: error?.message || 'Resend emails endpoint error',
      stack: error?.stack,
      path: '/api/admin/resend-emails',
      type: 'Batch Resend Emails Error',
      method: 'POST',
      statusCode: 500,
      performedBy: 'System (Resend Emails API)',
    });
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
