import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { checkRateLimit, recordRateLimitFailure, extractClientIp } from '@/lib/auth/rateLimiter';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/verify-email
 * Generates and sends a time-sensitive email verification link via Brevo or Firebase.
 * Rate limited to 3 requests per 15 minutes per IP/email.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;
    const clientIp = extractClientIp(req);
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const MAX_REQUESTS = 3;
    const WINDOW_MS = 15 * 60 * 1000;
    const ipCheck = checkRateLimit('reset', `verify:${clientIp}`, MAX_REQUESTS, WINDOW_MS, WINDOW_MS);
    const emailCheck = checkRateLimit('reset', `verify:${cleanEmail}`, MAX_REQUESTS, WINDOW_MS, WINDOW_MS);

    if (!ipCheck.allowed || !emailCheck.allowed) {
      const retryAfter = Math.max(
        ipCheck.retryAfterSeconds || 0,
        emailCheck.retryAfterSeconds || 0
      );
      return NextResponse.json(
        {
          error: `Too many verification requests. Please wait ${Math.ceil(retryAfter / 60)} minute(s) before requesting again.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      );
    }

    recordRateLimitFailure('reset', `verify:${clientIp}`, MAX_REQUESTS, WINDOW_MS, WINDOW_MS);
    recordRateLimitFailure('reset', `verify:${cleanEmail}`, MAX_REQUESTS, WINDOW_MS, WINDOW_MS);

    const genericResponse = {
      success: true,
      message: 'If an account exists, a verification link has been dispatched to your email address.',
    };

    if (!adminAuth) {
      return NextResponse.json(genericResponse);
    }

    try {
      const actionCodeSettings = {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login?verified=true`,
        handleCodeInApp: false,
      };

      const verificationLink = await adminAuth.generateEmailVerificationLink(cleanEmail, actionCodeSettings);

      if (adminDb) {
        await adminDb.collection('auditLogs').add({
          timestamp: FieldValue.serverTimestamp(),
          action: 'EMAIL_VERIFICATION_LINK_GENERATED',
          performedBy: `IP: ${clientIp}`,
          targetEntity: `users/${cleanEmail}`,
          details: `Email verification link generated for ${cleanEmail}`,
        });
      }

      const brevoKey = process.env.BREVO_API_KEY;
      if (brevoKey && !brevoKey.includes('your_')) {
        try {
          const { sendBrevoEmail } = await import('@/lib/brevo');
          await sendBrevoEmail({
            to: [{ email: cleanEmail, name: 'Sabrang Portal User' }],
            subject: 'Sabrang 2026: Verify Your Email Address',
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #0f172a; margin-bottom: 16px;">Verify Your Email Address</h2>
                <p style="color: #475569; line-height: 1.6;">Thank you for registering with the Sabrang 2026 Portal. Please confirm your email address by clicking the button below:</p>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${verificationLink}" style="background-color: #0f172a; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Verify Email</a>
                </div>
                <p style="color: #64748b; font-size: 13px; line-height: 1.5;">This verification link will expire in <strong>24 hours</strong>.<br>If you did not request this verification, you can safely ignore this email.</p>
              </div>
            `,
          });
        } catch (emailErr) {
          console.warn('[VerifyEmail API] Failed to send via Brevo:', emailErr);
        }
      }

      return NextResponse.json(genericResponse);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        return NextResponse.json(genericResponse);
      }
      console.error('[VerifyEmail API] Error:', err);
      return NextResponse.json(genericResponse);
    }
  } catch (error: any) {
    console.error('[VerifyEmail API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to process email verification request' },
      { status: 500 }
    );
  }
}
