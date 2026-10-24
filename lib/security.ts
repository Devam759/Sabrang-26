import crypto from 'crypto';

// 1. In-memory Rate Limiting Map
const rateLimitMap = new Map<string, { count: number; firstRequest: number }>();

/**
 * Custom in-memory rate limiting mechanism.
 * Limits the number of requests per IP within a specified time window.
 *
 * NOTE: This map is process-local. On serverless platforms like Cloud Run, each
 * new instance starts with an empty map, so very short bursts across cold-starts can
 * bypass the limit. For production-grade enforcement, replace this with a Redis-backed
 * limiter (e.g., Upstash). For Sabrang-scale traffic this is sufficient.
 */
export function isRateLimited(ip: string, limit: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  
  // Prune expired entries to prevent memory leaks when the map becomes large
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now - val.firstRequest > windowMs) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, firstRequest: now });
    return false;
  }
  
  const rateData = rateLimitMap.get(ip)!;
  if (now - rateData.firstRequest > windowMs) {
    rateLimitMap.set(ip, { count: 1, firstRequest: now });
    return false;
  }
  
  if (rateData.count >= limit) {
    return true;
  }
  
  rateData.count++;
  return false;
}

/**
 * XSS & Script injection sanitation helper.
 * Strips HTML tags then escapes special characters.
 *
 * This function is idempotent - calling it twice on the same string
 * produces the same result. Tag-stripping removes < and > first; only then are
 * residual special chars (& " ') escaped. This avoids double-encoding issues
 * like &amp; → &amp;amp; on a second pass.
 */
export function sanitizeInput(val: any): any {
  if (typeof val === 'string') {
    const text = val.trim();
    // Do not escape HTML entities on URLs, data URIs, or file paths to preserve query parameters (&token=, etc.)
    if (/^(https?:\/\/|\/|data:image\/)/i.test(text)) {
      return text;
    }
    // Step 1: strip HTML/XML tags by removing everything between < and >
    let result = '';
    let inTag = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '<') {
        inTag = true;
      } else if (char === '>') {
        inTag = false;
      } else if (!inTag) {
        result += char;
      }
    }
    // Step 2: escape only the chars that survive tag-stripping.
    // Ampersand must be escaped first to avoid double-encoding (& → &amp;, not &&amp;).
    result = result
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    return result;
  }
  return val;
}

/**
 * Recursively sanitizes request objects to prevent nested injections.
 * Preserves arrays, null values, and recursively sanitizes nested objects and arrays.
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') {
    return sanitizeInput(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  const sanitized: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const lowerKey = key.toLowerCase();
      // Preserve ID card links and image URLs without HTML escaping &amp;
      if (
        (lowerKey.includes('card') || lowerKey.includes('url') || lowerKey.includes('image') || lowerKey.includes('photo')) &&
        typeof obj[key] === 'string'
      ) {
        let clean = obj[key].trim();
        while (clean.includes('&amp;')) {
          clean = clean.replace(/&amp;/g, '&');
        }
        sanitized[key] = clean;
      } else {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
  }
  return sanitized;
}

export const isProd = (process.env.NEXT_PUBLIC_CASHFREE_ENV || '').replace(/['"]/g, '').trim().toUpperCase() === 'PRODUCTION';

export const cashfreeAppId = isProd
  ? (process.env.CASHFREE_PROD_APP_ID || process.env.CASHFREE_APP_ID || '')
  : (process.env.CASHFREE_TEST_APP_ID || process.env.CASHFREE_APP_ID || '');

export const cashfreeSecretKey = isProd
  ? (process.env.CASHFREE_PROD_SECRET_KEY || process.env.CASHFREE_SECRET_KEY || '')
  : (process.env.CASHFREE_TEST_SECRET_KEY || process.env.CASHFREE_SECRET_KEY || '');

/**
 * Verifies the validity of the signature sent by Cashfree Webhooks.
 * Uses SHA-256 HMAC of (timestamp + rawBody) computed with the active Cashfree secret key.
 * Uses crypto.timingSafeEqual to prevent timing side-channel attacks.
 */
export function verifyCashfreeSignature(signature: string, rawBody: string, timestamp: string): boolean {
  const secretKey = cashfreeSecretKey;
  if (!secretKey) {
    console.error("Signature verification failed: Cashfree Secret Key is missing.");
    return false;
  }
  if (!signature || !timestamp || !rawBody) {
    return false;
  }
  
  const data = timestamp + rawBody;
  const computedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(data)
    .digest('base64');

  // Use constant-time comparison to prevent timing side-channel attacks
  try {
    const expectedBuf = Buffer.from(computedSignature, 'base64');
    const receivedBuf = Buffer.from(signature, 'base64');
    return expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

/**
 * Secret used for signing receipt download tokens.
 * Falls back to Cashfree secret or an environment-specific key.
 */
const receiptSigningSecret = process.env.RECEIPT_SIGNING_SECRET || cashfreeSecretKey || 'sabrang_receipt_token_signing_secret_2026';

/**
 * Creates a cryptographically signed HMAC token for authorized receipt downloads.
 * Scoped to the specific registrationId and orderId, with an expiration timestamp.
 */
export function createReceiptToken(registrationId: string, orderId: string, expiresInHours: number = 72): string {
  const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000;
  const payload = `${registrationId}:${orderId}:${expiresAt}`;
  const signature = crypto
    .createHmac('sha256', receiptSigningSecret)
    .update(payload)
    .digest('hex');
  return `${expiresAt}.${signature}`;
}

/**
 * Verifies a receipt download token against the given registrationId and orderId.
 */
export function verifyReceiptToken(token: string, registrationId: string, orderId: string): boolean {
  if (!token || typeof token !== 'string' || !registrationId || !orderId) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [expiresAtStr, signature] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return false; // Token expired
  }
  const payload = `${registrationId}:${orderId}:${expiresAt}`;
  const expectedSig = crypto
    .createHmac('sha256', receiptSigningSecret)
    .update(payload)
    .digest('hex');

  try {
    const expectedBuf = Buffer.from(expectedSig, 'hex');
    const actualBuf = Buffer.from(signature, 'hex');
    return expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}

/**
 * Standardizes mobile numbers to always format as +91 1234567890.
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    return `+91 ${digits.slice(-10)}`;
  }
  return phone;
}

/**
 * Masks an email address to protect PII in logs (e.g. d***m@gmail.com).
 */
export function maskEmail(email: string): string {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return '[REDACTED]';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) return `***@${domain}`;
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}



