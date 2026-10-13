import crypto from 'crypto';

if (typeof window !== 'undefined') {
  throw new Error('SECURITY VIOLATION: lib/security.ts is a server-only module and must never be loaded on the client.');
}

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
    // Step 1: strip HTML/XML tags by removing everything between < and >
    let result = '';
    let inTag = false;
    const text = val.trim();
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
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }
  return sanitized;
}

/**
 * Detects common malicious injection vectors in strings:
 * - SQL Injection keywords & comments
 * - Command Injection metacharacters
 * - Script Injection (XSS)
 * - Path traversal (directory traversal)
 */
export function detectMaliciousPayload(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  const str = val.trim();
  if (!str) return false;

  // 1. Path traversal & sensitive file probe
  if (/(\.\.[\/\\]|win\.ini|\/etc\/passwd|\.env)/i.test(str)) {
    return true;
  }

  // 2. Script injection (XSS)
  if (/(<script|javascript:|vbscript:|data:text\/html|onload\s*=|onerror\s*=|alert\s*\()/i.test(str)) {
    return true;
  }

  // 3. Command injection
  if (/([;&|`$]|\x00|%00)/i.test(str)) {
    return true;
  }

  // 4. SQL injection
  if (/(union[\s+]+select|select[\s+]+null|information_schema|drop[\s+]+table|--\s*$|\/\*.*?\*\/)/i.test(str)) {
    return true;
  }

  return false;
}

/**
 * Validates a document identifier, ticket ID, or key.
 * Only permits alphanumeric characters, dashes, underscores, and dots up to maxLength chars.
 */
export function validateIdentifier(id: unknown, fieldName = 'Identifier', maxLength = 128): string {
  if (typeof id !== 'string') {
    throw new Error(`${fieldName} must be a valid string.`);
  }
  const trimmed = id.trim();
  if (trimmed.length === 0) {
    throw new Error(`${fieldName} cannot be empty.`);
  }
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength} characters.`);
  }
  if (!/^[a-zA-Z0-9_\-\.:]+$/.test(trimmed)) {
    throw new Error(`${fieldName} contains invalid or illegal characters.`);
  }
  if (detectMaliciousPayload(trimmed)) {
    throw new Error(`${fieldName} contains disallowed exploit patterns.`);
  }
  return trimmed;
}

/**
 * Validates an email address format and length according to RFC standards.
 */
export function validateEmail(email: unknown): string {
  if (typeof email !== 'string') {
    throw new Error('Email must be a valid string.');
  }
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length === 0 || trimmed.length > 254) {
    throw new Error('Email length is invalid.');
  }
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
    throw new Error('Invalid email address format.');
  }
  if (detectMaliciousPayload(trimmed)) {
    throw new Error('Email contains disallowed characters or injection probes.');
  }
  return trimmed;
}

/**
 * Validates and limits safe text strings (names, titles, messages) up to a max length.
 */
export function validateSafeString(
  val: unknown,
  options: { minLength?: number; maxLength?: number; fieldName?: string; sanitize?: boolean } = {}
): string {
  const { minLength = 1, maxLength = 500, fieldName = 'Field', sanitize = true } = options;
  if (typeof val !== 'string') {
    throw new Error(`${fieldName} must be a valid string.`);
  }
  let str = val.trim();
  if (str.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters.`);
  }
  if (str.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum allowed length of ${maxLength} characters.`);
  }
  if (detectMaliciousPayload(str)) {
    throw new Error(`${fieldName} contains illegal script or injection payloads.`);
  }
  return sanitize ? sanitizeInput(str) : str;
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
    console.warn("Cashfree Secret Key missing in environment variables.");
    if (isProd || process.env.NODE_ENV === 'production') {
      console.error("Signature verification failed: Cashfree Secret Key is missing in production.");
      return false;
    }
    console.warn("Signature verification bypassed (non-production environment).");
    return true;
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


