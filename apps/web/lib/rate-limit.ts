/**
 * Rate Limiting — Sliding Window algoritması
 * Upstash Redis veya in-memory fallback
 */

interface RateLimitConfig {
  limit: number;
  window: number; // saniye
}

const RATE_LIMIT_GROUPS: Record<string, RateLimitConfig> = {
  auth: { limit: 10, window: 60 },
  upload: { limit: 5, window: 60 },
  approval: { limit: 3, window: 300 },
  general: { limit: 100, window: 60 },
};

// In-memory fallback (Redis yoksa)
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

function getGroup(pathname: string): string {
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/login")) return "auth";
  if (pathname.startsWith("/api/upload")) return "upload";
  if (pathname.startsWith("/api/approval")) return "approval";
  return "general";
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(ip: string, pathname: string): Promise<RateLimitResult> {
  // Geliştirme ortamında atla
  if (process.env.NODE_ENV === "development") {
    return { success: true, remaining: 999, resetAt: Date.now() + 60000 };
  }

  const group = getGroup(pathname);
  const config = RATE_LIMIT_GROUPS[group]!;
  const key = `rate_limit:${ip}:${group}`;
  const now = Date.now();

  // Upstash Redis dene
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      const { Redis } = await import("@upstash/redis/cloudflare");
      const redis = new Redis({ url: redisUrl, token: redisToken });
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, config.window);
      }
      const ttl = await redis.ttl(key);
      const resetAt = now + ttl * 1000;
      const remaining = Math.max(0, config.limit - count);
      return { success: count <= config.limit, remaining, resetAt };
    } catch {
      // Redis hatası — in-memory fallback'e geç
    }
  }

  // In-memory fallback
  const entry = inMemoryStore.get(key);
  const resetAt = entry ? entry.resetAt : now + config.window * 1000;

  if (!entry || now > entry.resetAt) {
    inMemoryStore.set(key, { count: 1, resetAt: now + config.window * 1000 });
    return { success: true, remaining: config.limit - 1, resetAt: now + config.window * 1000 };
  }

  entry.count++;
  const remaining = Math.max(0, config.limit - entry.count);
  return { success: entry.count <= config.limit, remaining, resetAt };
}
