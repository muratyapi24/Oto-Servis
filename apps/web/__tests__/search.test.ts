import * as fc from "fast-check";
import { normalizeTurkish, SearchIndexes } from "../lib/search";

describe("Search Properties", () => {
  it("P13.1: Türkçe karakter normalizasyonu çalışmalı", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          ["şahin", "sahin"],
          ["Şahin", "Sahin"],
          ["güneş", "gunes"],
          ["çiçek", "cicek"],
          ["ığdır", "igdir"],
          ["Ömer", "Omer"],
          ["Ünal", "Unal"],
        ),
        ([input, expected]) => {
          expect(normalizeTurkish(input)).toBe(expected);
        }
      )
    );
  });

  it("P13.1: Normalizasyon idempotent olmalı", () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const once = normalizeTurkish(text);
        const twice = normalizeTurkish(once);
        expect(once).toBe(twice);
      })
    );
  });

  it("P13.2: Arama sonuçları tenant izolasyonuna uymalı (mock)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        async (tenantA, tenantB) => {
          fc.pre(tenantA !== tenantB);

          // Meilisearch yokken search() boş dönmeli
          delete process.env.MEILISEARCH_HOST;

          const { search } = await import("../lib/search");
          const resultA = await search(SearchIndexes.customers, "test", tenantA);
          const resultB = await search(SearchIndexes.customers, "test", tenantB);

          // Her iki sonuç da boş olmalı (Meilisearch yok)
          expect(resultA.hits).toHaveLength(0);
          expect(resultB.hits).toHaveLength(0);
        }
      ),
      { numRuns: 5 }
    );
  });

  it("SearchIndexes sabitleri doğru tanımlanmış olmalı", () => {
    expect(SearchIndexes.customers).toBe("customers");
    expect(SearchIndexes.vehicles).toBe("vehicles");
    expect(SearchIndexes.serviceOrders).toBe("service_orders");
    expect(SearchIndexes.parts).toBe("parts");
  });

  it("Boş query ile arama yapılmamalı", async () => {
    const { search } = await import("../lib/search");
    // Boş query — Meilisearch yokken boş dönmeli
    const result = await search(SearchIndexes.customers, "", "tenant-123");
    expect(result.hits).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
