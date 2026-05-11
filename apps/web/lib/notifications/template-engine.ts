/**
 * Bildirim Şablon Motoru
 * Tenant bazlı özelleştirilebilir şablonlar + varsayılan fallback.
 * Desteklenen değişkenler: {{musteriAdi}}, {{aracPlaka}}, {{isEmriNo}},
 *   {{durum}}, {{tutar}}, {{randevuTarihi}}, {{randevuSaati}}, {{onayUrl}}
 */

import { prisma } from "@repo/database";

// ---------------------------------------------------------------------------
// Tipler
// ---------------------------------------------------------------------------

export interface ParsedTemplate {
  body: string;
  variables: string[]; // Tespit edilen değişken adları
}

export type TemplateType =
  | "SERVICE_STATUS"
  | "APPROVAL"
  | "APPOINTMENT"
  | "QUOTE"
  | "REMINDER"
  | "BULK";

export type TemplateChannel = "SMS" | "WHATSAPP" | "EMAIL";

export interface RenderOptions {
  tenantId: string;
  type: TemplateType;
  channel: TemplateChannel;
  variables: Record<string, string>;
}

// ---------------------------------------------------------------------------
// 3.1 parseTemplate — {{değişken}} formatındaki değişkenleri tespit et
// ---------------------------------------------------------------------------

/**
 * Şablon metnini ayrıştırır ve içindeki değişkenleri tespit eder.
 * Değişken formatı: {{değişkenAdı}}
 */
export function parseTemplate(body: string): ParsedTemplate {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = variableRegex.exec(body)) !== null) {
    const varName = match[1]!.trim();
    if (!seen.has(varName)) {
      variables.push(varName);
      seen.add(varName);
    }
  }

  return { body, variables };
}

// ---------------------------------------------------------------------------
// 3.2 renderTemplate — Değişkenleri değerlerle değiştir
// ---------------------------------------------------------------------------

/**
 * Şablon metnindeki {{değişken}} yer tutucularını sağlanan değerlerle değiştirir.
 * Eksik değişkenler [değişken_adı] formatında bırakılır.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
    const key = varName.trim();
    if (Object.prototype.hasOwnProperty.call(variables, key) && variables[key] !== undefined) {
      return variables[key];
    }
    // Eksik değişken — uyarı log ve placeholder bırak
    console.warn(`[TEMPLATE] Eksik değişken: ${key}`);
    return `[${key}]`;
  });
}

// ---------------------------------------------------------------------------
// 3.3 resolveTemplate — Tenant şablonu → varsayılan fallback
// ---------------------------------------------------------------------------

/**
 * Tenant'a özgü şablonu DB'den arar; bulunamazsa varsayılan şablona döner.
 */
export async function resolveTemplate(options: RenderOptions): Promise<string> {
  const { tenantId, type, channel, variables } = options;

  // Tenant şablonunu ara
  const tenantTemplate = await prisma.notificationTemplate.findFirst({
    where: {
      tenantId,
      type,
      channel,
      isActive: true,
      deletedAt: null,
    },
  });

  if (tenantTemplate) {
    return renderTemplate(tenantTemplate.body, variables);
  }

  // Varsayılan şablona dön
  const defaultBody = getDefaultTemplate(type, channel);
  return renderTemplate(defaultBody, variables);
}

// ---------------------------------------------------------------------------
// 3.4 validateTemplateVariables — Zorunlu değişken kontrolü
// ---------------------------------------------------------------------------

/**
 * Şablonun zorunlu değişkenleri içerip içermediğini kontrol eder.
 */
export function validateTemplateVariables(
  body: string,
  requiredVars: string[]
): { valid: boolean; missing: string[] } {
  const { variables } = parseTemplate(body);
  const missing = requiredVars.filter((v) => !variables.includes(v));
  return { valid: missing.length === 0, missing };
}

// ---------------------------------------------------------------------------
// Varsayılan şablonlar (lib/notifications/templates.ts'den türetilmiş)
// ---------------------------------------------------------------------------

function getDefaultTemplate(type: TemplateType, channel: TemplateChannel): string {
  const templates: Record<TemplateType, Record<TemplateChannel, string>> = {
    SERVICE_STATUS: {
      SMS: "MS Oto Servis: Sayın {{musteriAdi}}, {{aracPlaka}} plakalı aracınızın servis durumu güncellendi: {{durum}}. İş Emri #{{isEmriNo}}",
      WHATSAPP: "Sayın {{musteriAdi}}, {{aracPlaka}} plakalı aracınızın servis durumu: *{{durum}}*\nİş Emri: #{{isEmriNo}}",
      EMAIL: "Sayın {{musteriAdi}}, {{aracPlaka}} plakalı aracınızın servis durumu güncellendi: {{durum}}. İş Emri #{{isEmriNo}}",
    },
    APPROVAL: {
      SMS: "MS Oto Servis: Sayın {{musteriAdi}}, {{aracPlaka}} için ₺{{tutar}} tutarında servis onayı bekleniyor. Onaylamak için: {{onayUrl}}",
      WHATSAPP: "Sayın {{musteriAdi}}, {{aracPlaka}} için *₺{{tutar}}* tutarında servis onayı bekleniyor.\nOnaylamak için: {{onayUrl}}",
      EMAIL: "Sayın {{musteriAdi}}, {{aracPlaka}} için ₺{{tutar}} tutarında servis onayı bekleniyor. Onaylamak için: {{onayUrl}}",
    },
    APPOINTMENT: {
      SMS: "MS Oto Servis: Sayın {{musteriAdi}}, {{randevuTarihi}} tarihinde saat {{randevuSaati}} için randevunuz onaylandı.",
      WHATSAPP: "Sayın {{musteriAdi}}, randevunuz onaylandı!\n📅 Tarih: {{randevuTarihi}}\n🕐 Saat: {{randevuSaati}}",
      EMAIL: "Sayın {{musteriAdi}}, {{randevuTarihi}} tarihinde saat {{randevuSaati}} için randevunuz onaylandı.",
    },
    QUOTE: {
      SMS: "MS Oto Servis: Sayın {{musteriAdi}}, ₺{{tutar}} tutarında servis teklifiniz hazır. İncelemek için: {{onayUrl}}",
      WHATSAPP: "Sayın {{musteriAdi}}, servis teklifiniz hazır!\n💰 Tutar: ₺{{tutar}}\nİncelemek için: {{onayUrl}}",
      EMAIL: "Sayın {{musteriAdi}}, ₺{{tutar}} tutarında servis teklifiniz hazır. İncelemek için: {{onayUrl}}",
    },
    REMINDER: {
      SMS: "MS Oto Servis: Sayın {{musteriAdi}}, {{randevuTarihi}} tarihinde saat {{randevuSaati}} randevunuzu hatırlatırız. {{aracPlaka}}",
      WHATSAPP: "Sayın {{musteriAdi}}, randevu hatırlatması!\n📅 {{randevuTarihi}} - {{randevuSaati}}\n🚗 {{aracPlaka}}",
      EMAIL: "Sayın {{musteriAdi}}, {{randevuTarihi}} tarihinde saat {{randevuSaati}} randevunuzu hatırlatırız.",
    },
    BULK: {
      SMS: "MS Oto Servis: Sayın {{musteriAdi}}, size özel bir mesajımız var.",
      WHATSAPP: "Sayın {{musteriAdi}}, size özel bir mesajımız var.",
      EMAIL: "Sayın {{musteriAdi}}, size özel bir mesajımız var.",
    },
  };

  return templates[type]?.[channel] ?? "Sayın {{musteriAdi}}, MS Oto Servis'ten bir bildirim.";
}
