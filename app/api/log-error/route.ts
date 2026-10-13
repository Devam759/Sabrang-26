import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendErrorNotificationAlert, sanitizeErrorDetails } from '@/lib/errorAlertService';

export async function POST(req: Request) {
  try {
    const data = await req.json().catch(() => ({}));
    const { 
      message = 'Unknown Application Error', 
      stack, 
      path = '/', 
      method, 
      statusCode,
      userAgent = 'Unknown', 
      type = 'Frontend Exception',
      userId,
      metadata
    } = data;

    if (!adminDb) {
      console.warn("Firebase Admin DB not initialized, skipping remote error log.");
      return NextResponse.json({ success: false, error: 'DB not initialized' }, { status: 500 });
    }

    const rawIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const ip = rawIp.split(',')[0].trim();
    const { isRateLimited } = await import('@/lib/security');
    if (isRateLimited(`${ip}:log_error`, 20, 60 * 1000)) {
      return NextResponse.json({ success: false, error: 'Too many error logs submitted' }, { status: 429 });
    }

    // Limit stack trace length and sanitize
    const cleanMessage = sanitizeErrorDetails(message).slice(0, 500);
    const cleanStack = sanitizeErrorDetails(stack ? stack.substring(0, 1500) : 'No stack trace provided');
    const cleanPath = sanitizeErrorDetails(path).slice(0, 200);
    const safeUserAgent = typeof userAgent === 'string' ? userAgent.slice(0, 200) : 'Unknown';
    const safeType = typeof type === 'string' ? type.slice(0, 100) : 'Frontend Exception';
    const safeMethod = typeof method === 'string' ? method.slice(0, 10) : 'N/A';
    const safeUserId = typeof userId === 'string' ? userId.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 50) : 'N/A';

    const errorDetails = `[${safeType}] ${cleanMessage}\n\nStack:\n${cleanStack}\n\nUserAgent: ${safeUserAgent}`;

    const errorRecord: any = {
      timestamp: FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString(),
      action: 'SYSTEM_ERROR',
      performedBy: safeUserId !== 'N/A' ? safeUserId : 'Client Application',
      targetEntity: cleanPath,
      details: errorDetails,
      message: cleanMessage,
      stack: cleanStack,
      type: safeType,
      method: safeMethod,
      statusCode: typeof statusCode === 'number' ? statusCode : 500,
      userAgent: safeUserAgent,
      userId: safeUserId,
      environment: process.env.NODE_ENV || 'development',
      notificationStatus: 'PENDING',
    };

    if (metadata && typeof metadata === 'object') {
      errorRecord.metadata = metadata;
    }

    // 1. Record in systemErrors collection
    const errorDocRef = await adminDb.collection('systemErrors').add(errorRecord);
    const errorId = errorDocRef.id;



    // 3. Trigger automated email alert to devamgupta@jklu.edu.in asynchronously
    sendErrorNotificationAlert({
      errorId,
      message: cleanMessage,
      type,
      path: cleanPath,
      method,
      statusCode,
      stack: cleanStack,
      userAgent,
      userId,
      metadata,
      environment: process.env.NODE_ENV || 'development',
    }).catch(alertErr => console.error("Failed to dispatch automated error notification email:", alertErr));

    return NextResponse.json({ 
      success: true, 
      errorId, 
      logged: true 
    });

  } catch (err: any) {
    console.error('Failed to process error log webhook:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
