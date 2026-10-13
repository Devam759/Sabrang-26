import { NextResponse } from 'next/server';
import {
  checkRateLimit,
  recordRateLimitFailure,
  resetRateLimit,
  extractClientIp,
} from '@/lib/auth/rateLimiter';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/login-attempt
 * Manages login attempt rate-limiting policies:
 * - action 'check': pre-checks if the IP or email is currently locked out
 * - action 'record-failure': increments failure count; if threshold exceeded, locks out and logs alert
 * - action 'reset': clears failed attempt count upon successful authentication
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, email } = body;
    const clientIp = extractClientIp(req);
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!cleanEmail) {
      return NextResponse.json({ error: 'Email identifier required.' }, { status: 400 });
    }

    const MAX_LOGIN_ATTEMPTS = 5;
    const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

    if (action === 'check') {
      const ipCheck = checkRateLimit('login', clientIp, MAX_LOGIN_ATTEMPTS, WINDOW_MS, LOCKOUT_MS);
      const emailCheck = checkRateLimit('login', cleanEmail, MAX_LOGIN_ATTEMPTS, WINDOW_MS, LOCKOUT_MS);

      if (!ipCheck.allowed || !emailCheck.allowed) {
        const retryAfter = Math.max(
          ipCheck.retryAfterSeconds || 0,
          emailCheck.retryAfterSeconds || 0
        );
        return NextResponse.json(
          {
            allowed: false,
            locked: true,
            retryAfterSeconds: retryAfter,
            message: `Too many failed login attempts. Access temporarily restricted. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
          },
          {
            status: 429,
            headers: { 'Retry-After': String(retryAfter) },
          }
        );
      }

      return NextResponse.json({
        allowed: true,
        remainingAttempts: Math.min(ipCheck.remainingAttempts, emailCheck.remainingAttempts),
      });
    }

    if (action === 'record-failure' || action === 'record_failure') {
      const ipRes = recordRateLimitFailure('login', clientIp, MAX_LOGIN_ATTEMPTS, WINDOW_MS, LOCKOUT_MS);
      const emailRes = recordRateLimitFailure('login', cleanEmail, MAX_LOGIN_ATTEMPTS, WINDOW_MS, LOCKOUT_MS);

      const isLocked = !ipRes.allowed || !emailRes.allowed;
      const retryAfter = Math.max(ipRes.retryAfterSeconds || 0, emailRes.retryAfterSeconds || 0);

      // Audit failed attempt or lockout in database
      const { logSecurityEvent } = await import('@/lib/security/securityLogger');
      await logSecurityEvent({
        type: isLocked ? 'LOGIN_LOCKOUT' : 'LOGIN_FAILURE',
        severity: isLocked ? 'HIGH' : 'LOW',
        ip: clientIp,
        email: cleanEmail,
        path: '/login',
        method: 'POST',
        details: isLocked
          ? `Lockout activated for ${cleanEmail} from IP ${clientIp} after ${emailRes.totalAttempts} failed attempts.`
          : `Failed login attempt for ${cleanEmail} from IP ${clientIp} (Remaining: ${Math.min(ipRes.remainingAttempts, emailRes.remainingAttempts)}).`,
      });

      if (isLocked) {
        return NextResponse.json(
          {
            allowed: false,
            locked: true,
            retryAfterSeconds: retryAfter,
            message: `Account temporarily locked due to multiple failed login attempts. Please wait ${Math.ceil(retryAfter / 60)} minute(s).`,
          },
          {
            status: 429,
            headers: { 'Retry-After': String(retryAfter) },
          }
        );
      }

      return NextResponse.json({
        allowed: true,
        remainingAttempts: Math.min(ipRes.remainingAttempts, emailRes.remainingAttempts),
      });
    }

    if (action === 'reset') {
      resetRateLimit('login', clientIp);
      resetRateLimit('login', cleanEmail);
      const { logSecurityEvent } = await import('@/lib/security/securityLogger');
      await logSecurityEvent({
        type: 'LOGIN_SUCCESS',
        severity: 'INFO',
        ip: clientIp,
        email: cleanEmail,
        path: '/login',
        method: 'POST',
        details: `Successful authenticated login for ${cleanEmail} from IP ${clientIp}. Rate limit reset.`,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action specified.' }, { status: 400 });
  } catch (err: any) {
    console.error('[LoginAttempt API] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal rate limit error' }, { status: 500 });
  }
}
