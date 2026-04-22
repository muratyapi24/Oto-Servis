// Feature: web-mobile-sync
// Property 3: ServiceRating ortalama hesaplama
// Property 4: Puan dağılımı tutarlılığı

import * as fc from "fast-check";

// ── Üretim kodundan alınan saf fonksiyonlar ──

/**
 * 1-5 arası integer rating dizisinden ortalama hesaplar.
 * Boş dizi için 0 döndürür.
 */
function calculateRatingAverage(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((a, b) => a + b, 0);
  return sum / ratings.length;
}

/**
 * Rating dizisinden 1-5 dağılımı hesaplar.
 * Her kategori için kaç adet rating olduğunu döndürür.
 */
function calculateRatingDistribution(
  ratings: number[]
): Record<string, number> {
  const dist: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  ratings.forEach((r) => {
    const key = String(r);
    if (key in dist) {
      dist[key]++;
    }
  });
  return dist;
}

// 1-5 arası integer üreteci
const ratingArb = fc.integer({ min: 1, max: 5 });
const ratingsArrayArb = fc.array(ratingArb, { minLength: 1, maxLength: 1000 });

// ── Property 3: Ortalama hesaplama ──
describe("Feature: web-mobile-sync, Property 3: ServiceRating ortalama hesaplama", () => {
  it("boş dizi için 0 döndürür", () => {
    expect(calculateRatingAverage([])).toBe(0);
  });

  it("tek elemanlı dizi için elemanın kendisini döndürür", () => {
    fc.assert(
      fc.property(ratingArb, (rating) => {
        const avg = calculateRatingAverage([rating]);
        expect(avg).toBe(rating);
      }),
      { numRuns: 100 }
    );
  });

  it("sonuç her zaman [1, 5] aralığında olmalıdır", () => {
    fc.assert(
      fc.property(ratingsArrayArb, (ratings) => {
        const avg = calculateRatingAverage(ratings);
        expect(avg).toBeGreaterThanOrEqual(1);
        expect(avg).toBeLessThanOrEqual(5);
      }),
      { numRuns: 100 }
    );
  });

  it("tüm elemanlar aynıysa ortalama o elemana eşit olmalıdır", () => {
    fc.assert(
      fc.property(
        ratingArb,
        fc.integer({ min: 1, max: 100 }),
        (rating, count) => {
          const ratings = Array(count).fill(rating);
          const avg = calculateRatingAverage(ratings);
          expect(Math.abs(avg - rating)).toBeLessThan(0.0001);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("ortalama minimum ve maksimum arasında olmalıdır", () => {
    fc.assert(
      fc.property(ratingsArrayArb, (ratings) => {
        const avg = calculateRatingAverage(ratings);
        const min = Math.min(...ratings);
        const max = Math.max(...ratings);
        expect(avg).toBeGreaterThanOrEqual(min);
        expect(avg).toBeLessThanOrEqual(max);
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 4: Puan dağılımı tutarlılığı ──
describe("Feature: web-mobile-sync, Property 4: Puan dağılımı tutarlılığı", () => {
  it("dağılım kategorilerinin toplamı toplam kayıt sayısına eşit olmalıdır", () => {
    fc.assert(
      fc.property(ratingsArrayArb, (ratings) => {
        const dist = calculateRatingDistribution(ratings);
        const distTotal = Object.values(dist).reduce((a, b) => a + b, 0);
        expect(distTotal).toBe(ratings.length);
      }),
      { numRuns: 100 }
    );
  });

  it("dağılımda her kategori değeri negatif olmamalıdır", () => {
    fc.assert(
      fc.property(ratingsArrayArb, (ratings) => {
        const dist = calculateRatingDistribution(ratings);
        Object.values(dist).forEach((count) => {
          expect(count).toBeGreaterThanOrEqual(0);
        });
      }),
      { numRuns: 100 }
    );
  });

  it("dağılım her zaman 1-5 anahtarlarını içermelidir", () => {
    fc.assert(
      fc.property(ratingsArrayArb, (ratings) => {
        const dist = calculateRatingDistribution(ratings);
        ["1", "2", "3", "4", "5"].forEach((key) => {
          expect(key in dist).toBe(true);
        });
      }),
      { numRuns: 100 }
    );
  });

  it("boş dizi için tüm kategoriler 0 olmalıdır", () => {
    const dist = calculateRatingDistribution([]);
    Object.values(dist).forEach((count) => {
      expect(count).toBe(0);
    });
  });

  it("tek bir rating için sadece o kategori 1, diğerleri 0 olmalıdır", () => {
    fc.assert(
      fc.property(ratingArb, (rating) => {
        const dist = calculateRatingDistribution([rating]);
        expect(dist[String(rating)]).toBe(1);
        ["1", "2", "3", "4", "5"]
          .filter((k) => k !== String(rating))
          .forEach((k) => {
            expect(dist[k]).toBe(0);
          });
      }),
      { numRuns: 100 }
    );
  });
});
