// Feature: whatsapp-notification-system
// Property-based testler: şablon motoru özellikleri

import * as fc from "fast-check";
import {
  parseTemplate,
  renderTemplate,
} from "@/lib/notifications/template-engine";

// ---------------------------------------------------------------------------
// Property 6: Şablon Değişken Tespiti
// Validates: Requirements 9.1, 5.3
// ---------------------------------------------------------------------------

describe("Feature: whatsapp-notification-system, Property 6: Şablon değişken tespiti", () => {
  it("{{değişken}} formatındaki tüm değişkenleri eksiksiz tespit etmeli", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z]+$/.test(s)),
          { minLength: 1, maxLength: 5 }
        ),
        (varNames) => {
          const uniqueVars = [...new Set(varNames)];
          const body = uniqueVars.map((v) => `{{${v}}}`).join(" ");
          const { variables } = parseTemplate(body);
          return uniqueVars.every((v) => variables.includes(v));
        }
      ),
      { numRuns: 100 }
    );
  });

  it("değişken olmayan şablonda boş dizi döner", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !s.includes("{{")),
        (body) => {
          const { variables } = parseTemplate(body);
          return variables.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Şablon Render İdempotansı
// Validates: Requirements 9.2, 9.3, 9.5
// ---------------------------------------------------------------------------

describe("Feature: whatsapp-notification-system, Property 7: Şablon render idempotansı", () => {
  it("aynı şablon ve değişkenlerle her zaman aynı sonuç üretmeli", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 200 }),
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z]+$/.test(s)),
          fc.string({ minLength: 0, maxLength: 50 })
        ),
        (template, variables) => {
          const result1 = renderTemplate(template, variables);
          const result2 = renderTemplate(template, variables);
          return result1 === result2;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("tüm değişkenler sağlandığında sonuçta {{...}} formatı kalmamalı", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 15 }).filter((s) => /^[a-zA-Z]+$/.test(s)),
          { minLength: 1, maxLength: 5 }
        ),
        fc.string({ minLength: 0, maxLength: 50 }),
        (varNames, value) => {
          const uniqueVars = [...new Set(varNames)];
          const body = uniqueVars.map((v) => `{{${v}}}`).join(" ");
          const variables = Object.fromEntries(uniqueVars.map((v) => [v, value]));
          const result = renderTemplate(body, variables);
          return !result.includes("{{");
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 8: Eksik Değişken [değişken_adı] Formatı
// Validates: Requirements 9.4
// ---------------------------------------------------------------------------

describe("Feature: whatsapp-notification-system, Property 8: Eksik değişken formatı", () => {
  it("değeri sağlanmayan değişken [değişken_adı] formatında bırakılmalı", () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-zA-Z]{1,20}$/),
        (varName) => {
          const template = `{{${varName}}}`;
          const result = renderTemplate(template, {}); // Değer sağlanmıyor
          return result === `[${varName}]`;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("eksik değişken boş string ile değiştirilmemeli", () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-zA-Z]{1,20}$/),
        (varName) => {
          const template = `{{${varName}}}`;
          const result = renderTemplate(template, {});
          return result !== "";
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: Şablon Çözümleme Fallback (simülasyon)
// Validates: Requirements 5.2
// ---------------------------------------------------------------------------

// Fallback simülasyonu
function resolveTemplateSync(
  tenantTemplate: string | null,
  defaultTemplate: string,
  variables: Record<string, string>
): string {
  const template = tenantTemplate ?? defaultTemplate;
  return renderTemplate(template, variables);
}

describe("Feature: whatsapp-notification-system, Property 9: Şablon çözümleme fallback", () => {
  it("tenant şablonu varsa tenant şablonu kullanılmalı", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.dictionary(fc.string(), fc.string()),
        (tenantTemplate, defaultTemplate, variables) => {
          const result = resolveTemplateSync(tenantTemplate, defaultTemplate, variables);
          // Tenant şablonu kullanıldığında default şablonun içeriği olmamalı
          // (eğer farklılarsa)
          if (tenantTemplate !== defaultTemplate) {
            const tenantResult = renderTemplate(tenantTemplate, variables);
            return result === tenantResult;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("tenant şablonu yoksa default şablon kullanılmalı", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.dictionary(fc.string(), fc.string()),
        (defaultTemplate, variables) => {
          const result = resolveTemplateSync(null, defaultTemplate, variables);
          const defaultResult = renderTemplate(defaultTemplate, variables);
          return result === defaultResult;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("her durumda geçerli bir string döner (null/undefined değil)", () => {
    fc.assert(
      fc.property(
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.dictionary(fc.string(), fc.string()),
        (tenantTemplate, defaultTemplate, variables) => {
          const result = resolveTemplateSync(tenantTemplate, defaultTemplate, variables);
          return typeof result === "string";
        }
      ),
      { numRuns: 100 }
    );
  });
});
