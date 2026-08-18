import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Serverless Upstash Redis client.
 * Returns null if credentials are not configured, enabling graceful local fallbacks.
 */
export const redis =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null;

/**
 * Standard API Rate Limiter: 20 requests per 10 seconds per IP.
 * Used to protect public endpoints (e.g. registration, coupon verify, attendance).
 */
export const apiRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "10 s"),
      analytics: true,
      prefix: "sabrang_ratelimit",
    })
  : null;

/**
 * Strict Rate Limiter for sensitive actions (e.g. login attempts, check-in scans):
 * 5 requests per 10 seconds per IP.
 */
export const strictRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "10 s"),
      analytics: true,
      prefix: "sabrang_strict_ratelimit",
    })
  : null;

/**
 * Helper to cache expensive database queries with automatic expiration.
 *
 * @param key Unique Redis cache key
 * @param fetcher Async function that fetches fresh data if cache misses
 * @param ttlSeconds Time-to-live in seconds (default: 300s = 5 minutes)
 */
export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 300
): Promise<T> {
  if (!redis) {
    return await fetcher();
  }

  try {
    const cached = await redis.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
  } catch (error) {
    console.warn(`[Redis Cache Error for key "${key}"]:`, error);
  }

  const freshData = await fetcher();

  if (redis && freshData !== undefined) {
    try {
      await redis.set(key, freshData, { ex: ttlSeconds });
    } catch (error) {
      console.warn(`[Redis Set Error for key "${key}"]:`, error);
    }
  }

  return freshData;
}
