// Feature: mobile-design-integration, Property 8: Tier ilerleme yüzdesi hesabı
import * as fc from "fast-check";

const TIER_THRESHOLDS = {
  STANDARD: 0,
  BRONZE: 500,
  SILVER: 2000,
  GOLD: 5000,
  PLATINUM: 10000,
} as const;

type TierKey = keyof typeof TIER_THRESHOLDS;
const TIER_ORDER: TierKey[] = ['STANDARD', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

function calcTierProgress(points: number, currentTier: TierKey): number {
  const idx = TIER_ORDER.indexOf(currentTier);
  if (idx < 0 || idx >= TIER_ORDER.length - 1) return 100;
  const currentMin = TIER_THRESHOLDS[currentTier];
  const nextMin = TIER_THRESHOLDS[TIER_ORDER[idx + 1]];
  const range = nextMin - currentMin;
  if (range <= 0) return 100;
  return Math.min(100, Math.max(0, Math.floor(((points - currentMin) / range) * 100)));
}

describe("Property 8: Tier ilerleme yüzdesi hesabı", () => {
  it("progressPercent her zaman [0, 100] aralığında olmalı", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 15000 }),
        fc.constantFrom(...TIER_ORDER),
        (points, tier) => {
          const pct = calcTierProgress(points, tier);
          return pct >= 0 && pct <= 100;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("PLATINUM tier için progressPercent 100 olmalı", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10000, max: 50000 }),
        (points) => calcTierProgress(points, 'PLATINUM') === 100
      ),
      { numRuns: 100 }
    );
  });

  it("tier başlangıcında progressPercent 0 olmalı", () => {
    expect(calcTierProgress(500, 'BRONZE')).toBe(0);
    expect(calcTierProgress(2000, 'SILVER')).toBe(0);
  });

  it("tier sonunda progressPercent 100 olmalı", () => {
    expect(calcTierProgress(2000, 'BRONZE')).toBe(100);
    expect(calcTierProgress(5000, 'SILVER')).toBe(100);
  });
});
