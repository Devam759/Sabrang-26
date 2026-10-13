import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin } from "@/lib/auth/serverAuth";
import {
  checkApiEndpointRateLimit,
  createRateLimitResponse,
  extractClientIp,
  getRateLimitHeaders,
} from "@/lib/auth/rateLimiter";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const ip = extractClientIp(req);
    const rateLimit = checkApiEndpointRateLimit(ip, false);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit, 60);
    }

    if (!adminDb) {
      return NextResponse.json([], {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          ...getRateLimitHeaders(rateLimit, 60),
        },
      });
    }

    const eventsSnapshot = await adminDb
      .collection("events")
      .orderBy("dateTime", "asc")
      .get();
    const events = eventsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(events, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        ...getRateLimitHeaders(rateLimit, 60),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authCheck = await verifyAdmin(req);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Database service unavailable" }, { status: 503 });
    }

    const rawEventData = await req.json().catch(() => ({}));
    if (!rawEventData || typeof rawEventData !== 'object') {
      return NextResponse.json({ error: "Invalid event data payload" }, { status: 400 });
    }

    const { sanitizeObject } = await import('@/lib/security');
    const sanitizedData = sanitizeObject(rawEventData);

    const title = typeof sanitizedData.title === 'string' ? sanitizedData.title.slice(0, 150) : 'Untitled Event';
    const category = typeof sanitizedData.category === 'string' ? sanitizedData.category.slice(0, 50) : 'General';
    const price = typeof sanitizedData.price === 'number' && sanitizedData.price >= 0 ? sanitizedData.price : 0;

    const eventRef = await adminDb.collection("events").add({
      ...sanitizedData,
      title,
      category,
      price,
      createdAt: new Date(),
      dateTime: sanitizedData.dateTime ? new Date(sanitizedData.dateTime) : new Date(),
      createdBy: authCheck.user.uid,
    });

    return NextResponse.json({ id: eventRef.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
