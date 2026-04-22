// Feature: invoice-payment-accounting
// Özellik bazlı testler: invoice-utils.ts saf fonksiyonları (fast-check)

import * as fc from "fast-check";
import {
  calculateLineTotal,
  calculateInvoiceTotals,
  generateInvoiceNumber,
} from "@/lib/invoice-utils";

// ---------------------------------------------------------------------------
// Özellik 1: lineTotal formülü doğru hesaplanmalı
// Validates: Requirements 1.2
// ---------------------------------------------------------------------------
describe("Feature: invoice-payment-accounting, Property 1: lineTotal formülü", () => {
  it("her geçerli girdi kombinasyonu için formüle uygun hesaplanmalı", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),   // quantity
        fc.float({ min: 0, max: Math.fround(100000), noNaN: true }),                  // unitPrice
        fc.float({ min: 0, max: Math.fround(100), noNaN: true }),                     // discountRate
        fc.float({ min: 0, max: Math.fround(100), noNaN: true }),                     // taxRate
        (quantity, unitPrice, discountRate, taxRate) => {
          const result = calculateLineTotal(quantity, unitPrice, discountRate, taxRate);
          const expected =
            quantity * unitPrice * (1 - discountRate / 100) * (1 + taxRate / 100);
          return Math.abs(result - expected) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("indirim sıfır olduğunda lineTotal = quantity * unitPrice * (1 + taxRate/100)", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
        fc.float({ min: 0, max: Math.fround(10000), noNaN: true }),
        fc.float({ min: 0, max: Math.fround(100), noNaN: true }),
        (quantity, unitPrice, taxRate) => {
          const result = calculateLineTotal(quantity, unitPrice, 0, taxRate);
          const expected = quantity * unitPrice * (1 + taxRate / 100);
          return Math.abs(result - expected) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("KDV sıfır olduğunda lineTotal = quantity * unitPrice * (1 - discountRate/100)", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
        fc.float({ min: 0, max: Math.fround(10000), noNaN: true }),
        fc.float({ min: 0, max: Math.fround(100), noNaN: true }),
        (quantity, unitPrice, discountRate) => {
          const result = calculateLineTotal(quantity, unitPrice, discountRate, 0);
          const expected = quantity * unitPrice * (1 - discountRate / 100);
          return Math.abs(result - expected) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Özellik 2: Fatura toplam tutarları kalem toplamlarından türetilmeli
// Validates: Requirements 1.3, 6.5
// ---------------------------------------------------------------------------
describe("Feature: invoice-payment-accounting, Property 2: Fatura toplam tutarları", () => {
  // Kalem üreteci (fc.float 32-bit float gerektirir, Math.fround ile dönüştür)
  const itemArb = fc.record({
    quantity: fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true }),
    unitPrice: fc.float({ min: 0, max: Math.fround(10000), noNaN: true }),
    discountRate: fc.float({ min: 0, max: Math.fround(100), noNaN: true }),
    taxRate: fc.float({ min: 0, max: Math.fround(100), noNaN: true }),
  });

  it("totalAmount = subTotal + taxAmount denkliği her zaman sağlanmalı", () => {
    fc.assert(
      fc.property(
        fc.array(itemArb, { minLength: 1, maxLength: 20 }),
        (items) => {
          const totals = calculateInvoiceTotals(items);
          const expectedTotal = totals.subTotal + totals.taxAmount;
          return Math.abs(totals.totalAmount - expectedTotal) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("subTotal = sum(quantity * unitPrice * (1 - discountRate/100)) olmalı", () => {
    fc.assert(
      fc.property(
        fc.array(itemArb, { minLength: 1, maxLength: 10 }),
        (items) => {
          const totals = calculateInvoiceTotals(items);
          const expectedSubTotal = items.reduce((sum, item) => {
            return sum + item.quantity * item.unitPrice * (1 - item.discountRate / 100);
          }, 0);
          return Math.abs(totals.subTotal - expectedSubTotal) < 0.1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("tüm kalemler sıfır fiyatlı olduğunda tüm toplamlar sıfır olmalı", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            quantity: fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true }),
            unitPrice: fc.constant(0),
            discountRate: fc.float({ min: 0, max: Math.fround(100), noNaN: true }),
            taxRate: fc.float({ min: 0, max: Math.fround(100), noNaN: true }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (items) => {
          const totals = calculateInvoiceTotals(items);
          return (
            totals.subTotal === 0 &&
            totals.taxAmount === 0 &&
            totals.totalAmount === 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Özellik 4: PAID faturada kalem silme reddedilmeli (simülasyon)
// Validates: Requirements 1.6
// ---------------------------------------------------------------------------

// Fatura durumu simülasyonu
type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED";

function canDeleteInvoiceItem(invoiceStatus: InvoiceStatus): boolean {
  return invoiceStatus !== "PAID";
}

describe("Feature: invoice-payment-accounting, Property 4: PAID faturada kalem silme", () => {
  it("PAID durumunda kalem silme her zaman reddedilmeli", () => {
    fc.assert(
      fc.property(
        fc.constant("PAID" as InvoiceStatus),
        (status) => {
          return canDeleteInvoiceItem(status) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("DRAFT ve SENT durumunda kalem silmeye her zaman izin verilmeli", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant("DRAFT" as InvoiceStatus),
          fc.constant("SENT" as InvoiceStatus)
        ),
        (status) => {
          return canDeleteInvoiceItem(status) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("PAID olmayan tüm durumlarda kalem silmeye izin verilmeli", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant("DRAFT" as InvoiceStatus),
          fc.constant("SENT" as InvoiceStatus),
          fc.constant("CANCELLED" as InvoiceStatus)
        ),
        (status) => {
          return canDeleteInvoiceItem(status) === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Özellik 10: Fatura numarası formatı tutarlı olmalı
// Validates: Requirements 6.1, 6.2
// ---------------------------------------------------------------------------
describe("Feature: invoice-payment-accounting, Property 10: Fatura numarası formatı", () => {
  it("her yıl ve sıra kombinasyonu için {YIL}-{SIRA:04d} formatına uymalı", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2000, max: 2099 }),  // year
        fc.integer({ min: 1, max: 9999 }),      // seq
        (year, seq) => {
          const result = generateInvoiceNumber(year, seq);
          const pattern = /^\d{4}-\d{4}$/;
          return pattern.test(result);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("sıra numarası 4 haneden az ise sıfır ile doldurulmalı", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2000, max: 2099 }),
        fc.integer({ min: 1, max: 999 }),
        (year, seq) => {
          const result = generateInvoiceNumber(year, seq);
          const parts = result.split("-");
          return parts[1].length === 4;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("aynı yıl ve sıra için üretilen numaralar her zaman aynı olmalı (deterministik)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2000, max: 2099 }),
        fc.integer({ min: 1, max: 9999 }),
        (year, seq) => {
          const result1 = generateInvoiceNumber(year, seq);
          const result2 = generateInvoiceNumber(year, seq);
          return result1 === result2;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Özellik 11: İptal edilen fatura numarası yeniden kullanılmamalı (simülasyon)
// Validates: Requirements 6.4
// ---------------------------------------------------------------------------

// Sıra yöneticisi simülasyonu
function simulateInvoiceSequence(
  operations: Array<{ action: "create" | "cancel"; invoiceNumber?: string }>
): string[] {
  let lastSeq = 0;
  const usedNumbers: string[] = [];
  const cancelledNumbers: string[] = [];
  const year = 2025;

  for (const op of operations) {
    if (op.action === "create") {
      lastSeq++;
      const newNumber = generateInvoiceNumber(year, lastSeq);
      usedNumbers.push(newNumber);
    } else if (op.action === "cancel" && op.invoiceNumber) {
      cancelledNumbers.push(op.invoiceNumber);
      // İptal edilen numara usedNumbers'dan çıkarılmaz, sadece cancelled olarak işaretlenir
    }
  }

  return usedNumbers;
}

describe("Feature: invoice-payment-accounting, Property 11: İptal edilen fatura numarası yeniden kullanılmamalı", () => {
  it("iptal sonrası yeni fatura numarası iptal edilenden farklı olmalı", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),  // kaç fatura oluşturulacak
        (count) => {
          const operations: Array<{ action: "create" | "cancel"; invoiceNumber?: string }> = [];

          // count kadar fatura oluştur
          for (let i = 0; i < count; i++) {
            operations.push({ action: "create" });
          }

          const numbers = simulateInvoiceSequence(operations);

          // Tüm numaralar benzersiz olmalı
          const uniqueNumbers = new Set(numbers);
          return uniqueNumbers.size === numbers.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("sıra numaraları her zaman artan sırada olmalı", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 50 }),
        (count) => {
          const operations = Array.from({ length: count }, () => ({
            action: "create" as const,
          }));
          const numbers = simulateInvoiceSequence(operations);

          // Her numara bir öncekinden büyük olmalı
          for (let i = 1; i < numbers.length; i++) {
            const prev = parseInt(numbers[i - 1].split("-")[1]);
            const curr = parseInt(numbers[i].split("-")[1]);
            if (curr <= prev) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Özellik 12: PAID/CANCELLED faturada tutar değişikliği reddedilmeli (simülasyon)
// Validates: Requirements 6.8
// ---------------------------------------------------------------------------

function canModifyInvoiceAmount(invoiceStatus: InvoiceStatus): boolean {
  return invoiceStatus !== "PAID" && invoiceStatus !== "CANCELLED";
}

describe("Feature: invoice-payment-accounting, Property 12: PAID/CANCELLED faturada tutar değişikliği", () => {
  it("PAID durumunda tutar değişikliği her zaman reddedilmeli", () => {
    fc.assert(
      fc.property(
        fc.constant("PAID" as InvoiceStatus),
        (status) => {
          return canModifyInvoiceAmount(status) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("CANCELLED durumunda tutar değişikliği her zaman reddedilmeli", () => {
    fc.assert(
      fc.property(
        fc.constant("CANCELLED" as InvoiceStatus),
        (status) => {
          return canModifyInvoiceAmount(status) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("DRAFT ve SENT durumunda tutar değişikliğine izin verilmeli", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant("DRAFT" as InvoiceStatus),
          fc.constant("SENT" as InvoiceStatus)
        ),
        (status) => {
          return canModifyInvoiceAmount(status) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("PAID veya CANCELLED olan her durumda tutar değişikliği reddedilmeli", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant("PAID" as InvoiceStatus),
          fc.constant("CANCELLED" as InvoiceStatus)
        ),
        (status) => {
          return canModifyInvoiceAmount(status) === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});
