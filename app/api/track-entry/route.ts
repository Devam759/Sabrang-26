import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Unknown';
    const clientIp = forwarded.split(',')[0].trim();
    
    // Mask last IP octet for user privacy compliance (e.g. 192.168.1.xxx)
    const maskedIp = clientIp.includes('.') 
      ? clientIp.split('.').slice(0, 3).join('.') + '.xxx'
      : (clientIp.includes(':') ? clientIp.split(':').slice(0, 3).join(':') + '::xxx' : 'Anonymous');

    const country = (req.headers.get('x-vercel-ip-country') || 'India').slice(0, 50);
    const city = (req.headers.get('x-vercel-ip-city') || 'Jaipur').slice(0, 50);

    const safeTrim = (val: unknown, fallback: string, maxLen = 250): string => {
      if (typeof val !== 'string') return fallback;
      const clean = val.replace(/<[^>]*>?/gm, '').trim();
      return clean.slice(0, maxLen) || fallback;
    };

    if (adminDb) {
      await adminDb.collection('websiteLogs').add({
        path: safeTrim(body.path, '/', 200),
        fullUrl: safeTrim(body.fullUrl, '/', 300),
        referrer: safeTrim(body.referrer, 'Direct / Organic', 200),
        device: safeTrim(body.device, 'Desktop', 50),
        browser: safeTrim(body.browser, 'Browser', 50),
        os: safeTrim(body.os, 'OS', 50),
        screenResolution: safeTrim(body.screenResolution, 'Unknown', 30),
        sessionId: safeTrim(body.sessionId, 'sid_anon', 100),
        maskedIp,
        city,
        country,
        timestamp: FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Non-blocking fail-safe
    return NextResponse.json({ success: false, error: err.message }, { status: 200 });
  }
}
