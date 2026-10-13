import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { safeEqual } from './passwordSecurity';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  role: 'admin' | 'scanner' | 'attendee';
  name?: string;
  token: any;
}

export type AuthCheckResult =
  | { authorized: true; user: AuthenticatedUser }
  | { authorized: false; response: NextResponse };

/**
 * Extracts the bearer token or session cookie from an incoming request.
 */
export function extractAuthToken(req: Request): string | null {
  // 1. Authorization: Bearer <idToken>
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }

  // 2. Cookie: sabrang_session=<idToken>
  const cookieHeader = req.headers.get('cookie') || req.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith('sabrang_session=')) {
        const token = cookie.substring('sabrang_session='.length).trim();
        if (token) return decodeURIComponent(token);
      }
    }
  }

  return null;
}

/**
 * Core authentication function:
 * Validates the token against Firebase Admin SDK, ensures token is unrevoked and not expired,
 * enforces email verification, and resolves the verified user role from Firestore.
 *
 * FAIL-CLOSED: Any failure, unverified role, or missing data strictly yields authorized: false.
 */
export async function authenticateRequest(
  req: Request,
  options: { requireEmailVerification?: boolean } = { requireEmailVerification: true }
): Promise<AuthCheckResult> {
  if (!adminAuth || !adminDb) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Server authentication services currently unavailable.' },
        { status: 503 }
      ),
    };
  }

  const token = extractAuthToken(req);
  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized: Missing or invalid authentication token or session cookie.' },
        { status: 401 }
      ),
    };
  }

  let decodedToken;
  try {
    // checkRevoked: true ensures that revoked tokens or deleted accounts cannot be used
    decodedToken = await adminAuth.verifyIdToken(token, true);
  } catch (err: any) {
    console.warn('[ServerAuth] Token verification failed:', err.message);
    const isExpired = err.code === 'auth/id-token-expired';
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: isExpired
            ? 'Unauthorized: Session has expired. Please sign in again.'
            : 'Unauthorized: Invalid or revoked authentication token.',
          code: isExpired ? 'SESSION_EXPIRED' : 'INVALID_TOKEN',
        },
        { status: 401 }
      ),
    };
  }

  const emailVerified = Boolean(decodedToken.email_verified);
  const email = decodedToken.email || '';

  // Email verification check (strict by default)
  if (options.requireEmailVerification && !emailVerified) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: 'Forbidden: Email verification required before accessing this resource.',
          code: 'EMAIL_VERIFICATION_REQUIRED',
        },
        { status: 403 }
      ),
    };
  }

  // Resolve verified role from Firestore (Roles collection first, then Users collection)
  // CRITICAL SECURITY FIX: Never fallback to 'admin'. If no role is found, default to 'attendee'.
  let resolvedRole: 'admin' | 'scanner' | 'attendee' = 'attendee';
  let userName = decodedToken.name || '';

  try {
    const [roleDoc, userDoc] = await Promise.all([
      adminDb.collection('roles').doc(decodedToken.uid).get(),
      adminDb.collection('users').doc(decodedToken.uid).get(),
    ]);

    if (roleDoc.exists && roleDoc.data()?.role) {
      const r = String(roleDoc.data()?.role).toLowerCase();
      if (r === 'admin' || r === 'scanner') resolvedRole = r;
    } else if (userDoc.exists && userDoc.data()?.role) {
      const r = String(userDoc.data()?.role).toLowerCase();
      if (r === 'admin' || r === 'scanner') resolvedRole = r;
      userName = userDoc.data()?.name || userName;
    }

    // Check custom claims if roleDoc didn't find one
    if (resolvedRole === 'attendee') {
      if (decodedToken.admin === true || decodedToken.role === 'admin') {
        resolvedRole = 'admin';
      } else if (decodedToken.role === 'scanner') {
        resolvedRole = 'scanner';
      }
    }
  } catch (dbErr: any) {
    console.error('[ServerAuth] Error resolving user role from database:', dbErr);
    // FAIL CLOSED: Do NOT grant elevated privileges on database read error
    resolvedRole = 'attendee';
  }

  const user: AuthenticatedUser = {
    uid: decodedToken.uid,
    email,
    emailVerified,
    role: resolvedRole,
    name: userName,
    token: decodedToken,
  };

  return { authorized: true, user };
}

/**
 * Ensures the incoming request is authenticated with strictly verified 'admin' privileges.
 */
export async function verifyAdmin(req: Request): Promise<AuthCheckResult> {
  const authResult = await authenticateRequest(req, { requireEmailVerification: true });
  if (!authResult.authorized) {
    return authResult;
  }

  if (authResult.user.role !== 'admin') {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Forbidden: Administrator privileges required.' },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Ensures the incoming request is authenticated with strictly verified 'admin' or 'scanner' privileges.
 * If scanner, verifies that the scanner account is currently active.
 */
export async function verifyScannerOrAdmin(req: Request): Promise<AuthCheckResult> {
  const authResult = await authenticateRequest(req, { requireEmailVerification: true });
  if (!authResult.authorized) {
    return authResult;
  }

  const role = authResult.user.role;
  if (role !== 'admin' && role !== 'scanner') {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Forbidden: Staff scanner or administrator privileges required.' },
        { status: 403 }
      ),
    };
  }

  // If scanner role, verify account status is Active in scannerAccounts collection
  if (role === 'scanner' && adminDb) {
    try {
      const scannerDoc = await adminDb.collection('scannerAccounts').doc(authResult.user.uid).get();
      if (scannerDoc.exists && scannerDoc.data()?.status === 'Inactive') {
        return {
          authorized: false,
          response: NextResponse.json(
            { error: 'Forbidden: This scanner account has been deactivated by an administrator.' },
            { status: 403 }
          ),
        };
      }
    } catch (err) {
      console.warn('[ServerAuth] Warning while checking scanner account status:', err);
    }
  }

  return authResult;
}

/**
 * Validates a secret token for automated cron or serverless jobs (e.g. reconciler, sync).
 * Accepts secret via Authorization: Bearer <secret> or X-Cron-Secret header.
 * Uses constant-time string comparison to prevent timing attacks.
 * Never uses fallback hardcoded values.
 */
export function verifyCronSecret(req: Request): boolean {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || expectedSecret.trim() === '') {
    console.error('[ServerAuth] CRON_SECRET is not configured in server environment variables.');
    return false;
  }

  // Check Authorization header: Bearer <token>
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerSecret = authHeader.substring(7).trim();
    if (safeEqual(bearerSecret, expectedSecret)) return true;
  }

  // Check X-Cron-Secret header
  const customHeader = req.headers.get('X-Cron-Secret') || req.headers.get('x-cron-secret');
  if (customHeader && safeEqual(customHeader.trim(), expectedSecret)) {
    return true;
  }

  // Also check query param fallback for legacy cloud scheduler URLs, but log a security warning
  const url = new URL(req.url);
  const querySecret = url.searchParams.get('secret');
  if (querySecret && safeEqual(querySecret, expectedSecret)) {
    console.warn('[ServerAuth] Cron secret received via URL query param. Prefer using X-Cron-Secret header.');
    return true;
  }

  return false;
}
