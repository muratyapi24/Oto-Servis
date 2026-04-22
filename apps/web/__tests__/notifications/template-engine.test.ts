// Feature: whatsapp-notification-system
// Birim testleri: parseTemplate, renderTemplate, validateTemplateVariables

import {
  parseTemplate,
  renderTemplate,
  validateTemplateVariables,
} from "@/lib/notifications/template-engine";

// ---------------------------------------------------------------------------
// parseTemplate — Birim testleri
// ---------------------------------------------------------------------------

describe("parseTemplate", () => {
  it("tek değişkeni tespit eder", () => {
    const result = parseTemplate("Merhaba {{musteriAdi}}!");
    expect(result.variables).toEqual(["musteriAdi"]);
  });

  it("birden fazla değişkeni tespit eder", () => {
    const result = parseTemplate("{{musteriAdi}}, {{aracPlaka}} için randevunuz {{randevuTarihi}}");
    expect(result.variables).toContain("musteriAdi");
    expect(result.variables).toContain("aracPlaka");
    expect(result.variables).toContain("randevuTarihi");
    expect(result.variables).toHaveLength(3);
  });

  it("tekrarlanan değişkeni bir kez döndürür", () => {
    const result = parseTemplate("{{musteriAdi}} ve {{musteriAdi}} tekrar");
    expect(result.variables).toEqual(["musteriAdi"]);
  });

  it("değişken olmayan şablonda boş dizi döndürür", () => {
    const result = parseTemplate("Sabit metin, değişken yok.");
    expect(result.variables).toEqual([]);
  });

  it("boş şablonda boş dizi döndürür", () => {
    const result = parseTemplate("");
    expect(result.variables).toEqual([]);
  });

  it("orijinal body'yi korur", () => {
    const body = "Merhaba {{musteriAdi}}!";
    const result = parseTemplate(body);
    expect(result.body).toBe(body);
  });
});

// ---------------------------------------------------------------------------
// renderTemplate — Birim testleri
// ---------------------------------------------------------------------------

describe("renderTemplate", () => {
  it("değişkeni değeriyle değiştirir", () => {
    const result = renderTemplate("Merhaba {{musteriAdi}}!", { musteriAdi: "Ahmet" });
    expect(result).toBe("Merhaba Ahmet!");
  });

  it("birden fazla değişkeni değiştirir", () => {
    const result = renderTemplate(
      "{{musteriAdi}}, {{aracPlaka}} için randevunuz onaylandı.",
      { musteriAdi: "Ahmet", aracPlaka: "34 ABC 123" }
    );
    expect(result).toBe("Ahmet, 34 ABC 123 için randevunuz onaylandı.");
  });

  it("eksik değişkeni [değişken_adı] formatında bırakır", () => {
    const result = renderTemplate("Merhaba {{musteriAdi}}!", {});
    expect(result).toBe("Merhaba [musteriAdi]!");
  });

  it("tekrarlanan değişkeni her yerde değiştirir", () => {
    const result = renderTemplate(
      "{{musteriAdi}} ve {{musteriAdi}} tekrar",
      { musteriAdi: "Ahmet" }
    );
    expect(result).toBe("Ahmet ve Ahmet tekrar");
  });

  it("değişken olmayan şablonu olduğu gibi döndürür", () => {
    const body = "Sabit metin.";
    const result = renderTemplate(body, {});
    expect(result).toBe(body);
  });
});

// ---------------------------------------------------------------------------
// validateTemplateVariables — Birim testleri
// ---------------------------------------------------------------------------

describe("validateTemplateVariables", () => {
  it("tüm zorunlu değişkenler mevcutsa valid: true döner", () => {
    const body = "{{musteriAdi}} ve {{aracPlaka}}";
    const result = validateTemplateVariables(body, ["musteriAdi", "aracPlaka"]);
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it("eksik değişken varsa valid: false ve missing listesi döner", () => {
    const body = "{{musteriAdi}}";
    const result = validateTemplateVariables(body, ["musteriAdi", "aracPlaka"]);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("aracPlaka");
  });

  it("zorunlu değişken yoksa valid: true döner", () => {
    const body = "{{musteriAdi}}";
    const result = validateTemplateVariables(body, []);
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });
});
