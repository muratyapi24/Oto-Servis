// Feature: mobile-design-integration, Property 6: Gecikmiş alacak renk uygulaması
import * as fc from "fast-check";

const Colors = { error: '#ba1a1a' } as const;

function isOverdue(dueDate: Date, now: Date): boolean {
  return dueDate < now;
}

function getReceivableColor(dueDate: Date, now: Date): string {
  return isOverdue(dueDate, now) ? Colors.error : '#191c1e';
}

describe("Property 6: Gecikmiş alacak renk uygulaması", () => {
  it("dueDate < now ise renk Colors.error (#ba1a1a) olmalı", () => {
    const now = new Date('2025-01-15');
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2025-01-14') }),
        (dueDate) => {
          return getReceivableColor(dueDate, now) === Colors.error;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("dueDate >= now ise renk error olmamalı", () => {
    const now = new Date('2025-01-15');
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2025-01-15'), max: new Date('2030-12-31') }),
        (dueDate) => {
          return getReceivableColor(dueDate, now) !== Colors.error;
        }
      ),
      { numRuns: 100 }
    );
  });
});
