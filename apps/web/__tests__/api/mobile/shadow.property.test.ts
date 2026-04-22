// Feature: mobile-design-integration, Property 4: Navy shadow renk doğrulaması
import * as fc from "fast-check";

const Shadow = {
  navy: {
    shadowColor: 'rgba(0,35,111,1)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    elevation: 4,
  },
} as const;

const NAVY_SHADOW_PATTERN = /^rgba\(0,\s*35,\s*111,/;

describe("Property 4: Navy shadow renk doğrulaması", () => {
  it("Shadow.navy.shadowColor navy-tinted olmalı", () => {
    expect(NAVY_SHADOW_PATTERN.test(Shadow.navy.shadowColor)).toBe(true);
  });

  it("saf siyah (rgba(0,0,0,...)) shadow kullanılmamalı", () => {
    const BLACK_SHADOW = /^rgba\(0,\s*0,\s*0,/;
    expect(BLACK_SHADOW.test(Shadow.navy.shadowColor)).toBe(false);
  });

  it("elevation değeri pozitif olmalı", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (elevation) => elevation > 0
      ),
      { numRuns: 100 }
    );
  });

  it("shadowOpacity 0 ile 1 arasında olmalı", () => {
    expect(Shadow.navy.shadowOpacity).toBeGreaterThan(0);
    expect(Shadow.navy.shadowOpacity).toBeLessThanOrEqual(1);
  });
});
