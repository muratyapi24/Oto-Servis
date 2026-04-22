/**
 * Redis Önbellekleme Katmanı — Upstash Redis + in-memory fallback
 * Ortam değişkenleri: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 */

// In-memory fallback store
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

function getFromMemory<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  try {
    return JSON.parse(entry.value) as T;
  } catch {
    return null;
  }
}

function setInMemory(key: string, value: unknown, ttlSeconds: number): void {
  memoryCache.set(key, {
    value: JSON.stringify(value),
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

function deleteFromMemory(key: string): void {
  // Pattern silme desteği (* wildcard)
  if (key.endsWith("*")) {
    const prefix = key.slice(0, -1);
    for (const k of memoryCache.keys()) {
      if (k.startsWith(prefix)) memoryCache.delete(k);
    }
  } else {
    memoryCache.delete(key);
  }
}

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const { Redis } = await import("@upstash/redis");
    return new Redis({ url, token });
  } catch {
    return null;
  }
}

/**
 * Önbellekten veri al; yoksa fetcher'ı çalıştır ve sonucu önbelleğe yaz.
 * Redis yoksa in-memory fallback kullanır.
 */
export async function getCached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const redis = await getRedis();

  if (redis) {
    try {
      const cached = await redis.get<T>(key);
      if (cached !== null && cached !== undefined) {
        return cached;
      }
      const fresh = await fetcher();
      await redis.setex(key, ttlSeconds, JSON.stringify(fresh));
      return fresh;
    } catch {
      // Redis hatası — in-memory fallback'e geç
    }
  }

  // In-memory fallback
  const cached = getFromMemory<T>(key);
  if (cached !== null) return cached;

  const fresh = await fetcher();
  setInMemory(key, fresh, ttlSeconds);
  return fresh;
}

/**
 * Belirtilen key veya pattern'e uyan önbellek girdilerini sil.
 * Pattern için * wildcard kullanılabilir: "dashboard:kpi:tenant123*"
 */
export async function invalidateCache(keyOrPattern: string): Promise<void> {
  const redis = await getRedis();

  if (redis) {
    try {
      if (keyOrPattern.endsWith("*")) {
        // Redis SCAN ile pattern silme
        const keys = await redis.keys(keyOrPattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else {
        await redis.del(keyOrPattern);
      }
    } catch {
      // Redis hatası — in-memory'den de sil
    }
  }

  // Her durumda in-memory'den de temizle
  deleteFromMemory(keyOrPattern);
}

/**
 * Cache key şablonları
 */
export const CacheKeys = {
  dashboardKpi: (tenantId: string) => `dashboard:kpi:${tenantId}`,
  inventoryParts: (tenantId: string, page = 0) => `inventory:parts:${tenantId}:${page}`,
  customerList: (tenantId: string, page = 0) => `customers:list:${tenantId}:${page}`,
  analytics: (tenantId: string, period: string) => `analytics:${tenantId}:${period}`,
} as const;

export const CacheTTL = {
  dashboardKpi: 300,    // 5 dakika
  inventoryParts: 600,  // 10 dakika
  customerList: 120,    // 2 dakika
  analytics: 3600,      // 1 saat
} as const;
