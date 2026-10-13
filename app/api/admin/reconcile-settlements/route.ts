import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { finalizeRegistration } from '@/lib/registrationHelper';
import nodemailer from 'nodemailer';
import { Cashfree, CFEnvironment } from 'cashfree-pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getFormattedISTDate(date: Date) {
  // Add 5.5 hours to convert UTC to IST
  const istTime = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  
  const yyyy = istTime.getUTCFullYear();
  const mm = pad(istTime.getUTCMonth() + 1);
  const dd = pad(istTime.getUTCDate());
  const hh = pad(istTime.getUTCHours());
  const min = pad(istTime.getUTCMinutes());
  const ss = pad(istTime.getUTCSeconds());

  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+05:30`;
}

async function sendSummaryEmail(
  runTime: Date,
  isManual: boolean,
  recovered: any[],
  reconciled: any[],
  remainingCount: number,
  checkedCount: number
) {
  try {
    const isProd = (process.env.NEXT_PUBLIC_CASHFREE_ENV || '').replace(/['"]/g, '').trim().toUpperCase() === 'PRODUCTION';
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.office365.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      tls: isProd ? {
        rejectUnauthorized: true
      } : {
        rejectUnauthorized: false
      },
      connectionTimeout: 8000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });

    const formattedDate = runTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    let recoveredRows = '';
    if (recovered.length === 0) {
      recoveredRows = '<tr><td colspan="5" style="text-align: center; padding: 8px;">No registrations recovered in this run.</td></tr>';
    } else {
      for (const item of recovered) {
        recoveredRows += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.email}</td>
            <td style="border: 1px solid #ddd; padding: 8px; font-family: monospace;">${item.orderId}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Rs. ${item.amount}</td>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: ${item.emailSent ? '#166534' : '#ef4444'}">
              ${item.emailSent ? 'Sent' : `Failed: ${item.emailError || 'Unknown error'}`}
            </td>
          </tr>
        `;
      }
    }

    let reconciledRows = '';
    if (reconciled.length === 0) {
      reconciledRows = '<tr><td colspan="4" style="text-align: center; padding: 8px;">No settlements reconciled in this run.</td></tr>';
    } else {
      for (const item of reconciled) {
        reconciledRows += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
            <td style="border: 1px solid #ddd; padding: 8px; font-family: monospace;">${item.orderId}</td>
            <td style="border: 1px solid #ddd; padding: 8px; font-family: monospace;">${item.settlementId}</td>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: ${item.sheetSynced ? '#166534' : '#ef4444'}">
              ${item.sheetSynced ? 'Synced' : 'Failed'}
            </td>
          </tr>
        `;
      }
    }

    const mailOptions = {
      from: `"Sabrang Reconciler" <${process.env.SMTP_FROM || ''}>`,
      to: process.env.SMTP_FROM || 'admin@jklu.edu.in',
      subject: `[Sabrang Reconciler] Daily Run Summary - ${runTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #7C3AED; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">Sabrang Reconciler Run Summary</h2>
            <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">Run time: ${formattedDate} IST | Mode: ${isManual ? 'Manual Trigger' : 'Cloud Scheduler (Cron)'}</p>
          </div>
          
          <div style="padding: 25px; background-color: #ffffff; color: #333333; line-height: 1.6;">
            <h3>Reconciliation Summary</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
              <tr style="background-color: #f8fafc;">
                <th style="border: 1px solid #ddd; padding: 10px; text-align: left; width: 220px;">Metric</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: center; width: 100px;">Count</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Description</th>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">Recovered Registrations</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold; color: #16a34a;">${recovered.length}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 13px;">Registrations finalized via active payment capture.</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">Reconciled Settlements</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold; color: #2563eb;">${reconciled.length}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 13px;">Existing registrations updated with Cashfree Settlement IDs.</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">Pending / Unsettled</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold; color: #d97706;">${remainingCount}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 13px;">Registrations still awaiting bank clearance.</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">Total Scanned Orders</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold;">${checkedCount}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 13px;">Total orders verified in this run.</td>
              </tr>
            </table>

            ${recovered.length > 0 ? `
              <h3>Recovered Registrations Detail</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
                <tr style="background-color: #f8fafc;">
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Name</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Email</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Order ID</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Payment ID</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Amount</th>
                </tr>
                ${recoveredRows}
              </table>
            ` : ''}

            ${reconciled.length > 0 ? `
              <h3>Reconciled Settlements Detail</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
                <tr style="background-color: #f8fafc;">
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Name</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Order ID</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Settlement ID</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Amount</th>
                </tr>
                ${reconciledRows}
              </table>
            ` : ''}
          </div>

          <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 11px; color: #777777; border-top: 1px solid #e2e8f0;">
            This is an automated run summary from the Sabrang Event Management Portal.
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log("[Recon API] Summary email successfully sent to devamgupta@jklu.edu.in");
  } catch (err: any) {
    console.error("[Recon API] Failed to send summary email:", err.message);
  }
}

async function performReconciliation(isManual: boolean) {
  const isProd = (process.env.NEXT_PUBLIC_CASHFREE_ENV || '').replace(/['"]/g, '').trim().toUpperCase() === 'PRODUCTION';
  const cashfreeAppId = isProd
    ? (process.env.CASHFREE_PROD_APP_ID || process.env.CASHFREE_APP_ID || '')
    : (process.env.CASHFREE_TEST_APP_ID || process.env.CASHFREE_APP_ID || '');
  const cashfreeSecretKey = isProd
    ? (process.env.CASHFREE_PROD_SECRET_KEY || process.env.CASHFREE_SECRET_KEY || '')
    : (process.env.CASHFREE_TEST_SECRET_KEY || process.env.CASHFREE_SECRET_KEY || '');
  
  const excelWebhook = process.env.EXCEL_SYNC_WEBHOOK_URL;
  const baseUrl = isProd ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

  // 1. Check if the daily service is enabled (only applicable for automated cron runs)
  if (!isManual) {
    const settingsDoc = await adminDb.collection('settings').doc('settlementReconciler').get();
    const isEnabled = settingsDoc.exists ? settingsDoc.data()?.enabled !== false : true;
    if (!isEnabled) {
      return {
        success: true,
        checkedCount: 0,
        updatedCount: 0,
        message: 'Automated daily settlement reconciliation is currently disabled.'
      };
    }
  }

  const recoveredList: any[] = [];
  const now = new Date();
  const pendingRegs: any[] = [];

  console.log(`[Recon API] Fetching all registrations to build in-memory index...`);
  const regSnap = await adminDb.collection('registrations').get();
  const existingOrderIds = new Set<string>();
  regSnap.forEach(doc => {
    const data = doc.data();
    if (data.orderId) {
      existingOrderIds.add(data.orderId);
    }
  });

  // 1a. Direct Scan of recent pendingRegistrations (past 48 hours)
  console.log(`[Recon API] Scanning pendingRegistrations from the past 48 hours directly on Cashfree...`);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  
  try {
    const pendingScanSnap = await adminDb.collection('pendingRegistrations')
      .where('createdAt', '>=', fortyEightHoursAgo)
      .get();
    
    const pendingDocs = pendingScanSnap.docs.filter(doc => {
      const data = doc.data();
      const orderId = doc.id;
      return data.status !== 'completed' && !existingOrderIds.has(orderId);
    });

    console.log(`[Recon API] Found ${pendingScanSnap.size} total pending registrations (checking ${pendingDocs.length} unpaid/uncompleted).`);

    if (pendingDocs.length > 0) {
      const cashfree = new Cashfree(
        isProd ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
        cashfreeAppId,
        cashfreeSecretKey
      );
      cashfree.XApiVersion = '2023-08-01';

      // Concurrency rate limiting: process 5 checks in parallel at a time
      const concurrencyLimit = 5;
      const chunks = [];
      for (let i = 0; i < pendingDocs.length; i += concurrencyLimit) {
        chunks.push(pendingDocs.slice(i, i + concurrencyLimit));
      }

      for (const chunk of chunks) {
        await Promise.all(chunk.map(async (doc) => {
          const orderId = doc.id;
          const pendingData = doc.data();
          const formData = pendingData?.formData;
          
          if (!formData) return;

          // Skip test/low-amount transactions and transactions by Devam Gupta
          const name = (formData.name || '').toLowerCase();
          const email = (formData.email || '').toLowerCase();
          const phone = formData.mobile || '';
          const rollNo = formData.registrationNumber || '';
          const amountVal = pendingData?.amount || parseFloat(formData.receivedAmount || formData.paymentAmount || '0');

          const isTestAmount = amountVal <= 10;
          const isDevamUser = name.includes('devam') || name.includes('gupta') || email.includes('devamg759') || email.includes('devamgupta');
          const isTestPhoneOrRoll = phone === '7340015201' || rollNo.includes('9999') || rollNo.includes('0765');

          if (isTestAmount || isDevamUser || isTestPhoneOrRoll) {
            return;
          }

          console.log(`[Recon API - 48h Scan] Checking order ${orderId} status directly on Cashfree...`);
          try {
            const cfResponse = await cashfree.PGOrderFetchPayments(orderId);
            const payments = cfResponse.data || [];
            const successPayment = payments.find((p: any) => p.payment_status === 'SUCCESS') as any;

            if (successPayment) {
              console.log(`[Recon API - 48h Scan] Found successful payment for stuck order ${orderId}. Recovering...`);
              
              const paymentId = successPayment.cf_payment_id;
              let paymentDate = new Date();
              if (successPayment.payment_time) {
                const parsed = new Date(successPayment.payment_time);
                if (!isNaN(parsed.getTime())) {
                  paymentDate = parsed;
                }
              }

              const docId = await finalizeRegistration(
                formData,
                String(paymentId),
                orderId,
                false // Run background tasks (emails/PDFs)
              );

              if (docId) {
                existingOrderIds.add(orderId);
                
                // Add to pendingRegs to reconcile immediately if settled
                pendingRegs.push({
                  docId: docId,
                  orderId: orderId,
                  name: formData.name,
                  paymentId: String(paymentId)
                });

                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const istDate = new Date(paymentDate.getTime() + (5.5 * 60 * 60 * 1000));
                const day = istDate.getUTCDate();
                const month = months[istDate.getUTCMonth()];
                const year = istDate.getUTCFullYear().toString().slice(-2);
                
                const dateOfPayment = `${day}-${month}-${year}`;
                const dateGroup = `${day}-${month}`;

                await adminDb.collection('registrations').doc(docId).update({
                  registeredAt: paymentDate,
                  dateOfPayment,
                  dateGroup
                });
                console.log(`[Recon API - 48h Scan] Backdated recovered registration ${docId} to payment time: ${paymentDate.toISOString()}`);
              }

              // Update pending doc to completed
              await doc.ref.update({
                status: 'completed',
                completedAt: FieldValue.serverTimestamp()
              });

              // Add to audit logs
              await adminDb.collection('auditLogs').add({
                timestamp: FieldValue.serverTimestamp(),
                action: 'REGISTRATION_RECOVER',
                performedBy: isManual ? 'Admin Console (48h Direct Scan)' : 'Cloud Scheduler (48h Direct Scan)',
                targetEntity: `registration/${docId || orderId}`,
                details: `Automated recovery of missing registration for ${formData.name} after direct 48-hour Cashfree check.`
              }).catch(() => {});

              recoveredList.push({
                name: formData.name,
                email: formData.email,
                orderId: orderId,
                amount: amountVal,
                emailSent: true,
                emailError: null
              });
            }
          } catch (cfErr: any) {
            console.error(`[Recon API - 48h Scan] Failed to check status for orderId ${orderId}:`, cfErr.message);
          }
        }));
      }
    }
  } catch (scanError: any) {
    console.error(`[Recon API] Error during 48h direct scan:`, scanError.message);
  }

  // 2. Query Cashfree Recon API for the last 14 days (rolling window)
  const end_date = getFormattedISTDate(now);
  
  // 14 days ago
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const istFourteenDaysAgo = new Date(fourteenDaysAgo.getTime() + (5.5 * 60 * 60 * 1000));
  istFourteenDaysAgo.setUTCHours(0, 0, 0, 0); // Midnight IST
  const startUTC = new Date(istFourteenDaysAgo.getTime() - (5.5 * 60 * 60 * 1000));
  const start_date = getFormattedISTDate(startUTC);

  console.log(`[Recon API] Querying Cashfree Recon API from ${start_date} to ${end_date}`);

  let allEvents: any[] = [];
  let cursor: string | null = null;
  let hasMore = true;
  let pageCount = 1;

  while (hasMore) {
    console.log(`[Recon API] Fetching page ${pageCount}...`);
    const reqBody: any = {
      filters: {
        start_date: start_date,
        end_date: end_date
      },
      pagination: {
        limit: 100
      }
    };

    if (cursor) {
      reqBody.pagination.cursor = cursor;
    }

    const res = await fetch(`${baseUrl}/recon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': cashfreeAppId || '',
        'x-client-secret': cashfreeSecretKey || '',
        'x-api-version': '2023-08-01'
      },
      body: JSON.stringify(reqBody)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Cashfree Recon API returned ${res.status}: ${errText}`);
    }

    const payload = await res.json();
    const pageData = payload.data || [];
    console.log(`[Recon API] Page ${pageCount} returned ${pageData.length} events.`);
    allEvents = allEvents.concat(pageData);

    cursor = payload.cursor || null;
    if (!cursor || pageData.length < 100 || pageCount >= 10) { // Safety limit of 10 pages
      hasMore = false;
    } else {
      pageCount++;
      // Small throttle delay between pages
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  // Map settled payment events by order_id
  const settledMap = new Map<string, { settlementId: string; paymentId: string }>();
  for (const event of allEvents) {
    const settlementId = event.cf_settlement_id || event.settlement_id;
    const orderId = event.order_id;
    const paymentId = event.cf_payment_id || event.payment_id;
    const transferUtr = event.transfer_utr || event.settlement_utr || null;

    if (event.event_type === 'PAYMENT' && orderId && settlementId && settlementId !== 'N/A' && settlementId !== 'Pending' && transferUtr) {
      settledMap.set(orderId, {
        settlementId: String(settlementId),
        paymentId: String(paymentId)
      });
    }
  }

  console.log(`[Recon API] Total settled payment records in the 14-day window: ${settledMap.size}`);

  // 3. Scan for successful Cashfree payments that failed to create a registration in Firestore
  console.log(`[Recon API] Scanning for successful payments with missing registrations...`);
  
  for (const event of allEvents) {
    if (event.event_type !== 'PAYMENT' || event.event_status !== 'SUCCESS') continue;

    const orderId = event.order_id;
    const paymentId = event.cf_payment_id || event.payment_id;
    if (!orderId || !paymentId) continue;

    // Check if registration exists using in-memory Set
    if (existingOrderIds.has(orderId)) {
      continue;
    }

    // Missing registration! Check if we have pending data to recover from
    const pendingDoc = await adminDb.collection('pendingRegistrations').doc(orderId).get();
    if (pendingDoc.exists) {
      const pendingData = pendingDoc.data();
      const formData = pendingData?.formData;

      if (formData) {
        // Skip test/low-amount transactions and transactions by Devam Gupta
        const name = (formData.name || '').toLowerCase();
        const email = (formData.email || '').toLowerCase();
        const phone = formData.mobile || '';
        const rollNo = formData.registrationNumber || '';
        const amountVal = pendingData?.amount || parseFloat(formData.receivedAmount || formData.paymentAmount || '0');

        const isTestAmount = amountVal <= 10;
        const isDevamUser = name.includes('devam') || name.includes('gupta') || email.includes('devamg759') || email.includes('devamgupta');
        const isTestPhoneOrRoll = phone === '7340015201' || rollNo.includes('9999') || rollNo.includes('0765');

        if (isTestAmount || isDevamUser || isTestPhoneOrRoll) {
          console.log(`[Recon API] Skipping test registration recovery for Order: ${orderId} (Student: ${formData.name}, Email: ${formData.email})`);
          continue;
        }

        console.log(`[Recon API] Found stuck successful payment! Recovering registration for ${formData.name} (Order: ${orderId})`);
        
        let paymentDate: Date | undefined = undefined;
        if (event.event_time) {
          const parsed = new Date(event.event_time);
          if (!isNaN(parsed.getTime())) {
            paymentDate = parsed;
          }
        }

        try {
          const docId = await finalizeRegistration(
            formData,
            String(paymentId),
            orderId,
            false // Run post-registration tasks (sends ticket email!)
          );

          if (docId) {
            existingOrderIds.add(orderId);

            // Add to pendingRegs to reconcile immediately if settled
            pendingRegs.push({
              docId: docId,
              orderId: orderId,
              name: formData.name,
              paymentId: String(paymentId)
            });

            if (paymentDate) {
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const istDate = new Date(paymentDate.getTime() + (5.5 * 60 * 60 * 1000));
              const day = istDate.getUTCDate();
              const month = months[istDate.getUTCMonth()];
              const year = istDate.getUTCFullYear().toString().slice(-2);
              
              const dateOfPayment = `${day}-${month}-${year}`;
              const dateGroup = `${day}-${month}`;

              await adminDb.collection('registrations').doc(docId).update({
                registeredAt: paymentDate,
                dateOfPayment,
                dateGroup
              });
              console.log(`[Recon API] Backdated recovered registration ${docId} to payment time: ${paymentDate.toISOString()}`);
            }
          }

          // Fetch registration doc to verify if ticket email was successfully sent
          let emailSent = false;
          let emailError = null;
          if (docId) {
            const regDoc = await adminDb.collection('registrations').doc(docId).get();
            const regData = regDoc.data();
            if (regData) {
              emailSent = regData.emailSent === true;
              emailError = regData.emailError || null;
            }
          }

          await pendingDoc.ref.update({
            status: 'completed',
            completedAt: FieldValue.serverTimestamp()
          });

          await adminDb.collection('auditLogs').add({
            timestamp: FieldValue.serverTimestamp(),
            action: 'REGISTRATION_RECOVER',
            performedBy: isManual ? 'Admin Console (Manual)' : 'Cloud Scheduler (Cron)',
            targetEntity: `registration/${docId || orderId}`,
            details: `Automated recovery of missing registration for ${formData.name} after successful Cashfree transaction.`
          }).catch(() => {});

          recoveredList.push({
            name: formData.name,
            email: formData.email,
            orderId: orderId,
            amount: amountVal,
            emailSent,
            emailError
          });

        } catch (err: any) {
          console.error(`[Recon API] Failed to recover registration for order ${orderId}:`, err.message);
        }
      }
    }
  }

  if (recoveredList.length > 0) {
    console.log(`[Recon API] Successfully recovered ${recoveredList.length} registration(s).`);
  }

  // 4. Extract registrations with pending/missing settlement IDs from regSnap
  regSnap.forEach(doc => {
    const data = doc.data();
    const settlementId = data.settlementId;
    
    if (!settlementId || settlementId === 'Pending' || settlementId === 'N/A' || settlementId === '') {
      pendingRegs.push({
        docId: doc.id,
        orderId: data.orderId,
        name: data.name,
        paymentId: data.paymentId || ''
      });
    }
  });

  const reconciledList: any[] = [];

  if (pendingRegs.length > 0) {
    console.log(`[Recon API] Found ${pendingRegs.length} registrations pending settlement reconciliation.`);

    // Match pending registrations with settled map and update
    for (const reg of pendingRegs) {
      const match = settledMap.get(reg.orderId);
      if (match) {
        console.log(`[Recon API] Reconciled Order: ${reg.orderId} (Student: ${reg.name}) with Settlement ID: ${match.settlementId}`);
        
        // 1. Update Firestore
        await adminDb.collection('registrations').doc(reg.docId).update({
          settlementId: match.settlementId
        });

        // 2. Sync to Sheets
        let sheetSynced = false;
        if (excelWebhook) {
          try {
            const sheetRes = await fetch(excelWebhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'UPDATE_SETTLEMENT',
                orderId: reg.orderId,
                paymentId: match.paymentId || String(reg.paymentId),
                settlementId: match.settlementId
              })
            });
            if (sheetRes.ok) {
              const sheetResult = await sheetRes.json();
              if (sheetResult.success) {
                sheetSynced = true;
              }
            }
          } catch (sheetError) {
            console.error(`[Recon API] Failed to update Google Sheets for order ${reg.orderId}:`, sheetError);
          }
        }

        reconciledList.push({
          name: reg.name,
          orderId: reg.orderId,
          settlementId: match.settlementId,
          sheetSynced
        });
      }
    }
  }

  // Log the sync action in auditLogs
  if (reconciledList.length > 0 || recoveredList.length > 0) {
    await adminDb.collection('auditLogs').add({
      timestamp: FieldValue.serverTimestamp(),
      action: 'SETTLEMENT_RECONCILE',
      performedBy: isManual ? 'Admin Console (Manual)' : 'Cloud Scheduler (Cron)',
      targetEntity: 'registrations',
      details: `Automated sync: Recovered ${recoveredList.length} missing registration(s) and reconciled ${reconciledList.length} settlement ID(s) via Cashfree Recon API.`
    }).catch(() => {});
  }

  // Send summary email to Devam Gupta stating everything
  await sendSummaryEmail(
    now,
    isManual,
    recoveredList,
    reconciledList,
    Math.max(0, pendingRegs.length - reconciledList.length),
    pendingRegs.length
  );

  return {
    success: true,
    checkedCount: pendingRegs.length,
    updatedCount: reconciledList.length,
    recoveredCount: recoveredList.length,
    remainingCount: Math.max(0, pendingRegs.length - reconciledList.length),
    message: `Checked ${pendingRegs.length} pending records. Recovered ${recoveredList.length} missing registration(s) and updated ${reconciledList.length} settled transaction(s) using Recon API.`
  };
}

// GET method for Google Cloud Scheduler / Cron-Job.org triggers
export async function GET(req: Request) {
  try {
    const { verifyCronSecret } = await import('@/lib/auth/serverAuth');
    if (!verifyCronSecret(req)) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid cron authorization secret.' },
        { status: 401 }
      );
    }

    const result = await performReconciliation(false);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Automated reconcile settlements GET error:', error);
    return NextResponse.json({ error: error.message || 'Reconciliation failed' }, { status: 500 });
  }
}

// POST method for manual triggers from the Admin Dashboard
export async function POST(req: Request) {
  try {
    const { verifyAdmin } = await import('@/lib/auth/serverAuth');
    const authCheck = await verifyAdmin(req);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const body = await req.json().catch(() => ({}));
    const isManual = body.manual !== false; // defaults to manual true
    
    const result = await performReconciliation(isManual);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Manual reconcile settlements POST error:', error);
    return NextResponse.json({ error: error.message || 'Reconciliation failed' }, { status: 500 });
  }
}
