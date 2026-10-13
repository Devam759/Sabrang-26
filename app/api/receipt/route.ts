import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { generatePDF } from '@/lib/registrationHelper';
import { isRateLimited } from '@/lib/security';
import { enforceResourceOwnership } from '@/lib/auth/ownership';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const rawIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const ip = rawIp.split(',')[0].trim();
    
    // Rate limit PDF receipt downloads to 10 requests per minute per IP
    if (isRateLimited(ip, 10, 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again in a minute.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const rawId = searchParams.get('id');
    
    if (!rawId || typeof rawId !== 'string' || !/^[a-zA-Z0-9_\-\.:]{1,128}$/.test(rawId.trim())) {
      return NextResponse.json({ error: 'Valid Registration ID format is required' }, { status: 400 });
    }
    const id = rawId.trim();

    const rawToken = searchParams.get('token');
    if (rawToken && (typeof rawToken !== 'string' || !/^[0-9]+\.[a-fA-F0-9]{64}$/.test(rawToken.trim()))) {
      return NextResponse.json({ error: 'Invalid access token format' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }
    
    // Fetch registration from Firestore using Admin SDK
    const docRef = adminDb.collection('registrations').doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }
    
    const data = docSnap.data() || {};

    // IDOR Protection: Enforce that the requester either owns this registration, is an admin/scanner,
    // or possesses a valid signed access token generated during checkout.
    const ownershipResult = await enforceResourceOwnership(req, id, data, 'read');
    if (!ownershipResult.authorized) {
      return NextResponse.json(
        { error: ownershipResult.reason || 'Forbidden: Access to this registration receipt is restricted.' },
        { status: ownershipResult.status }
      );
    }
    
    // Generate PDF receipt bytes using the unified helper
    console.log(`Generating PDF receipt for registration ${id} (Authorized user: ${ownershipResult.user?.email || 'Token Bearer'})...`);
    const pdfBytes = await generatePDF(
      data,
      id,
      data.paymentId || 'N/A',
      data.orderId || 'N/A',
      data.dateOfPayment
    );
    
    // Sanitize filename to prevent Content-Disposition header injection
    const rawName = data.name || id;
    const safeName = String(rawName).replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 50);

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
