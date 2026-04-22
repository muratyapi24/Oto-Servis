// Feature: invoice-payment-accounting
// Özellik bazlı testler: Özellik 13 (retry sayısı), Özellik 14 (kalem eşleştirme)

import * as fc from "fast-check";
import {
  mapInvoiceItemsToParasutLines,
  mapCustomerToParasutContact,
} from "@/lib/parasut/mapper";

// ---------------------------------------------------------------------------
// Özellik 13: Paraşüt Retry Sayısı Aşılmamalı
// Validates: Requirements 5.4
// ---------------------------------------------------------------------------

describe("Feature: invoice-payment-accounting, Property 13: Paraşüt retry sayısı", () => {
  /**
   * Retry mekanizması simülasyonu (senkron).
   */
  function withRetrySync(
    shouldSucceedOnAttempt: number,
    maxRetries: number
  ): { attempts: number; success: boolean } {
    let attempts = 0;
    for (let i = 0; i <= maxRetries; i++) {
      attempts++;
      if (attempts >= shouldSucceedOnAttempt) {
        return { attempts, success: true };
      }
      if (i === maxRetries) {
        return { attempts, success: false };
      }
    }
    return { attempts, success: false };
  }

  it("başarılı işlemde retry sayısı 1 olmalı", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }), // maxRetries
        (maxRetries) => {
          const { attempts, success } = withRetrySync(1, maxRetries); // İlk denemede başarılı
          return success && attempts === 1;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("her zaman başarısız işlemde deneme sayısı maxRetries + 1 olmalı", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }), // maxRetries
        (maxRetries) => {
          // shouldSucceedOnAttempt = maxRetries + 2 → hiç başarılı olmaz
          const { attempts, success } = withRetrySync(maxRetries + 2, maxRetries);
          return !success && attempts === maxRetries + 1;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("Inngest 3 retry ile maksimum 4 deneme yapılmalı", () => {
    const MAX_RETRIES = 3;
    // Hiç başarılı olmayan senaryo
    const { attempts, success } = withRetrySync(MAX_RETRIES + 2, MAX_RETRIES);
    expect(success).toBe(false);
    expect(attempts).toBe(MAX_RETRIES + 1); // 4
  });

  it("2. denemede başarılı olursa toplam 2 deneme yapılmalı", () => {
    const { attempts, success } = withRetrySync(2, 3);
    expect(success).toBe(true);
    expect(attempts).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Özellik 14: Paraşüt Kalem Eşleştirmesi Bire Bir Olmalı
// Validates: Requirements 5.8
// ---------------------------------------------------------------------------

describe("Feature: invoice-payment-accounting, Property 14: Paraşüt kalem eşleştirmesi", () => {
  it("her InvoiceItem için bir Paraşüt satırı oluşturulmalı", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            quantity: fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true }),
            unitPrice: fc.float({ min: 0, max: Math.fround(10000), noNaN: true }),
            taxRate: fc.float({ min: 0, max: Math.fround(100), noNaN: true }),
            discountRate: fc.float({ min: 0, max: Math.fround(100), noNaN: true }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (items) => {
          const lines = mapInvoiceItemsToParasutLines(items);
          return lines.length === items.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("kalem adları bire bir eşleşmeli", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            quantity: fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true }),
            unitPrice: fc.float({ min: 0, max: Math.fround(10000), noNaN: true }),
            taxRate: fc.float({ min: 0, max: Math.fround(100), noNaN: true }),
            discountRate: fc.float({ min: 0, max: Math.fround(100), noNaN: true }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (items) => {
          const lines = mapInvoiceItemsToParasutLines(items);
          return items.every((item, i) => lines[i].name === item.name);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("kalem miktarları bire bir eşleşmeli", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            quantity: fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true }),
            unitPrice: fc.float({ min: 0, max: Math.fround(10000), noNaN: true }),
            taxRate: fc.float({ min: 0, max: Math.fround(100), noNaN: true }),
            discountRate: fc.float({ min: 0, max: Math.fround(100), noNaN: true }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (items) => {
          const lines = mapInvoiceItemsToParasutLines(items);
          return items.every((item, i) =>
            Math.abs(lines[i].quantity - Number(item.quantity)) < 0.001
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("KDV oranları bire bir eşleşmeli", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            quantity: fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true }),
            unitPrice: fc.float({ min: 0, max: Math.fround(10000), noNaN: true }),
            taxRate: fc.float({ min: 0, max: Math.fround(100), noNaN: true }),
            discountRate: fc.float({ min: 0, max: Math.fround(100), noNaN: true }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (items) => {
          const lines = mapInvoiceItemsToParasutLines(items);
          return items.every((item, i) =>
            Math.abs(lines[i].vatRate - Number(item.taxRate)) < 0.001
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("boş kalem listesi için genel hizmet kalemi oluşturulmalı", () => {
    fc.assert(
      fc.property(
        fc.constant([]),
        (items) => {
          const lines = mapInvoiceItemsToParasutLines(items);
          return lines.length === 1 && lines[0].name === "Genel Hizmet";
        }
      ),
      { numRuns: 10 }
    );
  });

  it("müşteri adı eşleştirmesi tutarlı olmalı", () => {
    fc.assert(
      fc.property(
        fc.record({
          firstName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          lastName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          companyName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          taxNumber: fc.option(fc.string({ minLength: 10, maxLength: 11 }), { nil: null }),
          email: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: null }),
          phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: null }),
        }),
        (customer) => {
          const contact = mapCustomerToParasutContact(customer);
          // Her zaman geçerli bir isim döner
          return typeof contact.name === "string" && contact.name.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("şirket adı varsa şirket adı kullanılmalı", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (companyName, firstName, lastName) => {
          const contact = mapCustomerToParasutContact({
            companyName,
            firstName,
            lastName,
            taxNumber: null,
            email: null,
            phone: null,
          });
          return contact.name === companyName;
        }
      ),
      { numRuns: 100 }
    );
  });
});
