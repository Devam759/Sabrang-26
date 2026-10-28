import { NextResponse, after } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { finalizeRegistration } from '@/lib/registrationHelper';
import { validateRegistrationNumber } from '@/lib/utils';
import { logSystemError } from '@/lib/errorAlertService';

import { isRateLimited, sanitizeObject, isProd, cashfreeAppId, cashfreeSecretKey, formatPhoneNumber } from '@/lib/security';
import { calculateTotalRegistrationFee, isEventRegistrationClosed } from '@/lib/eventPricing';

// Initialize Cashfree
const cashfree = new Cashfree(
  isProd ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
  cashfreeAppId,
  cashfreeSecretKey
);
cashfree.XApiVersion = '2023-08-01';

// Server-side in-memory cache for resolved pincodes to ensure 0ms latency on repeated queries
const pincodeCache = new Map<string, any>();

/** Decode HTML entities introduced by sanitizeInput back to plain text for fields
 * that go to Cashfree (name, email). Cashfree rejects HTML-encoded strings. */
function decodeHtmlEntities(str: string): string {
  if (!str || typeof str !== 'string') return str;
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&quot;': '"',
    '&#039;': "'",
    '&lt;': '<',
    '&gt;': '>'
  };
  return str.replace(/&amp;|&quot;|&#039;|&lt;|&gt;/g, (match) => entities[match] || match);
}

export async function POST(req: Request) {
  try {
    const rawIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const ip = rawIp.split(',')[0].trim(); // Take only the first (leftmost) IP - prevent x-forwarded-for spoofing

    // Rate limit is applied AFTER we know the action, so lightweight lookups
    // (pincode/coupon) don't exhaust the quota that CREATE_ORDER needs.
    // We still apply a broad guard here to reject obvious floods before parsing body.
    if (isRateLimited(ip, 30, 60 * 1000)) {
      return NextResponse.json({ error: 'Too many attempts. Please try again in a minute.' }, { status: 429 });
    }

    let body;
    try {
      body = await req.json();
    } catch (err) {
      console.warn("Invalid or empty registration JSON body received:", err);
      return NextResponse.json({ error: 'Invalid or empty JSON payload' }, { status: 400 });
    }
    const { action, honeypot, ...rawData } = body;
    
    if (rawData.mobile) rawData.mobile = formatPhoneNumber(rawData.mobile);
    if (rawData.fatherMobile) rawData.fatherMobile = formatPhoneNumber(rawData.fatherMobile);
    if (rawData.motherMobile) rawData.motherMobile = formatPhoneNumber(rawData.motherMobile);
    if (rawData.parentPhone) rawData.parentPhone = formatPhoneNumber(rawData.parentPhone);

    // Use unified security sanitization to prevent XSS script injection
    const data = sanitizeObject(rawData);

    if (honeypot) {
      console.warn("Honeypot triggered by IP:", ip);
      return NextResponse.json({ error: 'Bot detected' }, { status: 400 });
    }

    const checkCoupon = async (
      code: string, 
      originalPrice: number = 500, 
      eventIdOrTitle?: string,
      context?: import('@/lib/couponHelper').CouponCalculationContext
    ) => {
      if (!code) return { valid: false, amount: originalPrice, finalPrice: originalPrice, error: 'No coupon code provided.' };
      try {
        const lowerCode = code.trim().toLowerCase();
        const upperCode = code.trim().toUpperCase();
        
        let docSnap = await adminDb.collection('coupons').doc(lowerCode).get();
        if (!docSnap.exists) {
          docSnap = await adminDb.collection('coupons').doc(upperCode).get();
        }

        if (docSnap.exists) {
          const couponData = docSnap.data();
          const { calculateCouponDiscount } = await import('@/lib/couponHelper');
          const res = calculateCouponDiscount(couponData, originalPrice, eventIdOrTitle, context);
          return {
            valid: res.valid,
            amount: res.finalPrice,
            finalPrice: res.finalPrice,
            discountAmount: res.discountAmount,
            discountType: res.discountType,
            discountValue: res.discountValue,
            error: res.error,
            applicableEvents: res.applicableEvents,
          };
        }
      } catch (err) {
        console.error("Error fetching coupon:", err);
      }
      return { valid: false, amount: originalPrice, finalPrice: originalPrice, error: 'Invalid or expired coupon code.' };
    };

    if (action === 'VERIFY_COUPON') {
      // Coupon checks: max 10 per minute per IP (generous for legitimate users)
      if (isRateLimited(`${ip}:coupon`, 10, 60 * 1000)) {
        return NextResponse.json({ error: 'Too many coupon attempts. Please wait a moment.' }, { status: 429 });
      }
      const code = (data.coupon || '').trim().toUpperCase();
      const eventTarget = data.eventId || data.event || data.eventName || data.eventTitle || '';
      
      const eventList = Array.isArray(data.selectedEvents) && data.selectedEvents.length > 0
        ? data.selectedEvents
        : (data.eventId ? [data.eventId] : []);

      
      // Fetch Early Bird Settings
      const settingsRef = adminDb.collection('settings').doc('earlyBird');
      const settingsSnap = await settingsRef.get();
      const isEarlyBird = settingsSnap.exists ? settingsSnap.data()?.active : false;

      let basePrice = calculateTotalRegistrationFee(eventList, data.teamMembers, data.visitorConfig, isEarlyBird);
      if (basePrice <= 0 && typeof data.basePrice === 'number' && data.basePrice > 0) {
        basePrice = data.basePrice;
      }
      if (basePrice <= 0) {
        basePrice = 500;
      }

      const couponStatus = await checkCoupon(code, basePrice, eventTarget, {
        selectedEvents: eventList,
        teamMembers: data.teamMembers,
        visitorConfig: data.visitorConfig,
        isEarlyBird,
      });
      return NextResponse.json(couponStatus);
    }

    if (action === 'VERIFY_PINCODE') {
      const pin = (data.pincode || '').trim();
      if (pin.length === 6 && /^\d+$/.test(pin)) {
        // 1. Check in-memory cache
        if (pincodeCache.has(pin)) {
          console.log(`Pincode cache hit for ${pin}.`);
          return NextResponse.json(pincodeCache.get(pin));
        }

        try {
          console.log(`Proxying pincode request for ${pin} to India Post API...`);
          
          // Enforce a strict 2.5-second API timeout so client is not blocked indefinitely
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const postalData = await res.json();
            // Store successful lookup in cache
            if (postalData && postalData[0]?.Status === 'Success') {
              pincodeCache.set(pin, postalData);
            }
            return NextResponse.json(postalData);
          }
        } catch (err: any) {
          console.error("Error proxying pincode API request:", err.name === 'AbortError' ? 'Timeout (took > 2.5s)' : err);
        }
      }
      return NextResponse.json([{ Status: 'Error', Message: 'Failed to verify pincode or timeout' }]);
    }


    if (action === 'CREATE_ORDER') {
      // Registration for all events is officially closed
      return NextResponse.json(
        { error: 'Registration for all events is officially closed.' },
        { status: 400 }
      );
    }

    if (action === 'VERIFY_PAYMENT') {
      const { orderId } = data;

      // Validate orderId format before using as a Firestore document ID
      // Cashfree order IDs must match: order_<digits/uuid> (e.g. order_1234567890)
      if (!orderId || typeof orderId !== 'string' || !/^order_[0-9a-zA-Z_\-]{1,50}$/.test(orderId.trim())) {
        console.warn('Invalid orderId format rejected:', orderId);
        return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 });
      }
      const sanitizedOrderId = orderId.trim();
      console.log("Verifying payment securely for order:", sanitizedOrderId);
      
      // Fetch the secure pending registration details from Firestore using Admin SDK
      const pendingRef = adminDb.collection('pendingRegistrations').doc(sanitizedOrderId);
      const pendingSnap = await pendingRef.get();
      if (!pendingSnap.exists) {
        console.warn(`No pending registration details found in Firestore for order ${sanitizedOrderId}`);
        return NextResponse.json({ error: 'Pending registration details not found' }, { status: 404 });
      }

      const pendingData = pendingSnap.data();
      if (!pendingData) {
        return NextResponse.json({ error: 'Pending registration details are invalid' }, { status: 400 });
      }
      const dbFormData = pendingData.formData;

      // 1. Fast Path: Check if order was ALREADY completed (Idempotency)
      if (pendingData.status === 'completed' && pendingData.registrationId) {
        console.log(`Order ${sanitizedOrderId} already completed with registration ID: ${pendingData.registrationId}. Returning existing registration.`);
        const { createReceiptToken } = await import('@/lib/security');
        const token = createReceiptToken(pendingData.registrationId, sanitizedOrderId);
        return NextResponse.json({ 
          success: true, 
          id: pendingData.registrationId, 
          email: dbFormData?.email,
          token,
          alreadyCompleted: true
        });
      }

      // Check registrationLocks collection as well
      const lockRef = adminDb.collection('registrationLocks').doc(sanitizedOrderId);
      const lockSnap = await lockRef.get();
      if (lockSnap.exists && lockSnap.data()?.registrationId) {
        const existingId = lockSnap.data()!.registrationId;
        console.log(`Order ${sanitizedOrderId} lock already finalized with ID: ${existingId}. Returning existing registration.`);
        await pendingRef.update({
          status: 'completed',
          registrationId: existingId,
          completedAt: FieldValue.serverTimestamp()
        }).catch(() => {});
        const { createReceiptToken } = await import('@/lib/security');
        const token = createReceiptToken(existingId, sanitizedOrderId);
        return NextResponse.json({ 
          success: true, 
          id: existingId, 
          email: dbFormData?.email,
          token,
          alreadyCompleted: true
        });
      }

      let paymentIdStr = "";

      // 2. Handle Zero-Amount (100% discount / free) registration under strict server-authorized policy
      if (pendingData.amount === 0) {
        // Enforce server-side price re-verification: Do NOT trust client-submitted zero amounts
        const couponCode = (dbFormData.coupon || '').trim().toUpperCase();
        const eventTarget = dbFormData.eventId || dbFormData.event || dbFormData.eventName || dbFormData.eventTitle || '';
        const eventList = Array.isArray(dbFormData.selectedEvents) && dbFormData.selectedEvents.length > 0
          ? dbFormData.selectedEvents
          : (dbFormData.eventId ? [dbFormData.eventId] : []);

        const settingsRef = adminDb.collection('settings').doc('earlyBird');
        const settingsSnap = await settingsRef.get();
        const isEarlyBird = settingsSnap.exists ? settingsSnap.data()?.active : false;

        let originalBasePrice = calculateTotalRegistrationFee(eventList, dbFormData.teamMembers, dbFormData.visitorConfig, isEarlyBird);
        if (originalBasePrice <= 0 && typeof dbFormData.basePrice === 'number' && dbFormData.basePrice > 0) {
          originalBasePrice = dbFormData.basePrice;
        }

        let calculatedAmount = originalBasePrice;
        if (couponCode) {
          const couponBasePrice = originalBasePrice <= 0 ? 500 : originalBasePrice;
          const couponStatus = await checkCoupon(couponCode, couponBasePrice, eventTarget, {
            selectedEvents: eventList,
            teamMembers: dbFormData.teamMembers,
            visitorConfig: dbFormData.visitorConfig,
            isEarlyBird,
          });
          if (couponStatus.valid) {
            calculatedAmount = couponStatus.finalPrice;
            paymentIdStr = `FREE_COUPON_${couponCode}`;
          } else {
            calculatedAmount = originalBasePrice;
          }
        } else {
          paymentIdStr = 'FREE_REGISTRATION';
        }

        if (calculatedAmount !== 0) {
          console.error(`Fraud alert: Order ${sanitizedOrderId} claimed amount 0 but server recalculated amount is ${calculatedAmount}`);
          return NextResponse.json({ error: 'Zero-amount registration is unauthorized or coupon is no longer valid.' }, { status: 400 });
        }

        if (!paymentIdStr) {
          paymentIdStr = 'FREE_REGISTRATION';
        }
      } else {
        // 3. For paid orders: Verify strictly against Cashfree Gateway (both Sandbox & Production)
        if (!cashfreeAppId || !cashfreeSecretKey) {
          console.error("Cashfree API credentials missing on server.");
          return NextResponse.json({ error: 'Payment gateway configuration is missing. Please contact support.' }, { status: 500 });
        }

        let paymentsResponse;
        try {
          paymentsResponse = await cashfree.PGOrderFetchPayments(sanitizedOrderId);
        } catch (fetchErr: any) {
          console.error("Cashfree PGOrderFetchPayments error:", fetchErr.response?.data || fetchErr.message);
          return NextResponse.json({ error: 'Unable to verify payment with payment gateway. Please try again.' }, { status: 502 });
        }

        const payments = paymentsResponse.data;
        if (!Array.isArray(payments) || payments.length === 0) {
          console.warn("No payments found on gateway for order:", sanitizedOrderId);
          return NextResponse.json({ error: 'No payment attempts found for this order.' }, { status: 400 });
        }

        // Authoritative payment status validation
        const successPayment = payments.find((p: any) => p.payment_status === 'SUCCESS');
        if (!successPayment) {
          const pendingPayment = payments.find((p: any) => p.payment_status === 'PENDING');
          if (pendingPayment) {
            return NextResponse.json({ error: 'Payment is still pending confirmation by your bank. Please wait a moment.' }, { status: 400 });
          }
          const failedPayment = payments.find((p: any) => 
            p.payment_status === 'FAILED' || p.payment_status === 'CANCELLED' || p.payment_status === 'USER_DROPPED'
          );
          if (failedPayment) {
            const statusStr = String(failedPayment.payment_status || 'failed').toLowerCase().replace(/_/g, ' ');
            return NextResponse.json({ error: `Payment ${statusStr}. Please try again.` }, { status: 400 });
          }
          console.warn("No successful payment found for order:", sanitizedOrderId);
          return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
        }

        // Validate currency and amount
        const paidAmount = Number(successPayment.payment_amount || 0);
        const paidCurrency = successPayment.payment_currency || 'INR';

        if (paidCurrency !== 'INR') {
          console.error(`Invalid payment currency: expected INR, got ${paidCurrency}`);
          return NextResponse.json({ error: 'Invalid payment currency.' }, { status: 400 });
        }

        if (Math.abs(paidAmount - pendingData.amount) > 0.01 && paidAmount < pendingData.amount) {
          console.error(`Payment amount mismatch: expected ${pendingData.amount}, got ${paidAmount}`);
          return NextResponse.json({ error: 'Payment amount does not match order amount.' }, { status: 400 });
        }

        paymentIdStr = successPayment.cf_payment_id ? successPayment.cf_payment_id.toString() : 'N/A';
        console.log("Payment verified successfully with gateway:", paymentIdStr);
      }

      // 4. Finalize registration atomically
      const regId = await finalizeRegistration(dbFormData, paymentIdStr, sanitizedOrderId, true);

      // Run background tasks (email, PDF, sheet sync) exactly once
      after(async () => {
        try {
          await finalizeRegistration(dbFormData, paymentIdStr, sanitizedOrderId, false);
        } catch (err) {
          console.error("Error in background task for order:", err);
        }
      });

      const { createReceiptToken } = await import('@/lib/security');
      const token = createReceiptToken(regId, sanitizedOrderId);

      return NextResponse.json({ 
        success: true, 
        id: regId, 
        email: dbFormData.email,
        token
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Registration API Error:', error);
    await logSystemError({
      message: error?.message || 'Registration API Exception',
      stack: error?.stack,
      path: '/api/register',
      type: 'Registration API Error',
      method: 'POST',
      statusCode: 500,
      performedBy: 'System (Register API)',
    });
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}
