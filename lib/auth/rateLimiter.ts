import { NextResponse } from 'next/server';

/**
 * Enterprise Sliding Window Abuse & Rate Limiting System
 * Provides multi-tier rate limiting for:
 * 1. Login attempts (prevent brute force / credential stuffing)
 * 2. Password reset & verification attempts
 * 3. Account creation & registration spam (prevent bot account farming)
 * 4. AI generation requests (prevent token draining and compute abuse)
 * 5. General & Sensitive API endpoints (prevent automated scraping and DoS)
 */

export type RateLimitActionType =
  | 'login'
  | 'reset'
  | 'register'
  | 'ai_generation'
  | 'api_endpoint'
  | 'api_sensitive';

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  lockedUntil?: number;
}

// Dedicated in-memory storage maps for clean isolation across categories
const loginAttemptStore = new Map<string, RateLimitRecord>();
const resetAttemptStore = new Map<string, RateLimitRecord>();
const registerAttemptStore = new Map<string, RateLimitRecord>();
const aiAttemptStore = new Map<string, RateLimitRecord>();
const apiAttemptStore = new Map<string, RateLimitRecord>();

function getStoreForType(type: RateLimitActionType): Map<string, RateLimitRecord> {
  switch (type) {
    case 'login':
      return loginAttemptStore;
    case 'reset':
      return resetAttemptStore;
    case 'register':
      return registerAttemptStore;
    case 'ai_generation':
      return aiAttemptStore;
    case 'api_endpoint':
    case 'api_sensitive':
      return apiAttemptStore;
  }
}

// Periodic cleanup of stale records every 10 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function pruneStore(store: Map<string, RateLimitRecord>, maxAgeMs: number) {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now - record.lastAttemptAt > maxAgeMs) {
      store.delete(key);
    }
  }
}

function runPeriodicCleanup() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    lastCleanup = now;
    pruneStore(loginAttemptStore, 30 * 60 * 1000);
    pruneStore(resetAttemptStore, 60 * 60 * 1000);
    pruneStore(registerAttemptStore, 30 * 60 * 1000);
    pruneStore(aiAttemptStore, 60 * 60 * 1000);
    pruneStore(apiAttemptStore, 10 * 60 * 1000);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  totalAttempts: number;
  retryAfterSeconds?: number;
  resetTimestamp?: number;
  message?: string;
}

/**
 * Checks whether an action for a given identifier is permitted without consuming a quota token.
 */
export function checkRateLimit(
  type: RateLimitActionType,
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000,
  lockoutDurationMs: number = 15 * 60 * 1000
): RateLimitResult {
  runPeriodicCleanup();
  const store = getStoreForType(type);
  const key = `${type}:${identifier.toLowerCase().trim()}`;
  const now = Date.now();

  const record = store.get(key);

  if (!record) {
    return {
      allowed: true,
      remainingAttempts: maxAttempts,
      totalAttempts: 0,
      resetTimestamp: now + windowMs,
    };
  }

  // Check if currently locked out
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      totalAttempts: record.attempts,
      retryAfterSeconds,
      resetTimestamp: record.lockedUntil,
      message: `Too many attempts. Temporarily locked for security. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).`,
    };
  }

  // If window has passed and not currently locked out, reset record
  if (now - record.firstAttemptAt > windowMs) {
    store.delete(key);
    return {
      allowed: true,
      remainingAttempts: maxAttempts,
      totalAttempts: 0,
      resetTimestamp: now + windowMs,
    };
  }

  // Check if attempts reached or exceeded threshold
  if (record.attempts >= maxAttempts) {
    record.lockedUntil = now + lockoutDurationMs;
    const retryAfterSeconds = Math.ceil(lockoutDurationMs / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      totalAttempts: record.attempts,
      retryAfterSeconds,
      resetTimestamp: record.lockedUntil,
      message: `Too many attempts. Temporarily locked for security. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).`,
    };
  }

  return {
    allowed: true,
    remainingAttempts: Math.max(0, maxAttempts - record.attempts),
    totalAttempts: record.attempts,
    resetTimestamp: record.firstAttemptAt + windowMs,
  };
}

/**
 * Consumes 1 attempt from the quota and returns whether the request was allowed.
 * Suitable for API rate limiting, AI generation, and Account creation.
 */
export function consumeRateLimit(
  type: RateLimitActionType,
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 60 * 1000,
  lockoutDurationMs: number = 60 * 1000,
  customMessage?: string
): RateLimitResult {
  runPeriodicCleanup();
  const store = getStoreForType(type);
  const key = `${type}:${identifier.toLowerCase().trim()}`;
  const now = Date.now();

  let record = store.get(key);

  if (!record || now - record.firstAttemptAt > windowMs) {
    // New window or fresh record
    record = {
      attempts: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
    };
    store.set(key, record);
    return {
      allowed: true,
      remainingAttempts: Math.max(0, maxAttempts - 1),
      totalAttempts: 1,
      resetTimestamp: now + windowMs,
    };
  }

  // Check if currently locked out
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      totalAttempts: record.attempts,
      retryAfterSeconds,
      resetTimestamp: record.lockedUntil,
      message: customMessage || `Rate limit exceeded. Please wait ${retryAfterSeconds}s before retrying.`,
    };
  }

  // Increment attempt count
  record.attempts += 1;
  record.lastAttemptAt = now;

  if (record.attempts > maxAttempts) {
    record.lockedUntil = now + lockoutDurationMs;
    store.set(key, record);
    const retryAfterSeconds = Math.ceil(lockoutDurationMs / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      totalAttempts: record.attempts,
      retryAfterSeconds,
      resetTimestamp: record.lockedUntil,
      message: customMessage || `Rate limit exceeded. Please wait ${retryAfterSeconds}s before retrying.`,
    };
  }

  store.set(key, record);
  return {
    allowed: true,
    remainingAttempts: Math.max(0, maxAttempts - record.attempts),
    totalAttempts: record.attempts,
    resetTimestamp: record.firstAttemptAt + windowMs,
  };
}

/**
 * Records a failed attempt for an identifier (e.g. incorrect password).
 */
export function recordRateLimitFailure(
  type: RateLimitActionType,
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000,
  lockoutDurationMs: number = 15 * 60 * 1000
): RateLimitResult {
  runPeriodicCleanup();
  const store = getStoreForType(type);
  const key = `${type}:${identifier.toLowerCase().trim()}`;
  const now = Date.now();

  let record = store.get(key);

  if (!record || now - record.firstAttemptAt > windowMs) {
    record = {
      attempts: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
    };
  } else {
    record.attempts += 1;
    record.lastAttemptAt = now;
  }

  if (record.attempts >= maxAttempts) {
    record.lockedUntil = now + lockoutDurationMs;
    store.set(key, record);
    const retryAfterSeconds = Math.ceil(lockoutDurationMs / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      totalAttempts: record.attempts,
      retryAfterSeconds,
      resetTimestamp: record.lockedUntil,
      message: `Too many failed attempts. Temporary lockout activated. Please wait ${Math.ceil(retryAfterSeconds / 60)} minute(s).`,
    };
  }

  store.set(key, record);
  return {
    allowed: true,
    remainingAttempts: Math.max(0, maxAttempts - record.attempts),
    totalAttempts: record.attempts,
    resetTimestamp: record.firstAttemptAt + windowMs,
  };
}

/**
 * Resets the rate limit counter upon successful authentication or verified action.
 */
export function resetRateLimit(type: RateLimitActionType, identifier: string): void {
  const store = getStoreForType(type);
  const key = `${type}:${identifier.toLowerCase().trim()}`;
  store.delete(key);
}

// -------------------------------------------------------------
// Specialized Domain Rate Limiters
// -------------------------------------------------------------

/**
 * Account Creation Rate Limiter:
 * Strictly limits account creations / registrations to 5 per 15 minutes per IP.
 * Prevents automated scripts and bots from mass farming accounts or fake bookings.
 */
export function checkAccountCreationRateLimit(ip: string): RateLimitResult {
  return consumeRateLimit(
    'register',
    ip,
    5, // max 5 account creations / orders per 15 min per IP
    15 * 60 * 1000,
    15 * 60 * 1000,
    'Too many accounts or registrations created from this address. Please try again after 15 minutes.'
  );
}

/**
 * AI Generation Rate Limiter:
 * Strictly limits AI generation requests to 5 per minute and 25 per hour per user/IP.
 * Protects expensive token budgets and prevents automated LLM scraping or denial-of-wallet.
 */
export function checkAiGenerationRateLimit(identifier: string): RateLimitResult {
  // Short-window burst check: 5 requests per 60 seconds
  const burstResult = consumeRateLimit(
    'ai_generation',
    `${identifier}:burst`,
    5,
    60 * 1000,
    60 * 1000,
    'AI generation rate limit exceeded (max 5 requests per minute). Please wait a moment.'
  );

  if (!burstResult.allowed) {
    return burstResult;
  }

  // Hourly sustained check: 25 requests per 60 minutes
  const hourlyResult = consumeRateLimit(
    'ai_generation',
    `${identifier}:hourly`,
    25,
    60 * 60 * 1000,
    60 * 60 * 1000,
    'Hourly AI generation limit exceeded (max 25 requests per hour). Please try again later.'
  );

  return hourlyResult;
}

/**
 * API Endpoint Rate Limiter:
 * Protects public API endpoints from bot scraping and automated loops.
 * Standard endpoints: 60 requests per minute per IP.
 * Sensitive endpoints: 15 requests per minute per IP.
 */
export function checkApiEndpointRateLimit(
  ip: string,
  isSensitive: boolean = false
): RateLimitResult {
  if (isSensitive) {
    return consumeRateLimit(
      'api_sensitive',
      ip,
      15, // max 15 requests per minute
      60 * 1000,
      60 * 1000,
      'API rate limit exceeded for sensitive operation. Please wait a minute.'
    );
  }

  return consumeRateLimit(
    'api_endpoint',
    ip,
    60, // max 60 requests per minute
    60 * 1000,
    60 * 1000,
    'API rate limit exceeded. Automated scraping is strictly prohibited.'
  );
}

/**
 * Builds standard RFC-compliant rate limit HTTP response headers.
 */
export function getRateLimitHeaders(
  result: RateLimitResult,
  limit: number
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(Math.max(0, result.remainingAttempts)),
    'X-RateLimit-Reset': String(result.resetTimestamp ? Math.ceil(result.resetTimestamp / 1000) : 0),
  };

  if (!result.allowed && result.retryAfterSeconds) {
    headers['Retry-After'] = String(result.retryAfterSeconds);
  }

  return headers;
}

/**
 * Creates a standardized 429 Too Many Requests response with appropriate security headers.
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  limit: number = 5
): NextResponse {
  return NextResponse.json(
    {
      error: result.message || 'Too many requests. Please try again later.',
      retryAfterSeconds: result.retryAfterSeconds || 60,
    },
    {
      status: 429,
      headers: getRateLimitHeaders(result, limit),
    }
  );
}

/**
 * Extracts a sanitized client IP from incoming request headers.
 */
export function extractClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();
  return '127.0.0.1';
}
