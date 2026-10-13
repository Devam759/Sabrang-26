import crypto from 'crypto';
import { AuthenticatedUser, authenticateRequest } from './serverAuth';
import { safeEqual } from './passwordSecurity';

/**
 * Universal IDOR & Resource Ownership Protection Module
 * Enforces strict object-level access controls for sensitive user records,
 * passes, registrations, profiles, and receipts.
 */

// Private secret used for signing temporary access tokens
const DEV_FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

function getAccessTokenSecret(): string {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.CRON_SECRET ||
    process.env.FIREBASE_PRIVATE_KEY?.slice(0, 32);

  if (secret && secret.trim().length >= 16) {
    return secret.trim();
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[Security Warning] SESSION_SECRET or CRON_SECRET not configured with at least 16 characters. Using fallback secret.'
    );
  }

  return DEV_FALLBACK_SECRET;
}

export interface OwnershipCheckResult {
  authorized: boolean;
  status: number;
  reason?: string;
  user?: AuthenticatedUser;
}

/**
 * Generates an HMAC-SHA256 signed temporary access token for a resource.
 * Useful for post-checkout receipt downloads where the attendee has not yet signed in.
 *
 * @param resourceId - Document ID (e.g. registrationId)
 * @param expiresInSeconds - Token validity window (default 2 hours = 7200s)
 */
export function generateSignedAccessToken(
  resourceId: string,
  expiresInSeconds: number = 7200
): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = `${resourceId}:${expiresAt}`;
  const hmac = crypto
    .createHmac('sha256', getAccessTokenSecret())
    .update(payload)
    .digest('hex');
  return `${expiresAt}.${hmac}`;
}

/**
 * Validates a signed access token for a specific resource ID.
 */
export function verifySignedAccessToken(resourceId: string, token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [expiresAtStr, signature] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (now > expiresAt) {
    // Token has expired
    return false;
  }

  const payload = `${resourceId}:${expiresAt}`;
  const expectedHmac = crypto
    .createHmac('sha256', getAccessTokenSecret())
    .update(payload)
    .digest('hex');

  return safeEqual(signature, expectedHmac);
}

/**
 * Checks whether an authenticated user owns a given resource.
 *
 * Ownership Rules:
 * 1. Admin: Always authorized.
 * 2. Scanner: Authorized for 'read' actions (verifying attendee tickets).
 * 3. Resource Owner:
 *    - `resource.userId === user.uid` OR
 *    - `resource.uid === user.uid` OR
 *    - `resource.email.toLowerCase() === user.email.toLowerCase()`
 * 4. Any other user: FORBIDDEN (IDOR prevention).
 */
export function isResourceOwner(
  user: AuthenticatedUser,
  resource: Record<string, any>,
  action: 'read' | 'write' | 'delete' = 'read'
): boolean {
  if (!user) return false;

  // Administrators have full privileges across all resources
  if (user.role === 'admin') return true;

  // Scanners can read attendee registration details for verification purposes
  if (user.role === 'scanner' && action === 'read') return true;

  const userUid = user.uid?.trim();
  const userEmail = user.email?.trim().toLowerCase();

  // Match by User ID
  const resourceUserId = (resource.userId || resource.uid || resource.formData?.userId || '').trim();
  if (userUid && resourceUserId && userUid === resourceUserId) {
    return true;
  }

  // Match by Email
  const resourceEmail = (
    resource.email ||
    resource.attendeeEmail ||
    resource.formData?.email ||
    ''
  ).trim().toLowerCase();

  if (userEmail && resourceEmail && userEmail === resourceEmail) {
    return true;
  }

  return false;
}

/**
 * Validates that an incoming request is authorized to access a specific resource.
 * Checks for either:
 * 1. An authenticated session matching the resource owner or admin, OR
 * 2. A valid, unexpired HMAC-signed access token (e.g. for post-payment guest downloads).
 */
export async function enforceResourceOwnership(
  req: Request,
  resourceId: string,
  resourceData: Record<string, any>,
  action: 'read' | 'write' | 'delete' = 'read'
): Promise<OwnershipCheckResult> {
  // 1. Check for temporary signed token in URL query (?token=...) or X-Access-Token header
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || req.headers.get('x-access-token');

  if (token && verifySignedAccessToken(resourceId, token)) {
    return { authorized: true, status: 200 };
  }

  // 2. Authenticate the caller session
  const authCheck = await authenticateRequest(req, { requireEmailVerification: false });
  if (!authCheck.authorized) {
    return {
      authorized: false,
      status: 401,
      reason: 'Authentication or valid access token required to view this resource.',
    };
  }

  const user = authCheck.user;

  // 3. Verify object-level ownership
  if (isResourceOwner(user, resourceData, action)) {
    return { authorized: true, status: 200, user };
  }

  // Log IDOR security incident
  try {
    const { logSecurityEvent } = await import('@/lib/security/securityLogger');
    const { extractClientIp } = await import('@/lib/auth/rateLimiter');
    await logSecurityEvent({
      type: 'IDOR_ATTEMPT_BLOCKED',
      severity: 'HIGH',
      ip: extractClientIp(req),
      email: user.email,
      userId: user.uid,
      path: url.pathname,
      method: req.method,
      details: `User ${user.email} (${user.uid}) attempted unauthorized access to resource ${resourceId}. Access blocked.`,
    });
  } catch (logErr) {
    console.warn('[Ownership] Failed to record IDOR alert:', logErr);
  }

  return {
    authorized: false,
    status: 403,
    reason: 'Forbidden: You do not have permission to access this resource.',
    user,
  };
}
