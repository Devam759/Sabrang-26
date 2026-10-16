import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { generatePDF } from '@/lib/registrationHelper';
import { isRateLimited, verifyReceiptToken } from '@/lib/security';

export async function GET(req: Request) {
  try {
    const rawIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const ip = rawIp.split(',')[0].trim(); // Take only the first (leftmost) IP - prevent x-forwarded-for spoofing
    
    // Rate limit PDF receipt downloads to 15 requests per minute per IP
    if (isRateLimited(ip, 15, 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again in a minute.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const id = (searchParams.get('id') || '').trim();
    const token = (searchParams.get('token') || '').trim();
    const orderIdParam = (searchParams.get('order_id') || searchParams.get('orderId') || '').trim();
    
    if (!id) {
      return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
    }
    
    // Fetch registration from Firestore using Admin SDK
    const docRef = adminDb.collection('registrations').doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }
    
    const data = docSnap.data() || {};

    // 1. Never issue tickets or receipts for unverified or unpaid orders
    if (!data.paymentId || data.paymentId === 'UNPAID') {
      console.warn(`Attempt to download receipt for unpaid registration: ${id}`);
      return NextResponse.json({ error: 'Receipt cannot be issued for an unpaid or unverified registration.' }, { status: 403 });
    }

    // 2. Authorization Verification
    let isAuthorized = false;

    // A. Check signed HMAC token
    if (token && data.orderId && verifyReceiptToken(token, id, data.orderId)) {
      isAuthorized = true;
    }

    // B. Check orderId ownership match
    if (!isAuthorized && orderIdParam && data.orderId && orderIdParam === data.orderId) {
      isAuthorized = true;
    }

    // C. Check Admin / Scanner / Attendee Firebase token in Authorization header
    if (!isAuthorized) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1];
        try {
          const decoded = await adminAuth.verifyIdToken(idToken);
          // Allow if admin, scanner, or if token UID matches registration's userId
          if (
            decoded.admin === true ||
            decoded.role === 'admin' ||
            decoded.role === 'scanner' ||
            (data.userId && decoded.uid === data.userId)
          ) {
            isAuthorized = true;
          } else {
            // Check roles collection in Firestore
            const roleDoc = await adminDb.collection('roles').doc(decoded.uid).get();
            const role = roleDoc.data()?.role;
            if (role === 'admin' || role === 'scanner') {
              isAuthorized = true;
            }
          }
        } catch {
          // Token verification failed; remain unauthorized
        }
      }
    }

    if (!isAuthorized) {
      console.warn(`Unauthorized receipt download attempt for registration: ${id} from IP: ${ip}`);
      return NextResponse.json({ 
        error: 'Unauthorized: Valid receipt access token, matching order reference, or admin authorization required.' 
      }, { status: 401 });
    }
    
    // Generate PDF receipt bytes using the unified helper
    console.log(`Generating PDF receipt from unified helper for registration ${id}...`);
    const pdfBytes = await generatePDF(
      data,
      id,
      data.paymentId || 'N/A',
      data.orderId || 'N/A',
      data.dateOfPayment
    );
    
    // Sanitize filename to prevent Content-Disposition header injection.
    const rawName = data.name || id;
    const safeName = String(rawName).replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 50);
    
    // Return PDF stream directly
    return new Response(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Sabrang_Receipt_${safeName}.pdf"`
      }
    });
  } catch (error: any) {
    console.error('Receipt generation API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate PDF' }, { status: 500 });
  }
}
