/**
 * In-memory rate limiting utility with automatic garbage collection to prevent memory leaks.
 */

interface RateLimitBucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, RateLimitBucket>();

// Cleanup interval to remove stale buckets every 5 minutes
if (typeof global !== "undefined" && !(global as any).__rateLimitInterval) {
  (global as any).__rateLimitInterval = setInterval(() => {
    const now = Date.now();
    buckets.forEach((bucket, key) => {
      if (now - bucket.windowStart > 3600 * 1000) { // Keep history up to 1 hour
        buckets.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}

/**
 * Checks if a request exceeds rate limits.
 * @param key Unique identifier (e.g., API connect key or IP address)
 * @param limit Maximum allowed requests per window
 * @param windowSeconds Window size in seconds
 * @returns boolean true if allowed, false if rate-limited
 */
export function checkRateLimit(key: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const current = buckets.get(key);

  if (!current || now - current.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count++;
  buckets.set(key, current);
  return true;
}
