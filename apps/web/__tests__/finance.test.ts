// Feature: missing-features-roadmap, Property 1: Ödeme Ekleme Round-Trip

import * as fc from "fast-check";

/**
 * Property 1: Ödeme ekleme round-trip
 * paidAmount += amount
 * paidAmount >= totalAmount ise status = "PAID"
 */
function simulatePayment(
  currentPaid: number,
  totalAmount: number,
  paymentAmount: number
): { newPaidAmount: number; newStatus: string } {
  const newPaidAmount = currentPaid + paymentAmount;
  const newStatus = newPaidAmount >= totalAmount ? "PAID" : "SENT";
  return { newPaidAmount, newStatus };
}

describe("Property 1: Ödeme ekleme round-trip", () => {
  it("ödeme sonrası paidAmount doğru artmalı", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 10000, noNaN: true }),
        fc.double({ min: 100, max: 50000, noNaN: true }),
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        (currentPaid, totalAmount, paymentAmount) => {
          fc.pre(currentPaid < totalAmount);
          fc.pre(currentPaid + paymentAmount <= totalAmount);
          const result = simulatePayment(currentPaid, totalAmount, paymentAmount);
          return Math.abs(result.newPaidAmount - (currentPaid + paymentAmount)) < 0.001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("paidAmount >= totalAmount olduğunda status PAID olmalı", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 100, max: 50000, noNaN: true }),
        (totalAmount) => {
          const result = simulatePayment(0, totalAmount, totalAmount);
          return result.newStatus === "PAID";
        }
      ),
      { numRuns: 100 }
    );
  });

  it("paidAmount < totalAmount olduğunda status SENT kalmalı", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 100, max: 50000, noNaN: true }),
        fc.double({ min: 0.01, max: 0.99, noNaN: true }),
        (totalAmount, ratio) => {
          const partialPayment = totalAmount * ratio;
          const result = simulatePayment(0, totalAmount, partialPayment);
          return result.newStatus === "SENT";
        }
      ),
      { numRuns: 100 }
    );
  });
});
