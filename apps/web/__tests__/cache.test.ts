import * as fc from "fast-check";
import { getCached, invalidateCache, CacheKeys } from "../lib/cache";

describe("Cache Properties", () => {
  beforeEach(() => {
    // Her test öncesi in-memory store'u temizle
    jest.resetModules();
  });

  it("P5.1: TTL süresi dolmadan aynı key aynı değeri dönmeli", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 1000 }),
        async (key, value) => {
          const fetcher = jest.fn().mockResolvedValue(value);
          const result1 = await getCached(`test:${key}`, 60, fetcher);
          const result2 = await getCached(`test:${key}`, 60, fetcher);
          // İkinci çağrıda fetcher tekrar çağrılmamalı (cache hit)
          expect(result1).toBe(value);
          expect(result2).toBe(value);
          // Fetcher sadece 1 kez çağrılmalı
          expect(fetcher).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 10 }
    );
  });

  it("P5.2: invalidateCache sonrası fetcher yeniden çağrılmalı", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.integer({ min: 1, max: 500 }),
        fc.integer({ min: 501, max: 1000 }),
        async (key, value1, value2) => {
          const cacheKey = `test:invalidate:${key}`;
          let callCount = 0;
          const fetcher = jest.fn().mockImplementation(() => {
            callCount++;
            return Promise.resolve(callCount === 1 ? value1 : value2);
          });

          const r1 = await getCached(cacheKey, 60, fetcher);
          await invalidateCache(cacheKey);
          const r2 = await getCached(cacheKey, 60, fetcher);

          expect(r1).toBe(value1);
          expect(r2).toBe(value2);
          expect(fetcher).toHaveBeenCalledTimes(2);
        }
      ),
      { numRuns: 10 }
    );
  });

  it("P5.3: Redis yokken (env boş) sistem çökmemeli, DB fallback çalışmalı", async () => {
    const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
    const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer(),
        async (key, value) => {
          const fetcher = jest.fn().mockResolvedValue(value);
          // Redis yokken hata fırlatmamalı
          const result = await getCached(`fallback:${key}`, 30, fetcher);
          expect(result).toBe(value);
          expect(fetcher).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 5 }
    );

    process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
  });

  it("CacheKeys şablonları doğru format üretmeli", () => {
    fc.assert(
      fc.property(fc.uuid(), (tenantId) => {
        expect(CacheKeys.dashboardKpi(tenantId)).toBe(`dashboard:kpi:${tenantId}`);
        expect(CacheKeys.inventoryParts(tenantId)).toBe(`inventory:parts:${tenantId}:0`);
        expect(CacheKeys.customerList(tenantId)).toBe(`customers:list:${tenantId}:0`);
      })
    );
  });
});
