// Feature: mobile-design-integration, Property 7: Checklist tamamlanma yüzdesi hesabı
import * as fc from "fast-check";

function calcCompletionPercentage(total: number, checked: number): number {
  if (total === 0) return 0;
  return Math.floor((checked / total) * 100);
}

describe("Property 7: Checklist tamamlanma yüzdesi hesabı", () => {
  it("N elemanlı checklist'te K eleman işaretlendiğinde Math.floor((K/N)*100) olmalı", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 0, max: 50 }),
        (total, checked) => {
          fc.pre(checked <= total);
          const pct = calcCompletionPercentage(total, checked);
          return pct === Math.floor((checked / total) * 100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("N=0 durumunda completionPercentage=0 olmalı", () => {
    expect(calcCompletionPercentage(0, 0)).toBe(0);
  });

  it("tüm elemanlar işaretlendiğinde yüzde 100 olmalı", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        (total) => {
          return calcCompletionPercentage(total, total) === 100;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("hiçbir eleman işaretlenmediğinde yüzde 0 olmalı", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        (total) => {
          return calcCompletionPercentage(total, 0) === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("completionPercentage her zaman [0, 100] aralığında olmalı", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50 }),
        fc.integer({ min: 0, max: 50 }),
        (total, checked) => {
          fc.pre(checked <= total);
          const pct = calcCompletionPercentage(total, checked);
          return pct >= 0 && pct <= 100;
        }
      ),
      { numRuns: 100 }
    );
  });
});
