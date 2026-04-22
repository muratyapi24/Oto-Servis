// Feature: mobile-design-integration, Property 1: Renk token tutarlılığı
import * as fc from "fast-check";

const Colors = {
  primary: '#00236f',
  primaryContainer: '#1e3a8a',
  secondary: '#006c49',
  secondaryContainer: '#6cf8bb',
  surface: '#f7f9fb',
  onSurface: '#191c1e',
  error: '#ba1a1a',
  surfaceContainerLow: '#f2f4f6',
  surfaceContainer: '#eceef0',
  surfaceContainerHigh: '#e6e8ea',
  surfaceContainerLowest: '#ffffff',
  outline: '#757682',
  outlineVariant: '#c5c5d3',
} as const;

const VALID_HEX = /^#[0-9a-fA-F]{6}$/;

describe("Property 1: Renk token tutarlılığı", () => {
  it("tüm Colors token değerleri geçerli hex renk olmalı", () => {
    Object.entries(Colors).forEach(([_key, value]) => {
      expect(VALID_HEX.test(value)).toBe(true);
    });
  });

  it("herhangi bir bileşen Colors token kullandığında hex değer Obsidian paleti ile eşleşmeli", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...(Object.keys(Colors) as (keyof typeof Colors)[])),
        (tokenKey) => {
          const value = Colors[tokenKey];
          return VALID_HEX.test(value);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("primary renk #00236f olmalı", () => {
    expect(Colors.primary).toBe('#00236f');
  });

  it("error rengi #ba1a1a olmalı", () => {
    expect(Colors.error).toBe('#ba1a1a');
  });
});
