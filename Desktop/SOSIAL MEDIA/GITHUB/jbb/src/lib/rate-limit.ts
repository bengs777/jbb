/**
 * In-memory rate limiter (suitable for single-instance / serverless with low concurrency).
 * For multi-instance, swap the Map with Redis/upstash-ratelimit.
 *
 * Usage:
 *   const result = rateLimit(ip, 10, 60_000)   // 10 req per 60 sec
 *   if (!result.ok) return err("Too many requests", 429)
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
      if (now > entry.resetAt) store.delete(key);
    });
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * @param key     Unique key (e.g. `${userId}:topup:order`)
 * @param limit   Max requests allowed in the window
 * @param windowMs  Window size in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count++;
  const remaining = Math.max(0, limit - entry.count);

  if (entry.count > limit) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { ok: true, remaining, resetAt: entry.resetAt };
}
