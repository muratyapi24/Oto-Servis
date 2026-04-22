/**
 * Inngest Job: WhatsApp Mesaj Gönderici
 * notification/whatsapp.send event'ini dinler.
 * 3 retry ile çalışır.
 */

import { inngest } from "../client";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";

export const sendWhatsAppFunction = inngest.createFunction(
  {
    id: "send-whatsapp",
    name: "WhatsApp Mesaj Gönder",
    retries: 3,
    triggers: [{ event: "notification/whatsapp.send" }],
  },
  async ({ event }: { event: any }) => {
    const { to, body, tenantId, customerId, templateName, templateParams, languageCode } =
      event.data as {
        to: string;
        body: string;
        tenantId: string;
        customerId?: string;
        templateName?: string;
        templateParams?: string[];
        languageCode?: string;
      };

    const result = await sendWhatsApp({
      to,
      body,
      tenantId,
      customerId,
      templateName,
      templateParams,
      languageCode,
    });

    if (!result.success) {
      throw new Error(result.error ?? "WhatsApp gönderilemedi");
    }

    return { success: true, messageId: result.messageId, simulated: result.simulated };
  }
);
