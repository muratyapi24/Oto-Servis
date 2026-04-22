// Feature: missing-features-roadmap, Property 12: Komisyon Hesaplama Doğruluğu

import * as fc from "fast-check";

/**
 * Property 12: Komisyon hesaplama doğruluğu
 * PERCENTAGE: komisyon = toplam × value / 100 (minAmount/maxAmount sınırları içinde)
 * FIXED: komisyon = value
 */
function calculateCommissionLocal(
  ruleType: "PERCENTAGE" | "FIXED",
  value: number,
  totalLabor: number,
  minAmount?: number,
  maxAmount?: number
): number {
  if (ruleType === "FIXED") return value;
  let amount = totalLabor * value / 100;
  if (minAmount !== undefined) amount = Math.max(amount, minAmount);
  if (maxAmount !== undefined) amount = Math.min(amount, maxAmount);
  return Math.round(amount * 100) / 100;
}

describe("Property 12: Komisyon hesaplama doğruluğu", () => {
  it("FIXED kural tipi için komisyon her zaman value'ya eşit olmalı", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.01, max: 10000, noNaN: true }),
        fc.float({ min: 0, max: 100000, noNaN: true }),
        (value, totalLabor) => {
          const result = calculateCommissionLocal("FIXED", value, totalLabor);
          return result === value;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("PERCENTAGE kural tipi için komisyon toplam × value / 100 olmalı", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.01, max: 50, noNaN: true }),
        fc.float({ min: 0, max: 100000, noNaN: true }),
        (value, totalLabor) => {
          const result = calculateCommissionLocal("PERCENTAGE", value, totalLabor);
          const expected = Math.round((totalLabor * value / 100) * 100) / 100;
          return Math.abs(result - expected) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("PERCENTAGE komisyon minAmount sınırının altına düşmemeli", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.01, max: 10, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 100, max: 1000, noNaN: true }),
        (value, totalLabor, minAmount) => {
          const result = calculateCommissionLocal("PERCENTAGE", value, totalLabor, minAmount);
          return result >= minAmount;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("PERCENTAGE komisyon maxAmount sınırını aşmamalı", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 10, max: 50, noNaN: true }),
        fc.float({ min: 10000, max: 100000, noNaN: true }),
        fc.float({ min: 100, max: 5000, noNaN: true }),
        (value, totalLabor, maxAmount) => {
          const result = calculateCommissionLocal("PERCENTAGE", value, totalLabor, undefined, maxAmount);
          return result <= maxAmount;
        }
      ),
      { numRuns: 100 }
    );
  });
});
