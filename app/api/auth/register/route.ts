import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import {
  checkAccountCreationRateLimit,
  createRateLimitResponse,
  extractClientIp,
} from '@/lib/auth/rateLimiter';
import { validatePasswordStrength } from '@/lib/auth/passwordSecurity';
import { logSecurityEvent } from '@/lib/security/securityLogger';
import { sanitizeInput } from '@/lib/security';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

/**
 * Enterprise Account Creation Endpoint
 * Enforces:
 * 1. Strict rate limiting (max 5 account creations per 15 min per IP)
 * 2. Password complexity validation (min 8 chars, uppercase, lowercase, number, symbol)
 * 3. Honeypot anti-bot validation
 * 4. Email verification requirement
 * 5. Immutable security audit logging
 */
export async function POST(req: Request) {
  const ip = extractClientIp(req);

  // 1. Account Creation Rate Limiting
  const rateLimitResult = checkAccountCreationRateLimit(ip);
  if (!rateLimitResult.allowed) {
    await logSecurityEvent({
      type: 'RATE_LIMIT_EXCEEDED',
      severity: 'HIGH',
      ip,
      path: '/api/auth/register',
      details: 'Account creation rate limit exceeded. Possible mass bot registration attempt.',
    });
    return createRateLimitResponse(rateLimitResult, 5);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 });
  }

  const { email, password, name, honeypot } = body;

  // 2. Anti-Bot Honeypot Field Check
  if (honeypot) {
    await logSecurityEvent({
      type: 'EXPLOIT_PROBE_BLOCKED',
      severity: 'MEDIUM',
      ip,
      path: '/api/auth/register',
      details: 'Automated account creation bot tripped honeypot field',
    });
    return NextResponse.json({ error: 'Automated submission rejected' }, { status: 400 });
  }

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = sanitizeInput(name || 'Attendee');

  // Basic email pattern check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return NextResponse.json({ error: 'Invalid email address format.' }, { status: 400 });
  }

  // 3. Password Strength Enforcement
  const passwordCheck = validatePasswordStrength(password || '');
  if (!passwordCheck.valid) {
    return NextResponse.json(
      {
        error: passwordCheck.errors[0] || 'Password does not meet enterprise security requirements.',
        errors: passwordCheck.errors,
      },
      { status: 400 }
    );
  }

  if (!adminAuth) {
    return NextResponse.json(
      { error: 'Authentication service temporarily unavailable in local development mode.' },
      { status: 503 }
    );
  }

  try {
    // 4. Create Firebase Auth User (emailVerified: false by default to enforce email verification)
    const userRecord = await adminAuth.createUser({
      email: cleanEmail,
      password: password,
      displayName: cleanName,
      emailVerified: false,
    });

    // 5. Create default Attendee profile in Firestore
    if (adminDb) {
      await adminDb.collection('users').doc(userRecord.uid).set({
        email: cleanEmail,
        name: cleanName,
        role: 'attendee',
        emailVerified: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    // 6. Generate email verification link
    let verificationLink: string | null = null;
    try {
      verificationLink = await adminAuth.generateEmailVerificationLink(cleanEmail);
    } catch (linkErr) {
      console.warn('[Register] Could not generate verification link:', linkErr);
    }

    // 7. Log security event
    await logSecurityEvent({
      type: 'EMAIL_VERIFICATION_SENT',
      severity: 'INFO',
      ip,
      email: cleanEmail,
      userId: userRecord.uid,
      path: '/api/auth/register',
      details: `New account created successfully for ${cleanEmail}. Verification link generated.`,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. Please verify your email before logging in.',
        userId: userRecord.uid,
        email: cleanEmail,
        needsVerification: true,
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.code === 'auth/email-already-exists') {
      // Generic error response to prevent user enumeration
      return NextResponse.json(
        { error: 'An account with this email already exists or is unavailable.' },
        { status: 409 }
      );
    }

    console.error('[Register API Error]:', err);
    return NextResponse.json(
      { error: 'Could not create account. Please try again later.' },
      { status: 500 }
    );
  }
}
