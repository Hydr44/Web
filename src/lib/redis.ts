/**
 * Redis Client (Upstash)
 * Cache layer per query frequenti, session management, rate limiting
 */

import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Missing Upstash Redis credentials');
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * Cache wrapper con TTL
 */
export async function getCached<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  try {
    // Try cache
    const cached = await redis.get(key);
    if (cached) {
      console.log(`[Redis] Cache HIT: ${key}`);
      return cached as T;
    }

    // Miss: fetch data
    console.log(`[Redis] Cache MISS: ${key}`);
    const data = await fetcher();

    // Store in cache
    await redis.setex(key, ttl, JSON.stringify(data));

    return data;
  } catch (error) {
    console.error(`[Redis] Error in getCached(${key}):`, error);
    // Fallback: fetch without cache
    return fetcher();
  }
}

/**
 * Invalidate cache pattern (e.g., "transports:org-123:*")
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    // Upstash doesn't support KEYS pattern, so we need to track keys manually
    // For now, we'll use a simple approach: store cache keys in a set
    const keys = await redis.smembers(`cache-keys:${pattern}`);
    if (keys && keys.length > 0) {
      await redis.del(...(keys as string[]));
    }
    console.log(`[Redis] Invalidated cache pattern: ${pattern}`);
  } catch (error) {
    console.error(`[Redis] Error invalidating cache:`, error);
  }
}

/**
 * Session management
 */
export async function createSession(
  sessionId: string,
  data: { userId: string; orgId: string; email: string },
  ttl: number = 86400 // 24h default
): Promise<void> {
  try {
    await redis.setex(`session:${sessionId}`, ttl, JSON.stringify(data));
    console.log(`[Redis] Session created: ${sessionId}`);
  } catch (error) {
    console.error(`[Redis] Error creating session:`, error);
    throw error;
  }
}

export async function getSession(sessionId: string): Promise<any> {
  try {
    const session = await redis.get(`session:${sessionId}`);
    if (!session) {
      console.log(`[Redis] Session not found: ${sessionId}`);
      return null;
    }
    console.log(`[Redis] Session retrieved: ${sessionId}`);
    return JSON.parse(session as string);
  } catch (error) {
    console.error(`[Redis] Error getting session:`, error);
    return null;
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  try {
    await redis.del(`session:${sessionId}`);
    console.log(`[Redis] Session deleted: ${sessionId}`);
  } catch (error) {
    console.error(`[Redis] Error deleting session:`, error);
  }
}

/**
 * Rate limiting
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  try {
    const current = await redis.incr(key);
    let ttl = await redis.ttl(key);

    if (current === 1) {
      // First request in window
      await redis.expire(key, windowSeconds);
      ttl = windowSeconds;
    }

    const allowed = current <= limit;
    const remaining = Math.max(0, limit - current);
    const resetAt = Date.now() + (ttl * 1000);

    console.log(`[Redis] Rate limit check: ${key} (${current}/${limit})`);

    return { allowed, remaining, resetAt };
  } catch (error) {
    console.error(`[Redis] Error checking rate limit:`, error);
    // Fallback: allow request
    return { allowed: true, remaining: limit, resetAt: Date.now() + 60000 };
  }
}

/**
 * Counter (per analytics, stats)
 */
export async function incrementCounter(key: string, value: number = 1): Promise<number> {
  try {
    const result = await redis.incrby(key, value);
    // Set expiry to 30 days if first increment
    if (result === value) {
      await redis.expire(key, 2592000); // 30 days
    }
    return result as number;
  } catch (error) {
    console.error(`[Redis] Error incrementing counter:`, error);
    return 0;
  }
}

/**
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await redis.ping();
    console.log('[Redis] Health check: OK');
    return true;
  } catch (error) {
    console.error('[Redis] Health check failed:', error);
    return false;
  }
}
