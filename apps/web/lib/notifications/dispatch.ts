/**
 * Bildirim Dispatch — Inngest üzerinden async gönderim
 * Inngest yoksa direkt senkron gönderim yapar (fallback)
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  tenantId: string;
  customerId?: string;
}

interface SmsOptions {
  to: string;
  body: string;
  tenantId: string;
  customerId?: string;
}

/**
 * E-posta gönderimini Inngest job kuyruğuna ekle
 * INNGEST_EVENT_KEY yoksa direkt gönderir
 */
export async function dispatchEmail(options: EmailOptions): Promise<void> {
  if (process.env.INNGEST_EVENT_KEY) {
    try {
      const { inngest } = await import("@/lib/inngest/client");
      await inngest.send({ name: "notification/email.send", data: options });
      return;
    } catch {
      // Inngest hatası — fallback'e geç
    }
  }
  // Direkt gönderim (fallback)
  const { sendEmail } = await import("./email");
  await sendEmail(options);
}

/**
 * SMS gönderimini Inngest job kuyruğuna ekle
 * INNGEST_EVENT_KEY yoksa direkt gönderir
 */
export async function dispatchSms(options: SmsOptions): Promise<void> {
  if (process.env.INNGEST_EVENT_KEY) {
    try {
      const { inngest } = await import("@/lib/inngest/client");
      await inngest.send({ name: "notification/sms.send", data: options });
      return;
    } catch {
      // Inngest hatası — fallback'e geç
    }
  }
  // Direkt gönderim (fallback)
  const { sendSms } = await import("./sms");
  await sendSms(options);
}

// ---------------------------------------------------------------------------
// 2.8 WhatsApp dispatch
// ---------------------------------------------------------------------------

interface WhatsAppDispatchOptions {
  to: string;
  body: string;
  tenantId: string;
  customerId?: string;
  templateName?: string;
  templateParams?: string[];
  languageCode?: string;
}

/**
 * WhatsApp gönderimini Inngest job kuyruğuna ekle
 * INNGEST_EVENT_KEY yoksa direkt gönderir
 */
export async function dispatchWhatsApp(options: WhatsAppDispatchOptions): Promise<void> {
  if (process.env.INNGEST_EVENT_KEY) {
    try {
      const { inngest } = await import("@/lib/inngest/client");
      await inngest.send({ name: "notification/whatsapp.send", data: options });
      return;
    } catch {
      // Inngest hatası — fallback'e geç
    }
  }
  // Direkt gönderim (fallback)
  const { sendWhatsApp } = await import("./whatsapp");
  await sendWhatsApp(options);
}
