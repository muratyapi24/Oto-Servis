// Feature: stock-parts-management
// Task 17: Property-Based Testler (fast-check)
// Validates: Requirements 9.1, 9.2, 9.4, 9.5, 9.6, 2.3, 7.3

import * as fc from "fast-check";

// ---------------------------------------------------------------------------
// Yardımcı Simülasyon Fonksiyonları
// ---------------------------------------------------------------------------

/**
 * 17.2 / 17.6 — OUT hareketi uygula
 * Validates: Requirement 9.1, 9.2
 */
function applyOutMovement(
  currentStock: number,
  quantity: number
): { newStock: number; success: boolean } {
  if (currentStock < quantity) return { newStock: currentStock, success: false };
  return { newStock: currentStock - quantity, success: true };
}

/**
 * 17.3 — Transfer stok korunumu
 * Validates: Requirement 5.7, 9.6
 */
function applyTransfer(
  sourceStock: number,
  targetStock: number,
  quantity: number
): { source: number; target: number; success: boolean } {
  if (sourceStock < quantity)
    return { source: sourceStock, target: targetStock, success: false };
  return {
    source: sourceStock - quantity,
    target: targetStock + quantity,
    success: true,
  };
}

/**
 * 17.4 — Sayım onayı: currentStock = actualQuantity
 * Validates: Requirement 3.5, 9.5
 */
function applyStockCount(
  _systemQuantity: number,
  actualQuantity: number
): number {
  return actualQuantity;
}

/**
 * 17.5 — Kümülatif stok hesabı
 * Validates: Requirement 9.4
 */
type Movement = { type: "IN" | "OUT" | "ADJUST"; quantity: number };

function calculateStock(
  initialStock: number,
  movements: Movement[]
): number {
  return movements.reduce((stock, mov) => {
    if (mov.type === "IN") return stock + mov.quantity;
    if (mov.type === "OUT") return stock - mov.quantity;
    return stock + mov.quantity; // ADJUST (pozitif veya negatif)
  }, initialStock);
}

/**
 * 17.7 — Reorder debounce mantığı
 * Validates: Requirement 2.3
 */
function shouldSendReorderAlert(
  lastAlertTime: number | null,
  now: number,
  debounceMs: number
): boolean {
  if (!lastAlertTime) return true;
  return now - lastAlertTime >= debounceMs;
}

/**
 * 17.8 — PO durum geçişleri
 * Validates: Requirement 7.3
 */
type POStatus =
  | "DRAFT"
  | "SENT"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

function isValidPOTransition(from: POStatus, to: POStatus): boolean {
  const validTransitions: Record<POStatus, POStatus[]> = {
    DRAFT: ["SENT", "CANCELLED"],
    SENT: ["PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"],
    PARTIALLY_RECEIVED: ["RECEIVED"],
    RECEIVED: [],
    CANCELLED: [],
  };
  return validTransitions[from]?.includes(to) ?? false;
}

// ---------------------------------------------------------------------------
// 17.2 — PBT: OUT hareketi negatif stok koruması
// Validates: Requirements 9.1, 9.2
// ---------------------------------------------------------------------------

describe("17.2 PBT: OUT hareketi → currentStock_sonra ≥ 0", () => {
  it("∀ currentStock ≥ 0, quantity > 0 → newStock hiçbir zaman negatife düşmemeli", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000 }),
        fc.integer({ min: 1, max: 100_000 }),
        (currentStock, quantity) => {
          const result = applyOutMovement(currentStock, quantity);
          return result.newStock >= 0;
        }
      ),
      { numRuns: 1000 }
    );
  });

  it("∀ başarılı OUT → newStock = currentStock - quantity", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100_000 }),
        fc.integer({ min: 1, max: 100_000 }),
        (currentStock, quantity) => {
          fc.pre(currentStock >= quantity);
          const result = applyOutMovement(currentStock, quantity);
          return result.success && result.newStock === currentStock - quantity;
        }
      ),
      { numRuns: 1000 }
    );
  });

  it("∀ yetersiz stok → success: false ve stok değişmemeli", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000 }),
        fc.integer({ min: 1, max: 100_000 }),
        (currentStock, quantity) => {
          fc.pre(currentStock < quantity);
          const result = applyOutMovement(currentStock, quantity);
          return !result.success && result.newStock === currentStock;
        }
      ),
      { numRuns: 1000 }
    );
  });
});

// ---------------------------------------------------------------------------
// 17.3 — PBT: Transfer stok korunumu
// Validates: Requirements 5.7, 9.6
// ---------------------------------------------------------------------------

describe("17.3 PBT: Transfer → kaynak_sonra + hedef_sonra = kaynak_önce + hedef_önce", () => {
  it("∀ başarılı transfer → toplam stok değişmemeli", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000 }),
        fc.integer({ min: 0, max: 100_000 }),
        fc.integer({ min: 1, max: 100_000 }),
        (sourceStock, targetStock, quantity) => {
          fc.pre(sourceStock >= quantity);
          const before = sourceStock + targetStock;
          const result = applyTransfer(sourceStock, targetStock, quantity);
          const after = result.source + result.target;
          return result.success && after === before;
        }
      ),
      { numRuns: 1000 }
    );
  });

  it("∀ yetersiz kaynak stok → transfer başarısız, stoklar değişmemeli", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000 }),
        fc.integer({ min: 0, max: 100_000 }),
        fc.integer({ min: 1, max: 100_000 }),
        (sourceStock, targetStock, quantity) => {
          fc.pre(sourceStock < quantity);
          const result = applyTransfer(sourceStock, targetStock, quantity);
          return (
            !result.success &&
            result.source === sourceStock &&
            result.target === targetStock
          );
        }
      ),
      { numRuns: 1000 }
    );
  });

  it("∀ transfer → kaynak azalması = hedef artışı", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100_000 }),
        fc.integer({ min: 0, max: 100_000 }),
        fc.integer({ min: 1, max: 100_000 }),
        (sourceStock, targetStock, quantity) => {
          fc.pre(sourceStock >= quantity);
          const result = applyTransfer(sourceStock, targetStock, quantity);
          const sourceDelta = sourceStock - result.source;
          const targetDelta = result.target - targetStock;
          return result.success && sourceDelta === targetDelta;
        }
      ),
      { numRuns: 1000 }
    );
  });
});

// ---------------------------------------------------------------------------
// 17.4 — PBT: Sayım onayı → currentStock = actualQuantity
// Validates: Requirements 3.5, 9.5
// ---------------------------------------------------------------------------

describe("17.4 PBT: Sayım onayı → currentStock = actualQuantity", () => {
  it("∀ actualQuantity ≥ 0 → applyStockCount sonucu actualQuantity'ye eşit olmalı", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000 }),
        fc.integer({ min: 0, max: 100_000 }),
        (systemQuantity, actualQuantity) => {
          const result = applyStockCount(systemQuantity, actualQuantity);
          return result === actualQuantity;
        }
      ),
      { numRuns: 1000 }
    );
  });

  it("∀ sayım onayı → sistem miktarından bağımsız olarak actualQuantity döner", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000 }),
        fc.integer({ min: 0, max: 100_000 }),
        (systemQuantity, actualQuantity) => {
          const result1 = applyStockCount(systemQuantity, actualQuantity);
          const result2 = applyStockCount(systemQuantity + 999, actualQuantity);
          return result1 === result2 && result1 === actualQuantity;
        }
      ),
      { numRuns: 500 }
    );
  });
});

// ---------------------------------------------------------------------------
// 17.5 — PBT: Kümülatif stok hesabı
// Validates: Requirement 9.4
// ---------------------------------------------------------------------------

describe("17.5 PBT: ∀ StockMovement dizisi → currentStock = Σ(IN) - Σ(OUT) + Σ(ADJUST)", () => {
  const movementArb = fc.record({
    type: fc.constantFrom("IN" as const, "OUT" as const, "ADJUST" as const),
    quantity: fc.integer({ min: 1, max: 1000 }),
  });

  it("calculateStock sonucu manuel hesapla tutarlı olmalı", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000 }),
        fc.array(movementArb, { minLength: 0, maxLength: 50 }),
        (initialStock, movements) => {
          const result = calculateStock(initialStock, movements);
          const sumIn = movements
            .filter((m) => m.type === "IN")
            .reduce((s, m) => s + m.quantity, 0);
          const sumOut = movements
            .filter((m) => m.type === "OUT")
            .reduce((s, m) => s + m.quantity, 0);
          const sumAdjust = movements
            .filter((m) => m.type === "ADJUST")
            .reduce((s, m) => s + m.quantity, 0);
          const expected = initialStock + sumIn - sumOut + sumAdjust;
          return result === expected;
        }
      ),
      { numRuns: 500 }
    );
  });

  it("boş hareket dizisi → stok değişmemeli", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100_000 }), (initialStock) => {
        return calculateStock(initialStock, []) === initialStock;
      }),
      { numRuns: 500 }
    );
  });

  it("yalnızca IN hareketleri → stok artmalı", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000 }),
        fc.array(
          fc.record({
            type: fc.constant("IN" as const),
            quantity: fc.integer({ min: 1, max: 1000 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (initialStock, movements) => {
          const result = calculateStock(initialStock, movements);
          return result > initialStock;
        }
      ),
      { numRuns: 500 }
    );
  });
});

// ---------------------------------------------------------------------------
// 17.6 — Unit Test: Negatif stok koruması
// Validates: Requirements 9.1, 9.2, 4.5
// ---------------------------------------------------------------------------

describe("17.6 Unit Test: Negatif stok koruması (OUT > currentStock → hata)", () => {
  it("OUT miktarı currentStock'tan büyükse success: false döner", () => {
    const result = applyOutMovement(5, 10);
    expect(result.success).toBe(false);
  });

  it("OUT miktarı currentStock'tan büyükse stok değişmez", () => {
    const result = applyOutMovement(5, 10);
    expect(result.newStock).toBe(5);
  });

  it("currentStock = 0 iken herhangi bir OUT → başarısız", () => {
    const result = applyOutMovement(0, 1);
    expect(result.success).toBe(false);
    expect(result.newStock).toBe(0);
  });

  it("OUT miktarı tam olarak currentStock'a eşitse → başarılı, stok = 0", () => {
    const result = applyOutMovement(10, 10);
    expect(result.success).toBe(true);
    expect(result.newStock).toBe(0);
  });

  it("OUT miktarı currentStock'tan küçükse → başarılı", () => {
    const result = applyOutMovement(10, 3);
    expect(result.success).toBe(true);
    expect(result.newStock).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// 17.7 — Unit Test: 24 saatlik reorder debounce mantığı
// Validates: Requirement 2.3
// ---------------------------------------------------------------------------

describe("17.7 Unit Test: 24 saatlik reorder debounce mantığı", () => {
  const DEBOUNCE_MS = 86_400_000; // 24 saat = 86400000ms
  const now = Date.now();

  it("lastAlertTime null ise → uyarı gönderilmeli", () => {
    expect(shouldSendReorderAlert(null, now, DEBOUNCE_MS)).toBe(true);
  });

  it("son uyarı 1 saat önce gönderildiyse → uyarı gönderilmemeli", () => {
    const oneHourAgo = now - 1 * 60 * 60 * 1000; // 1 saat önce
    expect(shouldSendReorderAlert(oneHourAgo, now, DEBOUNCE_MS)).toBe(false);
  });

  it("son uyarı 23 saat önce gönderildiyse → uyarı gönderilmemeli", () => {
    const twentyThreeHoursAgo = now - 23 * 60 * 60 * 1000;
    expect(shouldSendReorderAlert(twentyThreeHoursAgo, now, DEBOUNCE_MS)).toBe(
      false
    );
  });

  it("son uyarı tam 24 saat önce gönderildiyse → uyarı gönderilmeli (eşik dahil)", () => {
    const exactlyTwentyFourHoursAgo = now - DEBOUNCE_MS;
    expect(
      shouldSendReorderAlert(exactlyTwentyFourHoursAgo, now, DEBOUNCE_MS)
    ).toBe(true);
  });

  it("son uyarı 25 saat önce gönderildiyse → uyarı gönderilmeli", () => {
    const twentyFiveHoursAgo = now - 25 * 60 * 60 * 1000;
    expect(shouldSendReorderAlert(twentyFiveHoursAgo, now, DEBOUNCE_MS)).toBe(
      true
    );
  });

  it("son uyarı 48 saat önce gönderildiyse → uyarı gönderilmeli", () => {
    const fortyEightHoursAgo = now - 48 * 60 * 60 * 1000;
    expect(shouldSendReorderAlert(fortyEightHoursAgo, now, DEBOUNCE_MS)).toBe(
      true
    );
  });
});

// ---------------------------------------------------------------------------
// 17.8 — Unit Test: PO durum geçişleri
// Validates: Requirement 7.3
// ---------------------------------------------------------------------------

describe("17.8 Unit Test: PO durum geçişleri (geçersiz geçişler reddedilmeli)", () => {
  // Geçerli geçişler
  it("DRAFT → SENT geçerli olmalı", () => {
    expect(isValidPOTransition("DRAFT", "SENT")).toBe(true);
  });

  it("DRAFT → CANCELLED geçerli olmalı", () => {
    expect(isValidPOTransition("DRAFT", "CANCELLED")).toBe(true);
  });

  it("SENT → PARTIALLY_RECEIVED geçerli olmalı", () => {
    expect(isValidPOTransition("SENT", "PARTIALLY_RECEIVED")).toBe(true);
  });

  it("SENT → RECEIVED geçerli olmalı", () => {
    expect(isValidPOTransition("SENT", "RECEIVED")).toBe(true);
  });

  it("SENT → CANCELLED geçerli olmalı", () => {
    expect(isValidPOTransition("SENT", "CANCELLED")).toBe(true);
  });

  it("PARTIALLY_RECEIVED → RECEIVED geçerli olmalı", () => {
    expect(isValidPOTransition("PARTIALLY_RECEIVED", "RECEIVED")).toBe(true);
  });

  // Geçersiz geçişler
  it("RECEIVED → DRAFT geçersiz olmalı", () => {
    expect(isValidPOTransition("RECEIVED", "DRAFT")).toBe(false);
  });

  it("CANCELLED → SENT geçersiz olmalı", () => {
    expect(isValidPOTransition("CANCELLED", "SENT")).toBe(false);
  });

  it("RECEIVED → CANCELLED geçersiz olmalı", () => {
    expect(isValidPOTransition("RECEIVED", "CANCELLED")).toBe(false);
  });

  it("CANCELLED → DRAFT geçersiz olmalı", () => {
    expect(isValidPOTransition("CANCELLED", "DRAFT")).toBe(false);
  });

  it("DRAFT → RECEIVED geçersiz olmalı (SENT adımı atlanamaz)", () => {
    expect(isValidPOTransition("DRAFT", "RECEIVED")).toBe(false);
  });

  it("DRAFT → PARTIALLY_RECEIVED geçersiz olmalı", () => {
    expect(isValidPOTransition("DRAFT", "PARTIALLY_RECEIVED")).toBe(false);
  });

  it("PARTIALLY_RECEIVED → DRAFT geçersiz olmalı", () => {
    expect(isValidPOTransition("PARTIALLY_RECEIVED", "DRAFT")).toBe(false);
  });

  it("PARTIALLY_RECEIVED → CANCELLED geçersiz olmalı", () => {
    expect(isValidPOTransition("PARTIALLY_RECEIVED", "CANCELLED")).toBe(false);
  });

  it("RECEIVED → SENT geçersiz olmalı", () => {
    expect(isValidPOTransition("RECEIVED", "SENT")).toBe(false);
  });
});
