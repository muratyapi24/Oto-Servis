// Feature: invoice-payment-accounting
// Özellik bazlı testler: Ödeme sonrası fatura durumu ve çek/senet vade eşiği

import * as fc from "fast-check";

// ---------------------------------------------------------------------------
// Yardımcı simülasyon fonksiyonları
// ---------------------------------------------------------------------------

type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED";

interface PaymentSimResult {
  newPaidAmount: number;
  newStatus: InvoiceStatus;
}

/**
 * Ödeme sonrası fatura durumunu simüle eder.
 * paidAmount >= totalAmount ise PAID, aksi halde mevcut durum korunur.
 */
function simulatePayment(
  currentPaidAmount: number,
  totalAmount: number,
  paymentAmount: number,
  currentStatus: InvoiceStatus
): PaymentSimResult {
  const newPaidAmount = currentPaidAmount + paymentAmount;
  const newStatus: InvoiceStatus =
    newPaidAmount >= totalAmount ? "PAID" : currentStatus;
  return { newPaidAmount, newStatus };
}

/**
 * Çek/senet vade bildirim eşiğini kontrol eder.
 * Vadesi daysThreshold gün veya daha az kalan çek/senetler için true döner.
 */
function isCheckPaymentDueSoon(
  dueDate: Date,
  today: Date,
  daysThreshold: number
): boolean {
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / msPerDay);
  return daysLeft >= 0 && daysLeft <= daysThreshold;
}

// ---------------------------------------------------------------------------
// Property 7: Ödeme sonrası fatura durumu doğru güncellenmeli
// Validates: Requirements 3.3, 6.6
// ---------------------------------------------------------------------------

describe("Feature: invoice-payment-accounting, Property 7: Ödeme sonrası fatura durumu", () => {
  it("paidAmount >= totalAmount olduğunda durum PAID olmalı", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(100), max: Math.fround(50000), noNaN: true }),  // totalAmount
        fc.constantFrom("SENT" as InvoiceStatus),
        (totalAmount, currentStatus) => {
          // Tam ödeme
          const result = simulatePayment(0, totalAmount, totalAmount, currentStatus);
          return result.newStatus === "PAID" && result.newPaidAmount === totalAmount;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("paidAmount < totalAmount olduğunda durum değişmemeli", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(100), max: Math.fround(50000), noNaN: true }),  // totalAmount
        fc.float({ min: Math.fround(0.01), max: Math.fround(0.99), noNaN: true }),  // paymentRatio (< 1)
        fc.constantFrom("SENT" as InvoiceStatus),
        (totalAmount, paymentRatio, currentStatus) => {
          const paymentAmount = totalAmount * paymentRatio;
          const result = simulatePayment(0, totalAmount, paymentAmount, currentStatus);
          return result.newStatus === currentStatus && result.newPaidAmount < totalAmount;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("newPaidAmount = currentPaidAmount + paymentAmount her zaman doğru olmalı", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: Math.fround(10000), noNaN: true }),   // currentPaidAmount
        fc.float({ min: Math.fround(100), max: Math.fround(50000), noNaN: true }),  // totalAmount
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),  // paymentAmount
        fc.constantFrom("SENT" as InvoiceStatus),
        (currentPaidAmount, totalAmount, paymentAmount, currentStatus) => {
          const result = simulatePayment(
            currentPaidAmount,
            totalAmount,
            paymentAmount,
            currentStatus
          );
          return (
            Math.abs(result.newPaidAmount - (currentPaidAmount + paymentAmount)) < 0.001
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("fazla ödeme durumunda da PAID olmalı (paidAmount > totalAmount)", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(100), max: Math.fround(10000), noNaN: true }),  // totalAmount
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),  // extraAmount
        fc.constantFrom("SENT" as InvoiceStatus),
        (totalAmount, extraAmount, currentStatus) => {
          const result = simulatePayment(0, totalAmount, totalAmount + extraAmount, currentStatus);
          return result.newStatus === "PAID";
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: Çek/senet vade bildirim eşiği doğru hesaplanmalı
// Validates: Requirements 3.6
// ---------------------------------------------------------------------------

describe("Feature: invoice-payment-accounting, Property 9: Çek/senet vade bildirim eşiği", () => {
  const today = new Date("2025-01-15T09:00:00.000Z");
  const THRESHOLD = 3; // 3 gün

  it("vadesi 3 gün veya daha az kalan çek/senetler için true döner", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 3 }),  // daysLeft (0-3)
        (daysLeft) => {
          const dueDate = new Date(today);
          dueDate.setDate(dueDate.getDate() + daysLeft);
          return isCheckPaymentDueSoon(dueDate, today, THRESHOLD) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("vadesi 4 gün veya daha fazla kalan çek/senetler için false döner", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 4, max: 365 }),  // daysLeft (4+)
        (daysLeft) => {
          const dueDate = new Date(today);
          dueDate.setDate(dueDate.getDate() + daysLeft);
          return isCheckPaymentDueSoon(dueDate, today, THRESHOLD) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("vadesi geçmiş çek/senetler için false döner", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 365 }),  // daysAgo
        (daysAgo) => {
          const dueDate = new Date(today);
          dueDate.setDate(dueDate.getDate() - daysAgo);
          return isCheckPaymentDueSoon(dueDate, today, THRESHOLD) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("tam eşik günü (3 gün) için true döner", () => {
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 3);
    expect(isCheckPaymentDueSoon(dueDate, today, THRESHOLD)).toBe(true);
  });

  it("eşiğin bir gün üstü (4 gün) için false döner", () => {
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 4);
    expect(isCheckPaymentDueSoon(dueDate, today, THRESHOLD)).toBe(false);
  });

  it("bugün vadesi dolan çek/senet için true döner", () => {
    expect(isCheckPaymentDueSoon(today, today, THRESHOLD)).toBe(true);
  });
});
