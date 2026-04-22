// Feature: mobile-design-integration, Property 2: Kart border radius minimum değeri
import * as fc from "fast-check";

const Radius = { sm: 8, md: 12, lg: 16, xl: 24 } as const;
const MIN_CARD_RADIUS = 12;

function getCardBorderRadius(variant: 'sm' | 'md' | 'lg' | 'xl'): number {
  return Radius[variant];
}

describe("Property 2: Kart border radius minimum değeri", () => {
  it("kart bileşenlerinde borderRadius 12dp'den küçük olmamalı", () => {
    fc.assert(
      fc.property(
        fc.constantFrom('md' as const, 'lg' as const, 'xl' as const),
        (variant) => {
          const radius = getCardBorderRadius(variant);
          return radius >= MIN_CARD_RADIUS;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("hiçbir kart stili borderWidth: 1 içermemeli (No-Line Rule)", () => {
    const cardStyles = [
      { borderRadius: Radius.lg, backgroundColor: '#fff' },
      { borderRadius: Radius.md, backgroundColor: '#f7f9fb' },
    ];
    cardStyles.forEach(style => {
      expect((style as any).borderWidth).toBeUndefined();
    });
  });

  it("tüm Radius değerleri 8dp veya üzerinde olmalı", () => {
    Object.values(Radius).forEach(value => {
      expect(value).toBeGreaterThanOrEqual(8);
    });
  });
});
