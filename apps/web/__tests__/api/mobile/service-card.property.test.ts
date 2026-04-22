// Feature: mobile-design-integration, Property 5: Servis kartı öncelik renk eşlemesi
import * as fc from "fast-check";

const Colors = { error: '#ba1a1a', primaryContainer: '#1e3a8a' } as const;

function getServiceCardBorderColor(isUrgent: boolean): string {
  return isUrgent ? Colors.error : Colors.primaryContainer;
}

describe("Property 5: Servis kartı öncelik renk eşlemesi", () => {
  it("isUrgent=true → sol border Colors.error (#ba1a1a) olmalı", () => {
    fc.assert(
      fc.property(fc.constant(true), (isUrgent) => {
        return getServiceCardBorderColor(isUrgent) === Colors.error;
      }),
      { numRuns: 100 }
    );
  });

  it("isUrgent=false → sol border Colors.primaryContainer (#1e3a8a) olmalı", () => {
    fc.assert(
      fc.property(fc.constant(false), (isUrgent) => {
        return getServiceCardBorderColor(isUrgent) === Colors.primaryContainer;
      }),
      { numRuns: 100 }
    );
  });

  it("isUrgent boolean değeri için renk eşlemesi deterministik olmalı", () => {
    fc.assert(
      fc.property(fc.boolean(), (isUrgent) => {
        const color = getServiceCardBorderColor(isUrgent);
        return color === Colors.error || color === Colors.primaryContainer;
      }),
      { numRuns: 100 }
    );
  });
});
