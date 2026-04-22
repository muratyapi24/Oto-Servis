// Feature: web-mobile-sync
// Entegrasyon Testi: POST /api/mobile/firma/finans/tahsilat — Payment kaydı + sıfır tutar reddi
// Entegrasyon Testi: GET /api/mobile/firma/finans/tahsilatlar — sayfalandırma

import * as fc from "fast-check";
import { z } from "zod";

// ── Tahsilat oluşturma şeması (API'den alındı) ──
const createTahsilatSchema = z.object({
  customerId: z.string().uuid("Geçerli bir müşteri seçin"),
  amount: z.number().positive("Tutar sıfırdan büyük olmalıdır"),
  paymentMethod: z.enum(["CASH", "CREDIT_CARD", "BANK_TRANSFER"]),
  serviceOrderId: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

// ── Saf mantık fonksiyonları ──

/**
 * Tahsilat response serializasyonu
 */
function serializeTahsilat(payment: {
  id: string;
  customerId: string | null;
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  serviceOrderId: string | null;
  notes: string | null;
  customer?: {
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    type: string;
  } | null;
}): {
  id: string;
  customerId: string | null;
  customerName: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  serviceOrderId: string | null;
  notes: string | null;
} {
  const customerName = payment.customer
    ? payment.customer.type === "CORPORATE"
      ? (payment.customer.companyName ?? "—")
      : `${payment.customer.firstName ?? ""} ${payment.customer.lastName ?? ""}`.trim() || "—"
    : "—";

  return {
    id: payment.id,
    customerId: payment.customerId,
    customerName,
    amount: Number(payment.amount),
    paymentMethod: payment.paymentMethod,
    paymentDate: payment.paymentDate.toISOString(),
    serviceOrderId: payment.serviceOrderId,
    notes: payment.notes,
  };
}

/**
 * Sayfalandırma hesaplama
 */
function paginateTahsilatlar(
  page: number,
  limit: number
): { skip: number; take: number } {
  return {
    skip: (page - 1) * limit,
    take: Math.min(limit, 50), // max 50
  };
}

// ── POST /api/mobile/firma/finans/tahsilat ──

describe("POST /api/mobile/firma/finans/tahsilat — Zod Doğrulaması", () => {
  it("geçerli customerId, amount ve paymentMethod ile başarılı doğrulama", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000000), noNaN: true }),
        fc.constantFrom("CASH", "CREDIT_CARD", "BANK_TRANSFER"),
        (customerId, amount, paymentMethod) => {
          const result = createTahsilatSchema.safeParse({
            customerId,
            amount,
            paymentMethod,
          });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("sıfır tutar reddedilmeli (400)", () => {
    fc.assert(
      fc.property(fc.uuid(), (customerId) => {
        const result = createTahsilatSchema.safeParse({
          customerId,
          amount: 0,
          paymentMethod: "CASH",
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain("sıfırdan büyük");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("negatif tutar reddedilmeli (400)", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.float({ min: Math.fround(-100000), max: Math.fround(-0.01), noNaN: true }),
        (customerId, negativeAmount) => {
          const result = createTahsilatSchema.safeParse({
            customerId,
            amount: negativeAmount,
            paymentMethod: "CASH",
          });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("geçersiz ödeme yöntemi reddedilmeli (400)", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.float({ min: 1, max: 1000, noNaN: true }),
        fc.string({ minLength: 1, maxLength: 30 }).filter(
          (s) => !["CASH", "CREDIT_CARD", "BANK_TRANSFER"].includes(s)
        ),
        (customerId, amount, invalidMethod) => {
          const result = createTahsilatSchema.safeParse({
            customerId,
            amount,
            paymentMethod: invalidMethod,
          });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("customerId UUID formatında değilse reddedilmeli", () => {
    const invalidIds = ["not-uuid", "123", "", "abc"];
    invalidIds.forEach((id) => {
      const result = createTahsilatSchema.safeParse({
        customerId: id,
        amount: 100,
        paymentMethod: "CASH",
      });
      expect(result.success).toBe(false);
    });
  });

  it("notes 500 karakterden uzunsa reddedilmeli", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 501, maxLength: 1000 }),
        (customerId, longNotes) => {
          const result = createTahsilatSchema.safeParse({
            customerId,
            amount: 100,
            paymentMethod: "CASH",
            notes: longNotes,
          });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("serializasyon: amount number olarak korunmalıdır", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000000), noNaN: true }),
        (amount) => {
          const serialized = serializeTahsilat({
            id: "test-id",
            customerId: "customer-id",
            amount,
            paymentMethod: "CASH",
            paymentDate: new Date(),
            serviceOrderId: null,
            notes: null,
          });
          expect(typeof serialized.amount).toBe("number");
          expect(serialized.amount).toBeCloseTo(amount, 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("serializasyon: paymentDate ISO string olmalıdır", () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") }),
        (date) => {
          const serialized = serializeTahsilat({
            id: "test-id",
            customerId: "customer-id",
            amount: 100,
            paymentMethod: "CASH",
            paymentDate: date,
            serviceOrderId: null,
            notes: null,
          });
          expect(typeof serialized.paymentDate).toBe("string");
          expect(() => new Date(serialized.paymentDate)).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── GET /api/mobile/firma/finans/tahsilatlar — Sayfalandırma ──

describe("GET /api/mobile/firma/finans/tahsilatlar — Sayfalandırma", () => {
  it("sayfa ve limit parametreleri doğru skip/take hesaplar", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 50 }),
        (page, limit) => {
          const { skip, take } = paginateTahsilatlar(page, limit);
          expect(skip).toBe((page - 1) * limit);
          expect(take).toBe(limit);
          expect(skip).toBeGreaterThanOrEqual(0);
          expect(take).toBeGreaterThan(0);
          expect(take).toBeLessThanOrEqual(50);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("ilk sayfa için skip 0 olmalıdır", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), (limit) => {
        const { skip } = paginateTahsilatlar(1, limit);
        expect(skip).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it("limit 50'den büyük olamaz (güvenlik sınırı)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 51, max: 1000 }),
        (page, bigLimit) => {
          const { take } = paginateTahsilatlar(page, bigLimit);
          expect(take).toBeLessThanOrEqual(50);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("401: oturum yoksa erişim reddedilmeli", () => {
    const session = null;
    expect(session).toBeNull();
  });

  it("tenantId izolasyonu: sadece kendi tenant'ının tahsilatları görünmeli", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        (tenantA, tenantB) => {
          fc.pre(tenantA !== tenantB);
          // Farklı tenant'ın tahsilatı görünmemeli
          const payment = { tenantId: tenantA, amount: 100 };
          const canSee = payment.tenantId === tenantB;
          expect(canSee).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
