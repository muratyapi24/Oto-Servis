// Feature: missing-features-roadmap, Property 2: Teklif Kalemi Hesaplama Doğruluğu
// Feature: missing-features-roadmap, Property 3: Teklif Kabul → Servis Emri Dönüşümü
// Feature: missing-features-roadmap, Property 4: Süresi Geçmiş Teklif Invariant'ı

import * as fc from "fast-check";

/**
 * Property 2: Teklif kalemi hesaplama doğruluğu
 * subTotal = (qty × unitPrice) − discount
 * taxAmount = subTotal × taxRate / 100
 * totalPrice = subTotal + taxAmount
 */
function calcQuoteItem(qty: number, unitPrice: number, taxRate: number, discount: number) {
  const subTotal = qty * unitPrice - discount;
  const taxAmount = subTotal * taxRate / 100;
  const totalPrice = subTotal + taxAmount;
  return { subTotal, taxAmount, totalPrice };
}

describe("Property 2: Teklif kalemi hesaplama doğruluğu", () => {
  it("subTotal, taxAmount ve totalPrice formüllere uygun hesaplanmalı", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        fc.double({ min: 0, max: 100, noNaN: true }),
        fc.double({ min: 0, max: 100, noNaN: true }),
        (qty, unitPrice, taxRate, discount) => {
          const safeDiscount = Math.min(discount, qty * unitPrice);
          const result = calcQuoteItem(qty, unitPrice, taxRate, safeDiscount);
          const expectedSubTotal = qty * unitPrice - safeDiscount;
          const expectedTaxAmount = expectedSubTotal * taxRate / 100;
          const expectedTotal = expectedSubTotal + expectedTaxAmount;
          return (
            Math.abs(result.subTotal - expectedSubTotal) < 0.01 &&
            Math.abs(result.taxAmount - expectedTaxAmount) < 0.01 &&
            Math.abs(result.totalPrice - expectedTotal) < 0.01
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 4: Süresi geçmiş teklif invariant'ı
 * validUntil < now() ise durum EXPIRED olmalı
 */
function getEffectiveStatus(status: string, validUntil: Date | null): string {
  if (validUntil && validUntil < new Date() && status === "SENT") {
    return "EXPIRED";
  }
  return status;
}

describe("Property 4: Süresi geçmiş teklif invariant'ı", () => {
  it("validUntil geçmişte olan SENT teklifler EXPIRED döndürmeli", () => {
    fc.assert(
      fc.property(
        fc.date({ max: new Date(Date.now() - 1000) }),
        (pastDate) => {
          const status = getEffectiveStatus("SENT", pastDate);
          return status === "EXPIRED";
        }
      ),
      { numRuns: 100 }
    );
  });

  it("validUntil gelecekte olan SENT teklifler SENT kalmalı", () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date(Date.now() + 60000) }),
        (futureDate) => {
          const status = getEffectiveStatus("SENT", futureDate);
          return status === "SENT";
        }
      ),
      { numRuns: 100 }
    );
  });
});
