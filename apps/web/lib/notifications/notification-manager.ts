/**
 * Bildirim Yöneticisi
 * Kanal yönlendirme, fallback ve orkestrasyon katmanı.
 * Öncelik sırası: WhatsApp → SMS → Email
 */

import { prisma } from "@repo/database";
import * as Sentry from "@sentry/nextjs";
import { resolveTemplate, type TemplateType, type TemplateChannel } from "./template-engine";
import { dispatchWhatsApp, dispatchSms, dispatchEmail } from "./dispatch";

// ---------------------------------------------------------------------------
// 4.1 Tipler
// ---------------------------------------------------------------------------

export interface NotificationRequest {
  tenantId: string;
  customerId: string;
  type: TemplateType;
  variables: Record<string, string>;
  forceChannel?: "SMS" | "WHATSAPP" | "EMAIL";
}

export interface NotificationResult {
  channel: string;
  status: "SENT" | "SKIPPED" | "FAILED";
  notificationId?: string;
}

// ---------------------------------------------------------------------------
// 4.2 resolveChannel — Kanal seçim mantığı
// ---------------------------------------------------------------------------

/**
 * Müşteri tercihlerine ve aktif sağlayıcılara göre kanal seçer.
 * Öncelik: WhatsApp → SMS → Email
 * Tüm kanallar kapalıysa null döner.
 */
async function resolveChannel(
  tenantId: string,
  customerId: string
): Promise<"SMS" | "WHATSAPP" | "EMAIL" | null> {
  // Müşteri tercihlerini al
  const preference = await prisma.customerNotificationPreference.findFirst({
    where: { tenantId, customerId },
  });

  // Aktif sağlayıcıları al
  const providers = await prisma.notificationProvider.findMany({
    where: { tenantId, isActive: true },
    select: { type: true, provider: true },
  });

  const hasWhatsApp = providers.some((p) => p.type === "WHATSAPP");
  const hasSms = providers.some((p) => p.type === "SMS");
  const hasEmail = true; // Email her zaman mevcut (Resend)

  // Tercih yoksa varsayılan sıra
  if (!preference) {
    if (hasWhatsApp) return "WHATSAPP";
    if (hasSms) return "SMS";
    if (hasEmail) return "EMAIL";
    return null;
  }

  // Tercih edilen kanal önce dene
  const preferredChannel = preference.preferredChannel as "SMS" | "WHATSAPP" | "EMAIL";

  if (preferredChannel === "WHATSAPP" && preference.whatsappEnabled && hasWhatsApp) {
    return "WHATSAPP";
  }
  if (preferredChannel === "SMS" && preference.smsEnabled && hasSms) {
    return "SMS";
  }
  if (preferredChannel === "EMAIL" && preference.emailEnabled && hasEmail) {
    return "EMAIL";
  }

  // Fallback sırası: WhatsApp → SMS → Email
  if (preference.whatsappEnabled && hasWhatsApp) return "WHATSAPP";
  if (preference.smsEnabled && hasSms) return "SMS";
  if (preference.emailEnabled && hasEmail) return "EMAIL";

  return null;
}

// ---------------------------------------------------------------------------
// 4.3 sendNotification — Ana orkestrasyon fonksiyonu
// ---------------------------------------------------------------------------

export async function sendNotification(
  request: NotificationRequest
): Promise<NotificationResult> {
  const { tenantId, customerId, type, variables, forceChannel } = request;

  try {
    // Kanal çözümle
    const channel = forceChannel ?? (await resolveChannel(tenantId, customerId));

    if (!channel) {
      // Tüm kanallar kapalı — SKIPPED kaydet
      await prisma.notification.create({
        data: {
          tenantId,
          customerId,
          type: "IN_APP",
          channel: "SKIPPED",
          recipient: customerId,
          body: "Tüm bildirim kanalları devre dışı.",
          status: "SKIPPED",
        },
      });

      return { channel: "SKIPPED", status: "SKIPPED" };
    }

    // Müşteri bilgilerini al
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      select: { phone: true, email: true },
    });

    // Şablon render et
    const messageBody = await resolveTemplate({
      tenantId,
      type,
      channel: channel as TemplateChannel,
      variables,
    });

    // İlgili dispatch fonksiyonunu çağır
    if (channel === "WHATSAPP" && customer?.phone) {
      await dispatchWhatsApp({
        to: customer.phone,
        body: messageBody,
        tenantId,
        customerId,
      });
    } else if (channel === "SMS" && customer?.phone) {
      await dispatchSms({
        to: customer.phone,
        body: messageBody,
        tenantId,
        customerId,
      });
    } else if (channel === "EMAIL" && customer?.email) {
      await dispatchEmail({
        to: customer.email,
        subject: `MS Oto Servis Bildirimi`,
        html: `<p>${messageBody}</p>`,
        tenantId,
        customerId,
      });
    } else {
      // Kanal için gerekli iletişim bilgisi yok
      return { channel, status: "SKIPPED" };
    }

    return { channel, status: "SENT" };
  } catch (err: unknown) {
    Sentry.captureException(err, {
      tags: { module: "notification-manager" },
      extra: { tenantId, customerId, type },
    });
    return { channel: "UNKNOWN", status: "FAILED" };
  }
}
