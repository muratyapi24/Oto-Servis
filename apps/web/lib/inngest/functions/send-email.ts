import { inngest } from "../client";
import { sendEmail } from "@/lib/notifications/email";

export const sendEmailFunction = inngest.createFunction(
  {
    id: "send-email",
    name: "E-posta Gönder",
    retries: 3,
    triggers: [{ event: "notification/email.send" }],
  },
  async ({ event, attempt }) => {
    const { to, subject, html, tenantId, customerId } = event.data;

    const result = await sendEmail({ to, subject, html, tenantId, customerId });

    if (!result.success) {
      // Retry için hata fırlat — Inngest exponential backoff uygular
      throw new Error(`E-posta gönderilemedi (deneme ${attempt}): ${result.error}`);
    }

    return { success: true, to, attempt };
  }
);
