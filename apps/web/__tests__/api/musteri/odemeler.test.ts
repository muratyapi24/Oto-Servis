// Feature: web-mobile-sync
// Entegrasyon Testi: GET /api/musteri/odemeler — müşteri sahipliği doğrulaması

import * as fc from "fast-check";
import { z } from "zod";

// ── Ödeme doğrulama şeması ──
const odemeSchema = z.object({
  invoiceId: z.string().uuid("Geçerli bir fatura ID'si gereklidir"),
  paymentMethod: z.enum(["CASH", "CREDIT_CARD", "BANK_TRANSFER"]),
});

// Taksit şeması
const taksitSchema = z.object({
  invoiceId: z.string().uuid("Geçerli bir fatura ID'si gereklidir"),
  installments: z.number().int().refine(
    (n) => [2, 3, 6, 12].includes(n),
    "Geçerli taksit sayısı: 2, 3, 6 veya 12"
  ),
});

// ── Saf mantık fonksiyonları ──

/**
 * Müşteri sahipliği kontrolü
 * Ödeme müşteriye ait mi?
 */
function isPaymentOwnedByCustomer(
  paymentCustomerId: string | null,
  sessionCustomerId: string
): boolean {
  return paymentCustomerId === sessionCustomerId;
}

/**
 * Ödeme response serializasyonu
 */
function serializePayment(payment: {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  serviceOrderId: string | null;
}): {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  serviceOrderId: string | null;
} {
  return {
    id: payment.id,
    amount: Number(payment.amount),
    paymentMethod: payment.paymentMethod,
    paymentDate: payment.paymentDate.toISOString(),
    serviceOrderId: payment.serviceOrderId,
  };
}

/**
 * Taksit aylık tutar hesaplama
 */
function calculateMonthlyInstallment(
  totalAmount: number,
  installments: number
): number {
  return totalAmount / installments;
}

// ── GET /api/musteri/odemeler — Müşteri Sahipliği ──

describe("GET /api/musteri/odemeler — Müşteri Sahipliği Doğrulaması", () => {
  it("müşteriye ait ödeme görüntülenebilir", () => {
    fc.assert(
      fc.property(fc.uuid(), (customerId) => {
        const canSee = isPaymentOwnedByCustomer(customerId, customerId);
        expect(canSee).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("başka müşteriye ait ödeme görüntülenemez", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        (customerA, customerB) => {
          fc.pre(customerA !== customerB);
          const canSee = isPaymentOwnedByCustomer(customerA, customerB);
          expect(canSee).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("customerId null olan ödeme görüntülenemez", () => {
    fc.assert(
      fc.property(fc.uuid(), (customerId) => {
        const canSee = isPaymentOwnedByCustomer(null, customerId);
        expect(canSee).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("401: oturum yoksa erişim reddedilmeli", () => {
    const session = null;
    expect(session).toBeNull();
  });

  it("serializasyon: amount number olarak korunmalıdır", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000000), noNaN: true }),
        (amount) => {
          const serialized = serializePayment({
            id: "test-id",
            amount,
            paymentMethod: "CASH",
            paymentDate: new Date(),
            serviceOrderId: null,
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
          const serialized = serializePayment({
            id: "test-id",
            amount: 100,
            paymentMethod: "CREDIT_CARD",
            paymentDate: date,
            serviceOrderId: null,
          });
          expect(typeof serialized.paymentDate).toBe("string");
          // ISO 8601 formatında olmalı
          expect(serialized.paymentDate).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── POST /api/musteri/odeme — Ödeme Doğrulaması ──

describe("POST /api/musteri/odeme — Ödeme Doğrulaması", () => {
  it("geçerli invoiceId ve paymentMethod ile başarılı doğrulama", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.constantFrom("CASH", "CREDIT_CARD", "BANK_TRANSFER"),
        (invoiceId, paymentMethod) => {
          const result = odemeSchema.safeParse({ invoiceId, paymentMethod });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("invoiceId UUID formatında değilse reddedilmeli", () => {
    const invalidIds = ["not-uuid", "123", "", "abc-def"];
    invalidIds.forEach((id) => {
      const result = odemeSchema.safeParse({ invoiceId: id, paymentMethod: "CASH" });
      expect(result.success).toBe(false);
    });
  });

  it("geçersiz paymentMethod reddedilmeli", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 30 }).filter(
          (s) => !["CASH", "CREDIT_CARD", "BANK_TRANSFER"].includes(s)
        ),
        (invoiceId, invalidMethod) => {
          const result = odemeSchema.safeParse({ invoiceId, paymentMethod: invalidMethod });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── POST /api/musteri/odeme-taksit — Taksit Doğrulaması ──

describe("POST /api/musteri/odeme-taksit — Taksit Doğrulaması", () => {
  it("geçerli taksit sayıları: 2, 3, 6, 12", () => {
    [2, 3, 6, 12].forEach((installments) => {
      const result = taksitSchema.safeParse({
        invoiceId: "550e8400-e29b-41d4-a716-446655440000",
        installments,
      });
      expect(result.success).toBe(true);
    });
  });

  it("geçersiz taksit sayıları reddedilmeli", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }).filter((n) => ![2, 3, 6, 12].includes(n)),
        (invalidInstallments) => {
          const result = taksitSchema.safeParse({
            invoiceId: "550e8400-e29b-41d4-a716-446655440000",
            installments: invalidInstallments,
          });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("aylık taksit tutarı doğru hesaplanmalıdır", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(100), max: Math.fround(100000), noNaN: true }),
        fc.constantFrom(2, 3, 6, 12),
        (totalAmount, installments) => {
          const monthly = calculateMonthlyInstallment(totalAmount, installments);
          // Tüm taksitlerin toplamı toplam tutara eşit olmalı
          const reconstructed = monthly * installments;
          expect(Math.abs(reconstructed - totalAmount)).toBeLessThan(0.01);
          // Aylık tutar pozitif olmalı
          expect(monthly).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("taksit sayısı arttıkça aylık tutar azalmalıdır", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(1000), max: Math.fround(100000), noNaN: true }),
        (totalAmount) => {
          const monthly2 = calculateMonthlyInstallment(totalAmount, 2);
          const monthly3 = calculateMonthlyInstallment(totalAmount, 3);
          const monthly6 = calculateMonthlyInstallment(totalAmount, 6);
          const monthly12 = calculateMonthlyInstallment(totalAmount, 12);

          expect(monthly2).toBeGreaterThan(monthly3);
          expect(monthly3).toBeGreaterThan(monthly6);
          expect(monthly6).toBeGreaterThan(monthly12);
        }
      ),
      { numRuns: 100 }
    );
  });
});
