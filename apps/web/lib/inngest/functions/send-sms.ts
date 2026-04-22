import { inngest } from "../client";
import { sendSms } from "@/lib/notifications/sms";

export const sendSmsFunction = inngest.createFunction(
  {
    id: "send-sms",
    name: "SMS Gönder",
    retries: 3,
    triggers: [{ event: "notification/sms.send" }],
  },
  async ({ event, attempt }) => {
    const { to, body, tenantId, customerId } = event.data;

    const result = await sendSms({ to, body, tenantId, customerId });

    if (!result.success) {
      throw new Error(`SMS gönderilemedi (deneme ${attempt}): ${result.error}`);
    }

    return { success: true, to, attempt };
  }
);
