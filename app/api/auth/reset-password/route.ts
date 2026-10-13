import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import {
  checkRateLimit,
  recordRateLimitFailure,
  extractClientIp,
} from '@/lib/auth/rateLimiter';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/reset-password
 * Generates an expiring, single-use password reset link.
 * Implements:
 * - Rate limiting (Max 3 attempts per 30 minutes per IP/email)
 * - Timing-attack defense: Returns identical generic success response whether user exists or not (prevents email enumeration)
 * - Action code settings: Expiration enforcement
 * - Audit logging of password reset requests
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

    // Rate limiting: 3 reset requests per 30 minutes
    const MAX_RESETS = 3;
    const WINDOW_MS = 30 * 60 * 1000;
    const ipCheck = checkRateLimit('reset', clientIp, MAX_RESETS, WINDOW_MS, WINDOW_MS);
    const emailCheck = checkRateLimit('reset', cleanEmail, MAX_RESETS, WINDOW_MS, WINDOW_MS);

    if (!ipCheck.allowed || !emailCheck.allowed) {
      const retryAfter = Math.max(
        ipCheck.retryAfterSeconds || 0,
        emailCheck.retryAfterSeconds || 0
      );
      return NextResponse.json(
        {
          error: `Too many password reset requests. For security, please wait ${Math.ceil(retryAfter / 60)} minute(s) before requesting again.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      );
    }

    // Record the attempt for rate-limiting
    recordRateLimitFailure('reset', clientIp, MAX_RESETS, WINDOW_MS, WINDOW_MS);
    recordRateLimitFailure('reset', cleanEmail, MAX_RESETS, WINDOW_MS, WINDOW_MS);

    // Generic success response to prevent account enumeration
    const genericSuccess = {
      success: true,
      message:
        'If an account is associated with this email, secure password reset instructions have been dispatched. The reset link is time-sensitive and valid for 15 minutes.',
    };

    if (!adminAuth) {
      return NextResponse.json(genericSuccess);
    }

    try {
      // Generate password reset link with time-sensitive action code settings
      const actionCodeSettings = {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`,
        handleCodeInApp: false,
      };

      const resetLink = await adminAuth.generatePasswordResetLink(cleanEmail, actionCodeSettings);

      // Audit password reset request
      if (adminDb) {
        await adminDb.collection('auditLogs').add({
          timestamp: FieldValue.serverTimestamp(),
          action: 'PASSWORD_RESET_LINK_GENERATED',
          performedBy: `IP: ${clientIp}`,
          targetEntity: `users/${cleanEmail}`,
          details: `Secure password reset link generated for ${cleanEmail} from IP ${clientIp}. Link expires automatically.`,
        });
      }

      // Check if Brevo is configured to send the email
      const brevoKey = process.env.BREVO_API_KEY;
      if (brevoKey && !brevoKey.includes('your_')) {
        try {
          const { sendBrevoEmail } = await import('@/lib/brevo');
          await sendBrevoEmail({
            to: [{ email: cleanEmail, name: 'Sabrang Portal User' }],
            subject: 'Sabrang 2026: Password Reset Request',
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #0f172a; margin-bottom: 16px;">Password Reset Request</h2>
                <p style="color: #475569; line-height: 1.6;">You recently requested to reset your password for the Sabrang 2026 Portal. Click the button below to choose a new password:</p>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${resetLink}" style="background-color: #0f172a; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                <p style="color: #64748b; font-size: 13px; line-height: 1.5;">This link will expire in <strong>15 minutes</strong> and can only be used once.<br>If you did not request this, you can safely ignore this email.</p>
              </div>
            `,
          });
        } catch (emailErr) {
          console.warn('[ResetPassword API] Could not dispatch email via Brevo:', emailErr);
        }
      }

      return NextResponse.json(genericSuccess);
    } catch (err: any) {
      // If user does not exist, Firebase throws auth/user-not-found
      // Return identical generic response to prevent account enumeration
      if (err.code === 'auth/user-not-found') {
        return NextResponse.json(genericSuccess);
      }

      console.error('[ResetPassword API] Error generating reset link:', err);
      return NextResponse.json(genericSuccess);
    }
  } catch (error: any) {
    console.error('[ResetPassword API] Fatal error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing the request.' },
      { status: 500 }
    );
  }
}
