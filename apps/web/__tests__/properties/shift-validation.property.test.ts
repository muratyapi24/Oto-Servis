// Feature: web-mobile-sync
// Property 1: Vardiya saati format dönüşümü
// Property 2: Geçersiz vardiya formatı reddi

import * as fc from "fast-check";
import { shiftUpdateSchema } from "@/lib/validations/mechanics";

// ── Yardımcı fonksiyon (MechanicDetailClient'tan alındı) ──
function formatShiftTime(start: string | null, end: string | null): string {
  if (!start && !end) return "Tanımlanmamış";
  if (start && end) return `${start} – ${end}`;
  return start ?? end ?? "Tanımlanmamış";
}

// Geçerli HH:MM string üreteci
const validTimeArb = fc.tuple(
  fc.integer({ min: 0, max: 23 }),
  fc.integer({ min: 0, max: 59 })
).map(([h, m]) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);

// ── Property 1: formatShiftTime ──
describe("Feature: web-mobile-sync, Property 1: Vardiya saati format dönüşümü", () => {
  it("geçerli start ve end verildiğinde 'HH:MM – HH:MM' formatında döndürür", () => {
    fc.assert(
      fc.property(validTimeArb, validTimeArb, (start, end) => {
        const result = formatShiftTime(start, end);
        // "HH:MM – HH:MM" pattern'ine uymalı
        expect(result).toMatch(/^\d{2}:\d{2} – \d{2}:\d{2}$/);
        expect(result).toBe(`${start} – ${end}`);
      }),
      { numRuns: 100 }
    );
  });

  it("her iki değer null olduğunda 'Tanımlanmamış' döndürür", () => {
    const result = formatShiftTime(null, null);
    expect(result).toBe("Tanımlanmamış");
  });

  it("sadece start verildiğinde start değerini döndürür", () => {
    fc.assert(
      fc.property(validTimeArb, (start) => {
        const result = formatShiftTime(start, null);
        expect(result).toBe(start);
      }),
      { numRuns: 100 }
    );
  });

  it("sadece end verildiğinde end değerini döndürür", () => {
    fc.assert(
      fc.property(validTimeArb, (end) => {
        const result = formatShiftTime(null, end);
        expect(result).toBe(end);
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 2: shiftUpdateSchema geçersiz formatları reddeder ──
describe("Feature: web-mobile-sync, Property 2: Geçersiz vardiya formatı reddi", () => {
  it("geçerli HH:MM formatındaki string'leri kabul eder", () => {
    fc.assert(
      fc.property(validTimeArb, (time) => {
        const result = shiftUpdateSchema.safeParse({ shiftStart: time });
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("saat 24+ olan string'leri reddeder", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 24, max: 99 }),
        fc.integer({ min: 0, max: 59 }),
        (h, m) => {
          const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          const result = shiftUpdateSchema.safeParse({ shiftStart: time });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("dakika 60+ olan string'leri reddeder", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 23 }),
        fc.integer({ min: 60, max: 99 }),
        (h, m) => {
          const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          const result = shiftUpdateSchema.safeParse({ shiftStart: time });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("HH:MM formatına uymayan rastgele string'leri reddeder", () => {
    // Sayı içermeyen veya yanlış uzunluktaki string'ler
    const invalidStrings = [
      "8:00",      // tek haneli saat
      "08:0",      // tek haneli dakika
      "8:0",       // her ikisi tek haneli
      "25:00",     // geçersiz saat
      "12:60",     // geçersiz dakika
      "ab:cd",     // harf
      "12-30",     // yanlış ayraç
      "1200",      // ayraç yok
      "",          // boş
      "12:00:00",  // saniye dahil
    ];

    invalidStrings.forEach((s) => {
      const result = shiftUpdateSchema.safeParse({ shiftStart: s });
      expect(result.success).toBe(false);
    });
  });

  it("null değerini kabul eder (opsiyonel alan)", () => {
    const result = shiftUpdateSchema.safeParse({ shiftStart: null });
    expect(result.success).toBe(true);
  });

  it("undefined değerini kabul eder (opsiyonel alan)", () => {
    const result = shiftUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
