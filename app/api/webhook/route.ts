import { NextResponse, after } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';


import { verifyCashfreeSignature, cashfreeAppId, cashfreeSecretKey, isProd, isRateLimited } from '@/lib/security';
import { logSystemError } from '@/lib/errorAlertService';

export async function POST(req: Request) {
  try {
    // Rate limit webhook endpoint - legitimate Cashfree traffic is low volume;
    // this guards against DoS floods even before signature verification.
    const rawIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const ip = rawIp.split(',')[0].trim();
    if (isRateLimited(ip, 60, 60 * 1000)) {
      console.warn('Webhook rate limit exceeded for IP:', ip);
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const rawBody = await req.text();
    
    // Extract signature headers to prevent webhook spoofing attacks
    const signature = req.headers.get('x-webhook-signature') || '';
    const timestamp = req.headers.get('x-webhook-timestamp') || '';
    
    if (!cashfreeSecretKey) {
      console.error("CRITICAL SECURITY AUDIT: Webhook signature verification failed. Cashfree Secret Key is missing.");
      return NextResponse.json({ error: 'Signature verification failed: Missing secret key' }, { status: 500 });
    }
    if (!signature || !timestamp) {
      console.warn("Unauthorized: Missing Cashfree signature headers on webhook!");
      return NextResponse.json({ error: 'Missing security signature headers' }, { status: 401 });
    }
    const isValid = verifyCashfreeSignature(signature, rawBody, timestamp);
    if (!isValid) {
      console.error("CRITICAL SECURITY DANGER: Fake Cashfree Webhook signature mismatch detected!");
      // Log details to Firestore for diagnostic purposes
      await adminDb.collection('webhookLogs').add({
        timestamp: FieldValue.serverTimestamp(),
        ip,
        signature,
        timestampHeader: timestamp,
        rawBodyLength: rawBody.length,
        success: false,
        error: 'Signature verification failed',
        rawBodyPreview: rawBody.slice(0, 300)
      }).catch(err => console.error("Failed to log signature mismatch to Firestore:", err));
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
    }
    console.log("Cashfree Webhook signature successfully verified.");

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (err) {
      console.warn("Invalid or empty webhook JSON payload received:", rawBody);
      await adminDb.collection('webhookLogs').add({
        timestamp: FieldValue.serverTimestamp(),
        ip,
        signature,
        timestampHeader: timestamp,
        rawBodyLength: rawBody.length,
        success: false,
        error: 'Invalid JSON payload',
        rawBodyPreview: rawBody.slice(0, 300)
      }).catch(logErr => console.error("Failed to log JSON error to Firestore:", logErr));
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const eventType = payload.event || payload.type || '';
    const data = payload.data || {};
    const order = data.order || {};
    const payment = data.payment || {};
    const orderId = order.order_id || order.orderId || '';

    // Log the incoming verified webhook to Firestore for tracking
    await adminDb.collection('webhookLogs').add({
      timestamp: FieldValue.serverTimestamp(),
      ip,
      signature,
      timestampHeader: timestamp,
      rawBodyLength: rawBody.length,
      success: true,
      eventType,
      orderId
    }).catch(err => console.error("Failed to log success to Firestore:", err));
    console.log("Cashfree Webhook Received:", eventType);

    // Event deduplication check
    const eventId = String(payload.event_time ? `${eventType}_${orderId}_${payload.event_time}` : `${eventType}_${orderId}_${payment.cf_payment_id || 'event'}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    if (eventId) {
      const processedEventRef = adminDb.collection('processedWebhookEvents').doc(eventId);
      try {
        await processedEventRef.create({
          processedAt: FieldValue.serverTimestamp(),
          eventType,
          orderId
        });
      } catch (dupErr: any) {
        if (dupErr.code === 6 || dupErr.message?.includes('ALREADY_EXISTS')) {
          console.log(`Webhook event ${eventId} already processed. Returning idempotent 200 OK.`);
          return NextResponse.json({ success: true, message: "Event already processed" });
        }
      }
    }

    // 1. Check if it is a payment success event
    if (eventType === 'payment.success' || eventType === 'PAYMENT_SUCCESS' || eventType === 'PAYMENT_SUCCESS_WEBHOOK') {
      const paymentId = payment.cf_payment_id || payment.cfPaymentId || "";
      const paymentStatus = payment.payment_status || payment.paymentStatus || 'SUCCESS';
      const paymentAmount = Number(payment.payment_amount ?? payment.paymentAmount ?? order.order_amount ?? 0);
      const paymentCurrency = payment.payment_currency || payment.paymentCurrency || order.order_currency || 'INR';

      console.log(`Processing payment success webhook for Order: ${orderId}, Payment ID: ${paymentId}`);

      if (!orderId || !paymentId) {
        console.warn("Webhook missing orderId or paymentId:", { orderId, paymentId });
        return NextResponse.json({ error: 'Missing orderId or paymentId in webhook payload' }, { status: 400 });
      }

      if (paymentStatus !== 'SUCCESS') {
        console.warn(`Payment status is not SUCCESS for order ${orderId}: ${paymentStatus}`);
        return NextResponse.json({ success: false, message: `Payment status is ${paymentStatus}` }, { status: 400 });
      }

      const pendingRef = adminDb.collection('pendingRegistrations').doc(orderId);
      const pendingSnap = await pendingRef.get();
      
      if (!pendingSnap.exists) {
        console.warn(`No pending registration details found in Firestore for order ${orderId}`);
        return NextResponse.json({ error: 'Pending registration not found' }, { status: 404 });
      }

      const pendingData = pendingSnap.data();
      if (!pendingData) {
        console.warn(`Pending registration data is undefined for order ${orderId}`);
        return NextResponse.json({ error: 'Pending registration corrupted' }, { status: 400 });
      }

      // Check if order was already finalized
      if (pendingData.status === 'completed' && pendingData.registrationId) {
        console.log(`Registration for order ${orderId} already completed (ID: ${pendingData.registrationId}). Webhook idempotent ack.`);
        return NextResponse.json({ success: true, message: "Order already finalized" });
      }

      // Validate payment amount and currency against server-side pending record
      if (paymentCurrency !== 'INR') {
        console.error(`Invalid currency received in webhook for order ${orderId}: ${paymentCurrency}`);
        return NextResponse.json({ error: 'Currency mismatch' }, { status: 400 });
      }

      if (paymentAmount > 0 && pendingData.amount > 0 && Math.abs(paymentAmount - pendingData.amount) > 0.01 && paymentAmount < pendingData.amount) {
        console.error(`Payment amount mismatch in webhook: expected ${pendingData.amount}, got ${paymentAmount}`);
        return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
      }

      const { finalizeRegistration } = await import('@/lib/registrationHelper');
      const paymentIdStr = paymentId.toString();

      console.log(`Finalizing registration from webhook for order ${orderId}`);
      // Finalize registration atomically (delegating background tasks to run here if not already executed)
      const regId = await finalizeRegistration(pendingData.formData, paymentIdStr, orderId, false);
      
      await pendingRef.update({
        status: 'completed',
        registrationId: regId,
        completedAt: FieldValue.serverTimestamp()
      });

      console.log(`Successfully finalized pending registration for order ${orderId} via webhook. Registration ID: ${regId}`);
      return NextResponse.json({ success: true, message: "Payment processed successfully" });
    }

    // 2. Handle payment failure or cancellation without overwriting completed orders
    if (
      eventType === 'payment.failed' || 
      eventType === 'PAYMENT_FAILED_WEBHOOK' || 
      eventType === 'payment.user_dropped' || 
      eventType === 'PAYMENT_USER_DROPPED_WEBHOOK'
    ) {
      if (orderId) {
        const pendingRef = adminDb.collection('pendingRegistrations').doc(orderId);
        const pendingSnap = await pendingRef.get();
        if (pendingSnap.exists && pendingSnap.data()?.status === 'completed') {
          console.log(`Order ${orderId} already successfully completed. Ignoring subsequent failure webhook event.`);
          return NextResponse.json({ success: true, message: "Ignored late failure event on completed order" });
        }
        if (pendingSnap.exists) {
          await pendingRef.update({
            lastPaymentError: `Gateway reported ${eventType}`,
            lastPaymentErrorAt: FieldValue.serverTimestamp()
          }).catch(() => {});
        }
      }
      return NextResponse.json({ success: true, message: "Failure event noted" });
    }
    
    // 2. Check if it is a settlement success event
    // Support both older (SETTLEMENT_SUCCESS) and newer (settlement.success) event types
    if (eventType === 'SETTLEMENT_SUCCESS' || eventType === 'settlement.success' || eventType === 'SETTLEMENT_SUCCESS_WEBHOOK') {
      const data = payload.data || {};
      const settlement = data.settlement || {};
      const settlementId = settlement.settlement_id || data.settlement_id || data.settlementId || "N/A";
      
      console.log(`Processing settlement success webhook for Settlement ID: ${settlementId}`);
      
      if (settlementId === "N/A" || !settlementId) {
        console.warn("No valid settlement ID found in payload data:", data);
        return NextResponse.json({ success: false, error: "No settlement ID found" }, { status: 400 });
      }

      // Fetch all settled transactions for this settlement ID via Cashfree Recon API
      let transactions: any[] = [];
      try {
        const isProduction = isProd || process.env.NODE_ENV === 'production';
        const baseUrl = isProduction ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
        
        console.log(`Fetching recon transactions from Cashfree API for settlement: ${settlementId}`);
        const reconRes = await fetch(`${baseUrl}/recon`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': cashfreeAppId || '',
            'x-client-secret': cashfreeSecretKey || '',
            'x-api-version': '2023-08-01'
          },
          body: JSON.stringify({
            filters: {
              cf_settlement_ids: [parseInt(String(settlementId), 10)]
            }
          })
        });

        if (!reconRes.ok) {
          const errText = await reconRes.text();
          throw new Error(`Cashfree Recon API returned ${reconRes.status}: ${errText}`);
        }

        const reconPayload = await reconRes.json();
        const reconData = reconPayload.data || [];
        
        // Filter recon data for events of type PAYMENT
        transactions = reconData.filter((event: any) => event.event_type === 'PAYMENT');
        console.log(`Successfully fetched ${transactions.length} payment events for settlement ${settlementId}`);
      } catch (reconError: any) {
        console.error("Failed to fetch settlement transactions from Cashfree Recon API:", reconError);
        throw reconError;
      }
      
      const excelWebhook = process.env.EXCEL_SYNC_WEBHOOK_URL;
      
      for (const tx of transactions) {
        const orderId = tx.order_id || tx.orderId;
        const paymentId = tx.cf_payment_id || tx.cfPaymentId || tx.payment_id || tx.paymentId || "";
        
        if (!orderId) continue;
        
        console.log("Reconciling payment for Order:", orderId, "Payment ID:", paymentId);
        
        // 1. Update Firestore registration document using Admin SDK
        let docId = "";
        try {
          const querySnapshot = await adminDb.collection('registrations')
            .where('orderId', '==', orderId)
            .get();
          if (!querySnapshot.empty) {
            const docRef = querySnapshot.docs[0].ref;
            docId = querySnapshot.docs[0].id;
            await docRef.update({
              settlementId: String(settlementId)
            });
            console.log("Firestore registration updated for order:", orderId, "with Settlement ID:", settlementId);
          } else {
            console.warn("No Firestore registration found matching order:", orderId);
          }
        } catch (dbError) {
          console.error("Failed to update Firestore settlement for order:", orderId, dbError);
        }
        
        // 2. Forward reconciliation command to Google Sheets Web App
        if (excelWebhook) {
          try {
            const sheetRes = await fetch(excelWebhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'UPDATE_SETTLEMENT',
                orderId: orderId,
                paymentId: String(paymentId),
                settlementId: String(settlementId)
              })
            });
            const sheetResult = await sheetRes.json();
            console.log("Google Sheets reconciliation outcome for order:", orderId, sheetResult);
          } catch (sheetError) {
            console.error("Failed to reconcile Google Sheets for order:", orderId, sheetError);
          }
        }
      }
      
      return NextResponse.json({ success: true, message: `Settlement ${settlementId} reconciled successfully with ${transactions.length} payments.` });
    }
    
    return NextResponse.json({ success: true, message: "Event ignored" });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    await logSystemError({
      message: error?.message || 'Webhook processing failed',
      stack: error?.stack,
      path: '/api/webhook',
      type: 'Cashfree Webhook Error',
      method: 'POST',
      statusCode: 500,
      performedBy: 'System (Webhook)',
    });
    return NextResponse.json({ error: error.message || "Webhook processing failed" }, { status: 500 });
  }
}
