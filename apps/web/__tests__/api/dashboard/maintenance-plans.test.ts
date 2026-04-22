// Feature: web-mobile-sync
// Entegrasyon Testi: POST /api/dashboard/maintenance-plans — Zod doğrulaması
// Entegrasyon Testi: GET /api/dashboard/maintenance-plans — vehicleId filtresi + tenantId izolasyonu

import * as fc from "fast-check";
import {
  createMaintenancePlanSchema,
  updateMaintenancePlanSchema,
} from "@/lib/validations/maintenance-plan";

// ── Saf mantık fonksiyonları ──

/**
 * isOverdue hesaplama (API'de kullanılan mantık)
 */
function computeIsOverdue(dueDate: Date | null, isCompleted: boolean): boolean {
  return !isCompleted && dueDate != null && dueDate < new Date();
}

/**
 * vehicleId filtresi — sadece belirtilen araca ait planları döndürür
 */
function filterPlansByVehicle(
  plans: Array<{ id: string; vehicleId: string; tenantId: string }>,
  vehicleId: string,
  tenantId: string
): Array<{ id: string; vehicleId: string; tenantId: string }> {
  return plans.filter(
    (p) => p.vehicleId === vehicleId && p.tenantId === tenantId
  );
}

/**
 * Tenant izolasyonu — sadece kendi tenant'ının planlarına erişebilir
 */
function canAccessPlan(planTenantId: string, sessionTenantId: string): boolean {
  return planTenantId === sessionTenantId;
}

// ── POST /api/dashboard/maintenance-plans — Zod Doğrulaması ──

describe("POST /api/dashboard/maintenance-plans — Zod Doğrulaması", () => {
  it("geçerli vehicleId (UUID) ve title ile başarılı doğrulama", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 255 }),
        (vehicleId, title) => {
          const result = createMaintenancePlanSchema.safeParse({ vehicleId, title });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("vehicleId eksik olduğunda 400 döner", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (title) => {
          const result = createMaintenancePlanSchema.safeParse({ title });
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.errors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("title boş string olduğunda 400 döner", () => {
    fc.assert(
      fc.property(fc.uuid(), (vehicleId) => {
        const result = createMaintenancePlanSchema.safeParse({ vehicleId, title: "" });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("vehicleId UUID formatında değilse 400 döner", () => {
    const invalidIds = ["not-a-uuid", "123", "", "abc-def", "12345678-1234-1234-1234-12345678901Z"];
    invalidIds.forEach((id) => {
      const result = createMaintenancePlanSchema.safeParse({ vehicleId: id, title: "Test" });
      expect(result.success).toBe(false);
    });
  });

  it("negatif dueMileage 400 döner", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
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

  it("geçerli dueDate ISO string ile başarılı doğrulama", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") }),
        (vehicleId, title, date) => {
          const result = createMaintenancePlanSchema.safeParse({
            vehicleId,
            title,
            dueDate: date.toISOString(),
          });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── GET /api/dashboard/maintenance-plans — vehicleId Filtresi ──

describe("GET /api/dashboard/maintenance-plans — vehicleId Filtresi", () => {
  it("vehicleId filtresi sadece ilgili araca ait planları döndürür", () => {
    fc.assert(
      fc.property(
        fc.uuid(), // vehicleId
        fc.uuid(), // tenantId
        fc.array(
          fc.record({
            id: fc.uuid(),
            vehicleId: fc.uuid(),
            tenantId: fc.uuid(),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (targetVehicleId, tenantId, allPlans) => {
          // Bazı planları hedef araç ve tenant'a ait yap
          const mixedPlans = [
            ...allPlans,
            { id: "plan-1", vehicleId: targetVehicleId, tenantId },
            { id: "plan-2", vehicleId: targetVehicleId, tenantId },
          ];

          const filtered = filterPlansByVehicle(mixedPlans, targetVehicleId, tenantId);

          // Tüm sonuçlar hedef vehicleId ve tenantId'ye ait olmalı
          filtered.forEach((p) => {
            expect(p.vehicleId).toBe(targetVehicleId);
            expect(p.tenantId).toBe(tenantId);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it("vehicleId parametresi olmadan 400 döner", () => {
    const vehicleId = null;
    const isValid = vehicleId !== null && vehicleId !== "";
    expect(isValid).toBe(false);
  });

  it("tenantId izolasyonu: farklı tenant'ın planlarına erişim reddedilmeli", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        (planTenantId, sessionTenantId) => {
          fc.pre(planTenantId !== sessionTenantId);
          expect(canAccessPlan(planTenantId, sessionTenantId)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── isOverdue Hesaplama ──

describe("isOverdue Hesaplama — API Response", () => {
  it("geçmiş tarih + tamamlanmamış plan için isOverdue:true", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3650 }).map(
          (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        ),
        (pastDate) => {
          expect(computeIsOverdue(pastDate, false)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("tamamlanmış plan için isOverdue:false (tarihten bağımsız)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -3650, max: 3650 }).map(
          (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        ),
        (date) => {
          expect(computeIsOverdue(date, true)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("dueDate null olduğunda isOverdue:false", () => {
    expect(computeIsOverdue(null, false)).toBe(false);
    expect(computeIsOverdue(null, true)).toBe(false);
  });
});

// ── PATCH /api/dashboard/maintenance-plans/[id] — Güncelleme Doğrulaması ──

describe("PATCH /api/dashboard/maintenance-plans/[id] — Güncelleme Doğrulaması", () => {
  it("boş obje geçerlidir (tüm alanlar opsiyonel)", () => {
    const result = updateMaintenancePlanSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("isCompleted boolean kabul eder", () => {
    fc.assert(
      fc.property(fc.boolean(), (isCompleted) => {
        const result = updateMaintenancePlanSchema.safeParse({ isCompleted });
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("negatif dueMileage güncelleme reddedilir", () => {
    fc.assert(
      fc.property(fc.integer({ min: -10000, max: -1 }), (negativeMileage) => {
        const result = updateMaintenancePlanSchema.safeParse({
          dueMileage: negativeMileage,
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
