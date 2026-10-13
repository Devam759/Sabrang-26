import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { authenticateRequest } from '@/lib/auth/serverAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours max session lifetime

/**
 * POST /api/auth/session
 * Validates the client's Firebase ID token, resolves verified role,
 * and creates a secure HttpOnly session cookie with strict expiry.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { idToken } = body;

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid authentication token.' },
        { status: 400 }
      );
    }

    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { error: 'Authentication service temporarily unavailable.' },
        { status: 503 }
      );
    }

    // Verify token with Firebase Admin
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken, true);
    } catch (err: any) {
      return NextResponse.json(
        { error: `Token validation failed: ${err.message}` },
        { status: 401 }
      );
    }

    // Role resolution (fail-closed, default attendee)
    let role = 'attendee';
    let name = decodedToken.name || '';

    try {
      const [roleDoc, userDoc] = await Promise.all([
        adminDb.collection('roles').doc(decodedToken.uid).get(),
        adminDb.collection('users').doc(decodedToken.uid).get(),
      ]);

      if (roleDoc.exists && roleDoc.data()?.role) {
        role = String(roleDoc.data()?.role).toLowerCase();
      } else if (userDoc.exists && userDoc.data()?.role) {
        role = String(userDoc.data()?.role).toLowerCase();
        name = userDoc.data()?.name || name;
      }

      if (role === 'attendee' && (decodedToken.admin === true || decodedToken.role === 'admin')) {
        role = 'admin';
      }
    } catch (err) {
      console.warn('[Session API] Role lookup error:', err);
    }

    const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
    const isProduction = process.env.NODE_ENV === 'production';

    const response = NextResponse.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: Boolean(decodedToken.email_verified),
        role,
        name,
      },
      expiresAt,
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    // Set secure HttpOnly session cookie
    response.cookies.set('sabrang_session', idToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error: any) {
    console.error('[Session API] Creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to establish secure session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/session
 * Returns the currently active verified user session and remaining duration.
 */
export async function GET(req: Request) {
  try {
    const authResult = await authenticateRequest(req, { requireEmailVerification: false });
    if (!authResult.authorized) {
      return authResult.response;
    }

    return NextResponse.json({
      success: true,
      user: {
        uid: authResult.user.uid,
        email: authResult.user.email,
        emailVerified: authResult.user.emailVerified,
        role: authResult.user.role,
        name: authResult.user.name,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Session verification error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/session
 * Destroys the active session cookie (Logout).
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Session terminated successfully.' });
  response.cookies.set('sabrang_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
