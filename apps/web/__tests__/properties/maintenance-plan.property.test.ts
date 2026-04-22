// Feature: web-mobile-sync
// Property 5: Gecikmiş bakım planı tespiti
// Property 6: MaintenancePlan Zod doğrulaması

import * as fc from "fast-check";
import {
  createMaintenancePlanSchema,
  updateMaintenancePlanSchema,
} from "@/lib/validations/maintenance-plan";

// ── Üretim kodundan alınan saf fonksiyon ──

/**
 * Bakım planının gecikmiş olup olmadığını hesaplar.
 * Gecikmiş = tamamlanmamış VE dueDate geçmişte
 */
function isOverdue(dueDate: Date | null, isCompleted: boolean): boolean {
  if (isCompleted) return false;
  if (dueDate == null) return false;
  return dueDate < new Date();
}

// ── Property 5: isOverdue fonksiyonu ──
describe("Feature: web-mobile-sync, Property 5: Gecikmiş bakım planı tespiti", () => {
  it("geçmiş tarih + isCompleted:false için her zaman true döndürür", () => {
    fc.assert(
      fc.property(
        // Geçmiş tarih: 1 gün ile 10 yıl önce
        fc.integer({ min: 1, max: 3650 }).map(
          (daysAgo) => new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
        ),
        (pastDate) => {
          expect(isOverdue(pastDate, false)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("tamamlanmış plan için her zaman false döndürür (tarihten bağımsız)", () => {
    fc.assert(
      fc.property(
        // Geçmiş tarih
        fc.integer({ min: 1, max: 3650 }).map(
          (daysAgo) => new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
        ),
        (pastDate) => {
          expect(isOverdue(pastDate, true)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("gelecek tarih + isCompleted:false için false döndürür", () => {
    fc.assert(
      fc.property(
        // Gelecek tarih: 1 gün ile 10 yıl sonra
        fc.integer({ min: 1, max: 3650 }).map(
          (daysAhead) => new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)
        ),
        (futureDate) => {
          expect(isOverdue(futureDate, false)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("dueDate null olduğunda her zaman false döndürür", () => {
    expect(isOverdue(null, false)).toBe(false);
    expect(isOverdue(null, true)).toBe(false);
  });

  it("isCompleted:true olduğunda dueDate ne olursa olsun false döndürür", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.integer({ min: -3650, max: 3650 }).map(
            (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000)
          )
        ),
        (date) => {
          expect(isOverdue(date, true)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 6: createMaintenancePlanSchema Zod doğrulaması ──
describe("Feature: web-mobile-sync, Property 6: MaintenancePlan Zod doğrulaması", () => {
  // Geçerli UUID üreteci
  const uuidArb = fc.uuid();

  it("geçerli vehicleId ve title ile başarılı doğrulama yapar", () => {
    fc.assert(
      fc.property(
        uuidArb,
        fc.string({ minLength: 1, maxLength: 255 }),
        (vehicleId, title) => {
          const result = createMaintenancePlanSchema.safeParse({ vehicleId, title });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("vehicleId eksik olduğunda doğrulama başarısız olur", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (title) => {
          const result = createMaintenancePlanSchema.safeParse({ title });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("vehicleId UUID formatında değilse doğrulama başarısız olur", () => {
    fc.assert(
      fc.property(
        // UUID olmayan string'ler
        fc.string({ minLength: 1, maxLength: 50 }).filter(
          (s) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
        ),
        fc.string({ minLength: 1, maxLength: 100 }),
        (invalidId, title) => {
          const result = createMaintenancePlanSchema.safeParse({
            vehicleId: invalidId,
            title,
          });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("title boş string olduğunda doğrulama başarısız olur", () => {
    fc.assert(
      fc.property(uuidArb, (vehicleId) => {
        const result = createMaintenancePlanSchema.safeParse({
          vehicleId,
          title: "",
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("negatif dueMileage doğrulama başarısız olur", () => {
    fc.assert(
      fc.property(
        uuidArb,
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.integer({ min: -10000, max: -1 }),
        (vehicleId, title, negativeMileage) => {
          const result = createMaintenancePlanSchema.safeParse({
            vehicleId,
            title,
            dueMileage: negativeMileage,
          });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("pozitif dueMileage ile başarılı doğrulama yapar", () => {
    fc.assert(
      fc.property(
        uuidArb,
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.integer({ min: 1, max: 1000000 }),
        (vehicleId, title, mileage) => {
          const result = createMaintenancePlanSchema.safeParse({
            vehicleId,
            title,
            dueMileage: mileage,
          });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("updateMaintenancePlanSchema: isCompleted boolean kabul eder", () => {
    fc.assert(
      fc.property(fc.boolean(), (isCompleted) => {
        const result = updateMaintenancePlanSchema.safeParse({ isCompleted });
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("updateMaintenancePlanSchema: tüm alanlar opsiyonel — boş obje geçerlidir", () => {
    const result = updateMaintenancePlanSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
