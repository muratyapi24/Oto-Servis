// Feature: whatsapp-notification-system
// Birim testleri: normalizePhone, sağlayıcı seçimi, simülasyon modu

import { normalizePhone } from "@/lib/notifications/whatsapp";

// ---------------------------------------------------------------------------
// normalizePhone — Birim testleri
// ---------------------------------------------------------------------------

describe("normalizePhone", () => {
  it("0 ile başlayan 11 haneli numarayı +90 formatına dönüştürür", () => {
    expect(normalizePhone("05321234567")).toBe("+905321234567");
  });

  it("+90 ile başlayan numarayı olduğu gibi döndürür", () => {
    expect(normalizePhone("+905321234567")).toBe("+905321234567");
  });

  it("90 ile başlayan 12 haneli numarayı +90 formatına dönüştürür", () => {
    expect(normalizePhone("905321234567")).toBe("+905321234567");
  });

  it("10 haneli numarayı +90 ekleyerek döndürür", () => {
    expect(normalizePhone("5321234567")).toBe("+905321234567");
  });

  it("boşluk ve tire içeren numarayı temizler", () => {
    expect(normalizePhone("0532 123 45 67")).toBe("+905321234567");
  });

  it("parantez içeren numarayı temizler", () => {
    expect(normalizePhone("(0532) 123-45-67")).toBe("+905321234567");
  });
});
