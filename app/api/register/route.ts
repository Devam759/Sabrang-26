import { NextResponse, after } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { finalizeRegistration } from '@/lib/registrationHelper';
import { validateRegistrationNumber } from '@/lib/utils';
import { logSystemError } from '@/lib/errorAlertService';

import { isRateLimited, sanitizeObject, isProd, cashfreeAppId, cashfreeSecretKey, formatPhoneNumber } from '@/lib/security';
import { calculateTotalRegistrationFee } from '@/lib/eventPricing';

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
      import('@/lib/security/securityLogger').then(({ logSecurityEvent }) => {
        logSecurityEvent({
          type: 'EXPLOIT_PROBE_BLOCKED',
          severity: 'MEDIUM',
          ip,
          path: '/api/register',
          details: 'Automated bot caught by hidden honeypot field',
        }).catch(() => {});
      });
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
      // CREATE_ORDER: strict account creation & order abuse limiter (max 5 per 15 min per IP)
      const { checkAccountCreationRateLimit, createRateLimitResponse } = await import('@/lib/auth/rateLimiter');
      const orderRateLimit = checkAccountCreationRateLimit(ip);
      if (!orderRateLimit.allowed) {
        return createRateLimitResponse(orderRateLimit, 5);
      }
      try {
        if (!data.registrationNumber && !data.rollNumber && !data.email) {
          return NextResponse.json({ error: 'Participant identification or Email is required.' }, { status: 400 });
        }

        const orderId = `order_${crypto.randomUUID()}`;
        const couponCode = (data.coupon || '').trim().toUpperCase();
        const eventTarget = data.eventId || data.event || data.eventName || data.eventTitle || '';
        
        // Authoritative event catalog prices to prevent price tampering
        const eventList = Array.isArray(data.selectedEvents) && data.selectedEvents.length > 0
          ? data.selectedEvents
          : (data.eventId ? [data.eventId] : []);

        
      // Fetch Early Bird Settings
      const settingsRef = adminDb.collection('settings').doc('earlyBird');
      const settingsSnap = await settingsRef.get();
      const isEarlyBird = settingsSnap.exists ? settingsSnap.data()?.active : false;

      let basePrice = calculateTotalRegistrationFee(eventList, data.teamMembers, data.visitorConfig, isEarlyBird);
        if (basePrice <= 0) {
          basePrice = 500;
        }

        const couponStatus = await checkCoupon(couponCode, basePrice, eventTarget, {
          selectedEvents: eventList,
          teamMembers: data.teamMembers,
          visitorConfig: data.visitorConfig,
          isEarlyBird,
        });
        const orderAmount = couponStatus.valid ? couponStatus.finalPrice : basePrice;

        console.log("Saving pending registration for order ID:", orderId);
        // 1. Save pending registration details under pendingRegistrations using Admin SDK
        await adminDb.collection('pendingRegistrations').doc(orderId).set({
          formData: data,
          orderId: orderId,
          amount: orderAmount,
          createdAt: FieldValue.serverTimestamp(),
          status: 'pending'
        });
        console.log("Pending registration saved.");

        // MOCK MODE: If not in production (Sandbox), no keys, OR order amount is 0, return a mock session
        if (!isProd || !cashfreeAppId || orderAmount === 0) {
          return NextResponse.json({ 
            order_id: orderId,
            payment_session_id: "mock_session_id",
            is_mock: true
          });
        }

        console.log("Creating Cashfree Order via PGCreateOrder...");
        
        // Strip non-digit characters and ensure a clean 10-digit format for Cashfree validation
        let cleanPhone = data.mobile ? data.mobile.replace(/\D/g, '') : (data.phone ? data.phone.replace(/\D/g, '') : '');
        if (cleanPhone.length > 10) {
          if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
            cleanPhone = cleanPhone.slice(2);
          } else {
            cleanPhone = cleanPhone.slice(-10);
          }
        }
        // Fail-safe default if number is somehow empty or too short
        if (cleanPhone.length < 10) {
          cleanPhone = '9999999999';
        }

        let host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'sabrang.jklu.edu.in';
        if (host.includes('0.0.0.0')) {
          host = host.replace('0.0.0.0', 'localhost');
        }
        const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
        
        // Prevent Host Header Injection: In production, strictly use the known safe domain.
        // During local development, allow localhost.
        const origin = isLocal 
          ? ((isProd) ? `https://${host}` : `http://${host}`)
          : (process.env.NEXT_PUBLIC_SITE_URL || 'https://sabrang.jklu.edu.in');

        // Decode HTML entities that sanitizeInput may have introduced - Cashfree
        // rejects encoded strings like &amp; or &#039; in customer name/email.
        const cashfreeName = decodeHtmlEntities(data.name || '');
        const cashfreeEmail = decodeHtmlEntities(data.email || '');

        const response = await cashfree.PGCreateOrder({
          order_id: orderId,
          order_amount: orderAmount,
          order_currency: 'INR',
          customer_details: {
            customer_id: (data.registrationNumber || data.rollNumber || `cust_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_'),
            customer_name: cashfreeName,
            customer_email: cashfreeEmail,
            customer_phone: cleanPhone,
          },
          order_meta: {
            return_url: `${origin}/register?order_id={order_id}`,
            notify_url: process.env.CASHFREE_NOTIFY_URL || `https://sabrang.jklu.edu.in/api/webhook`
          }
        });
        console.log("Cashfree order created successfully.");

        return NextResponse.json({ 
          order_id: response.data.order_id,
          payment_session_id: response.data.payment_session_id 
        });
      } catch (err: any) {
        // Log full Cashfree error server-side only - never expose API response bodies to the client
        console.error("CREATE_ORDER error detail:", err.response?.data || err);
        return NextResponse.json({ error: 'Payment session could not be created. Please try again.' }, { status: 500 });
      }
    }

    if (action === 'VERIFY_PAYMENT') {
      const { orderId } = data;

      // Validate orderId format before using as a Firestore document ID
      // Cashfree order IDs must match: order_<digits> (e.g. order_1234567890)
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

      const { generateSignedAccessToken } = await import('@/lib/auth/ownership');

      // If we are in Sandbox, don't have keys, or it's a 100% discount, allow bypass
      if (!isProd || !cashfreeAppId || pendingData.amount === 0) {
        console.warn("Sandbox mode, Cashfree App ID missing, or amount is 0. Bypassing verification.");
        // For free tickets, there is no webhook, so the frontend MUST run the background tasks.
        const regId = await finalizeRegistration(dbFormData, "mock_payment_id", sanitizedOrderId, true);
        const accessToken = generateSignedAccessToken(regId);
        after(async () => {
          try {
            await finalizeRegistration(dbFormData, "mock_payment_id", sanitizedOrderId, false);
          } catch (err) {
            console.error("Error in background task for mock/free order:", err);
          }
        });
        return NextResponse.json({ success: true, id: regId, email: dbFormData.email, accessToken });
      }

      const response = await cashfree.PGOrderFetchPayments(sanitizedOrderId);
      const payments = response.data;
      const successPayment = payments?.find((p: any) => p.payment_status === 'SUCCESS');

      if (!successPayment) {
        console.warn("No successful payment found for order:", sanitizedOrderId);
        return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
      }

      console.log("Payment verified successfully:", successPayment.cf_payment_id);
      const paymentIdStr = successPayment.cf_payment_id ? successPayment.cf_payment_id.toString() : 'N/A';
      const regId = await finalizeRegistration(dbFormData, paymentIdStr, sanitizedOrderId, true);
      const accessToken = generateSignedAccessToken(regId);
      after(async () => {
        try {
          await finalizeRegistration(dbFormData, paymentIdStr, sanitizedOrderId, false);
        } catch (err) {
          console.error("Error in background task for order:", err);
        }
      });
      return NextResponse.json({ success: true, id: regId, email: dbFormData.email, accessToken });
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
