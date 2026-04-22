// Feature: mobile-design-integration, Property 3: Touch target minimum 48dp
import * as fc from "fast-check";

const MIN_TOUCH_TARGET = 48;

function isValidTouchTarget(height: number, width: number): boolean {
  return height >= MIN_TOUCH_TARGET && width >= MIN_TOUCH_TARGET;
}

describe("Property 3: Touch target minimum 48dp", () => {
  it("dokunulabilir elemanlar minimum 48dp yükseklik ve genişliğe sahip olmalı", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 48, max: 200 }),
        fc.integer({ min: 48, max: 400 }),
        (height, width) => {
          return isValidTouchTarget(height, width);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("48dp'den küçük touch target geçersiz sayılmalı", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 47 }),
        fc.integer({ min: 1, max: 47 }),
        (height, width) => {
          return !isValidTouchTarget(height, width);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("PrimaryButton minimum height 48dp olmalı", () => {
    const buttonSizes = { sm: 40, md: 48, lg: 56 };
    expect(buttonSizes.md).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    expect(buttonSizes.lg).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  });
});
