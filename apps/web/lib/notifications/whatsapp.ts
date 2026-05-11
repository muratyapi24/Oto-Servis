/**
 * WhatsApp Bildirim Servisi
 * Twilio WhatsApp ve Meta Cloud API çift sağlayıcı desteği.
 * Ortam değişkenleri: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER
 *                    META_WHATSAPP_PHONE_NUMBER_ID, META_WHATSAPP_ACCESS_TOKEN
 */

import { prisma } from "@repo/database";
import * as Sentry from "@sentry/nextjs";
import { checkLimit, checkFeature } from "@/lib/subscription-guard";

// ---------------------------------------------------------------------------
// Tipler
// ---------------------------------------------------------------------------

export interface SendWhatsAppOptions {
  to: string;           // Normalize edilecek telefon numarası
  body: string;         // Serbest metin (Twilio) veya HSM parametreleri
  tenantId: string;
  customerId?: string;
  templateName?: string;    // Meta Cloud API için HSM şablon adı
  templateParams?: string[]; // HSM şablon parametreleri
  languageCode?: string;    // HSM dil kodu (varsayılan: "tr")
}

export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

// ---------------------------------------------------------------------------
// 2.2 Telefon numarası normalizasyonu
// ---------------------------------------------------------------------------

/**
 * Türkiye telefon numarasını +90XXXXXXXXXX formatına dönüştürür.
 * Desteklenen formatlar: 0XXXXXXXXXX, +90XXXXXXXXXX, XXXXXXXXXX (10 haneli)
 */
export function normalizePhone(phone: string): string {
  // Sadece rakamları al
  const digits = phone.replace(/[^0-9]/g, "");

  // +90 ile başlıyorsa (12 haneli: 90 + 10 rakam)
  if (phone.startsWith("+90") && digits.length === 12) {
    return `+${digits}`;
  }

  // 90 ile başlıyorsa (12 haneli)
  if (digits.startsWith("90") && digits.length === 12) {
    return `+${digits}`;
  }

  // 0 ile başlıyorsa (11 haneli: 0 + 10 rakam)
  if (digits.startsWith("0") && digits.length === 11) {
    return `+9${digits}`;
  }

  // 10 haneli (başında 0 yok)
  if (digits.length === 10) {
    return `+90${digits}`;
  }

  // Diğer durumlar — olduğu gibi döndür
  return phone.startsWith("+") ? phone : `+${digits}`;
}

// ---------------------------------------------------------------------------
// 2.3 Twilio WhatsApp gönderimi
// ---------------------------------------------------------------------------

async function sendViaTwilio(
  to: string,
  body: string,
  settings: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const accountSid = settings.accountSid || process.env.TWILIO_ACCOUNT_SID;
  const authToken = settings.authToken || process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = settings.fromNumber || process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio kimlik bilgileri eksik.");
  }

  const twilio = (await import("twilio")).default;
  const client = twilio(accountSid, authToken);

  const normalizedTo = normalizePhone(to);
  const message = await client.messages.create({
    body,
    from: `whatsapp:${fromNumber}`,
    to: `whatsapp:${normalizedTo}`,
  });

  return { success: true, messageId: message.sid };
}

// ---------------------------------------------------------------------------
// 2.4 Meta Cloud API gönderimi
// ---------------------------------------------------------------------------

async function sendViaMetaCloudAPI(
  to: string,
  options: {
    body?: string;
    templateName?: string;
    templateParams?: string[];
    languageCode?: string;
  },
  settings: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const phoneNumberId = settings.phoneNumberId || process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = settings.accessToken || process.env.META_WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error("Meta Cloud API kimlik bilgileri eksik.");
  }

  const normalizedTo = normalizePhone(to);
  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  let messagePayload: Record<string, unknown>;

  if (options.templateName) {
    // HSM şablon mesajı
    messagePayload = {
      messaging_product: "whatsapp",
      to: normalizedTo,
      type: "template",
      template: {
        name: options.templateName,
        language: { code: options.languageCode ?? "tr" },
        components: options.templateParams?.length
          ? [
              {
                type: "body",
                parameters: options.templateParams.map((p) => ({
                  type: "text",
                  text: p,
                })),
              },
            ]
          : [],
      },
    };
  } else if (options.body) {
    // Serbest metin (yalnızca Twilio destekler, Meta için şablon gerekli)
    messagePayload = {
      messaging_product: "whatsapp",
      to: normalizedTo,
      type: "text",
      text: { body: options.body },
    };
  } else {
    throw new Error("Meta Cloud API: Şablon adı veya mesaj içeriği gerekli.");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(messagePayload),
  });

  const data = (await response.json()) as {
    messages?: Array<{ id: string }>;
    error?: { message: string; code: number };
  };

  if (!response.ok || data.error) {
    throw new Error(data.error?.message ?? `Meta API hatası: HTTP ${response.status}`);
  }

  return { success: true, messageId: data.messages?.[0]?.id };
}

// ---------------------------------------------------------------------------
// 2.1 Ana sendWhatsApp fonksiyonu
// ---------------------------------------------------------------------------

export async function sendWhatsApp(options: SendWhatsAppOptions): Promise<WhatsAppResult> {
  const { to, body, tenantId, customerId, templateName, templateParams, languageCode } = options;

  let notificationId: string | null = null;

  try {
    // Subscription Guard — WhatsApp özellik ve kota kontrolü
    const featureCheck = await checkFeature(tenantId, "whatsapp");
    if (!featureCheck.allowed) {
      return { success: false, error: featureCheck.message || "WhatsApp özelliği paketinizde bulunmamaktadır." };
    }
    const waLimit = await checkLimit(tenantId, "maxWhatsappPerMonth");
    if (!waLimit.allowed) {
      return { success: false, error: waLimit.message || "Aylık WhatsApp kotanız dolmuştur." };
    }

    // 2.5 Sağlayıcı seçim mantığı
    const activeProvider = await prisma.notificationProvider.findFirst({
      where: { tenantId, type: "WHATSAPP", isActive: true },
    });

    const channelName = activeProvider
      ? activeProvider.provider.toLowerCase()
      : "whatsapp-simulated";

    // 2.6 PENDING Notification kaydı oluştur
    const notification = await prisma.notification.create({
      data: {
        tenantId,
        customerId: customerId ?? null,
        type: "WHATSAPP",
        channel: channelName,
        recipient: normalizePhone(to),
        body: body || templateName || "",
        status: "PENDING",
        metadata: {
          templateName: templateName ?? null,
          templateParams: templateParams ?? null,
        },
      },
    });
    notificationId = notification.id;

    // Sağlayıcı yoksa simülasyon modu
    if (!activeProvider) {
      console.warn("[WHATSAPP] Aktif sağlayıcı bulunamadı. Simülasyon modu. To:", to);
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: "SENT",
          sentAt: new Date(),
          metadata: { simulated: true },
        },
      });
      return { success: true, simulated: true };
    }

    // 2.7 API anahtarı çözme (settings JSON'dan)
    const settings = (activeProvider.settings as Record<string, string>) ?? {};

    let result: { success: boolean; messageId?: string; error?: string };

    if (activeProvider.provider === "TWILIO_WHATSAPP" || activeProvider.provider === "TWILIO") {
      // 2.3 Twilio WhatsApp
      result = await sendViaTwilio(to, body, settings);
    } else if (activeProvider.provider === "META_CLOUD_API") {
      // 2.4 Meta Cloud API
      result = await sendViaMetaCloudAPI(to, { body, templateName, templateParams, languageCode }, settings);
    } else {
      throw new Error(`Bilinmeyen WhatsApp sağlayıcısı: ${activeProvider.provider}`);
    }

    // 2.6 Başarılı — SENT güncelle
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: "SENT",
        sentAt: new Date(),
        metadata: { messageId: result.messageId },
      },
    });

    return { success: true, messageId: result.messageId };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? (err instanceof Error ? err.message : String(err)) : "Bilinmeyen hata";

    Sentry.captureException(err, {
      tags: { module: "whatsapp-notification" },
      extra: { to, tenantId },
    });

    // 2.6 FAILED güncelle
    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: "FAILED",
          retryCount: { increment: 1 },
          metadata: { error: errorMessage },
        },
      });
    }

    return { success: false, error: errorMessage };
  }
}
