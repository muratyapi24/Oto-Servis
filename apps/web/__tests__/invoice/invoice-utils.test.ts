// Feature: invoice-payment-accounting
// Birim testleri: invoice-utils.ts saf fonksiyonları

import {
  calculateLineTotal,
  calculateInvoiceTotals,
  generateInvoiceNumber,
  generateDraftInvoiceNumber,
  formatTurkishDate,
  formatTurkishCurrency,
} from "@/lib/invoice-utils";

// ---------------------------------------------------------------------------
// calculateLineTotal — 5 test
// ---------------------------------------------------------------------------
describe("calculateLineTotal", () => {
  it("standart hesaplama: %20 KDV, indirim yok", () => {
    // 2 adet * 100 TL * (1 - 0/100) * (1 + 20/100) = 240
    const result = calculateLineTotal(2, 100, 0, 20);
    expect(result).toBeCloseTo(240, 2);
  });

  it("%10 indirim ve %18 KDV ile hesaplama", () => {
    // 1 * 200 * (1 - 10/100) * (1 + 18/100) = 200 * 0.9 * 1.18 = 212.4
    const result = calculateLineTotal(1, 200, 10, 18);
    expect(result).toBeCloseTo(212.4, 2);
  });

  it("KDV sıfır olduğunda sadece indirim uygulanır", () => {
    // 5 * 50 * (1 - 20/100) * (1 + 0/100) = 250 * 0.8 = 200
    const result = calculateLineTotal(5, 50, 20, 0);
    expect(result).toBeCloseTo(200, 2);
  });

  it("%100 indirim olduğunda lineTotal sıfır olur", () => {
    const result = calculateLineTotal(3, 100, 100, 20);
    expect(result).toBeCloseTo(0, 2);
  });

  it("kesirli miktar ve fiyat ile doğru hesaplama", () => {
    // 1.5 * 33.33 * (1 - 5/100) * (1 + 8/100)
    // = 49.995 * 0.95 * 1.08 = 49.995 * 1.026 = 51.295...
    const result = calculateLineTotal(1.5, 33.33, 5, 8);
    const expected = 1.5 * 33.33 * (1 - 5 / 100) * (1 + 8 / 100);
    expect(result).toBeCloseTo(expected, 2);
  });
});

// ---------------------------------------------------------------------------
// calculateInvoiceTotals — 3 test
// ---------------------------------------------------------------------------
describe("calculateInvoiceTotals", () => {
  it("boş kalem listesi için sıfır toplamlar döner", () => {
    const result = calculateInvoiceTotals([]);
    expect(result.subTotal).toBe(0);
    expect(result.taxAmount).toBe(0);
    expect(result.discountAmount).toBe(0);
    expect(result.totalAmount).toBe(0);
  });

  it("tek kalem için doğru toplamlar hesaplar", () => {
    const items = [{ quantity: 2, unitPrice: 100, discountRate: 0, taxRate: 20 }];
    const result = calculateInvoiceTotals(items);
    // subTotal = 2 * 100 * (1 - 0) = 200
    // taxAmount = 200 * 0.20 = 40
    // discountAmount = 0
    // totalAmount = 200 + 40 = 240
    expect(result.subTotal).toBeCloseTo(200, 2);
    expect(result.taxAmount).toBeCloseTo(40, 2);
    expect(result.discountAmount).toBeCloseTo(0, 2);
    expect(result.totalAmount).toBeCloseTo(240, 2);
  });

  it("birden fazla kalem için toplamları doğru birleştirir", () => {
    const items = [
      { quantity: 1, unitPrice: 500, discountRate: 10, taxRate: 20 },
      { quantity: 3, unitPrice: 100, discountRate: 0, taxRate: 18 },
    ];
    const result = calculateInvoiceTotals(items);

    // Kalem 1: subTotal = 500 * 0.9 = 450, tax = 450 * 0.2 = 90, discount = 50
    // Kalem 2: subTotal = 300 * 1 = 300, tax = 300 * 0.18 = 54, discount = 0
    // Toplam subTotal = 750, taxAmount = 144, discountAmount = 50, totalAmount = 894
    expect(result.subTotal).toBeCloseTo(750, 2);
    expect(result.taxAmount).toBeCloseTo(144, 2);
    expect(result.discountAmount).toBeCloseTo(50, 2);
    expect(result.totalAmount).toBeCloseTo(894, 2);
  });
});

// ---------------------------------------------------------------------------
// generateInvoiceNumber — 2 test
// ---------------------------------------------------------------------------
describe("generateInvoiceNumber", () => {
  it("doğru formatta fatura numarası üretir: 2025-0001", () => {
    const result = generateInvoiceNumber(2025, 1);
    expect(result).toBe("2025-0001");
  });

  it("dört haneli sıra numarası için doğru format: 2024-0123", () => {
    const result = generateInvoiceNumber(2024, 123);
    expect(result).toBe("2024-0123");
  });
});

// ---------------------------------------------------------------------------
// formatTurkishDate — 2 test
// ---------------------------------------------------------------------------
describe("formatTurkishDate", () => {
  it("tarihi DD.MM.YYYY formatında döndürür", () => {
    const date = new Date(2025, 0, 15); // 15 Ocak 2025
    const result = formatTurkishDate(date);
    expect(result).toBe("15.01.2025");
  });

  it("tek haneli gün ve ay için sıfır ekler", () => {
    const date = new Date(2024, 2, 5); // 5 Mart 2024
    const result = formatTurkishDate(date);
    expect(result).toBe("05.03.2024");
  });
});

// ---------------------------------------------------------------------------
// formatTurkishCurrency — 2 test
// ---------------------------------------------------------------------------
describe("formatTurkishCurrency", () => {
  it("Türk lirası formatında para birimi döndürür", () => {
    const result = formatTurkishCurrency(1234.56);
    // Türkçe locale: ₺1.234,56
    expect(result).toContain("1.234");
    expect(result).toContain("56");
    expect(result).toContain("₺");
  });

  it("sıfır tutarı doğru formatlar", () => {
    const result = formatTurkishCurrency(0);
    expect(result).toContain("0");
    expect(result).toContain("₺");
  });
});

// ---------------------------------------------------------------------------
// generateDraftInvoiceNumber — ek test
// ---------------------------------------------------------------------------
describe("generateDraftInvoiceNumber", () => {
  it("TASLAK- öneki ile başlar", () => {
    const result = generateDraftInvoiceNumber();
    expect(result).toMatch(/^TASLAK-\d+$/);
  });
});
