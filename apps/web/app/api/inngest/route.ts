import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { sendEmailFunction } from "@/lib/inngest/functions/send-email";
import { sendSmsFunction } from "@/lib/inngest/functions/send-sms";
import { maintenanceReminderFunction } from "@/lib/inngest/functions/maintenance-reminder";
import { overdueInvoiceReminderFunction } from "@/lib/inngest/functions/overdue-invoice-reminder";
import { stockAlertFunction } from "@/lib/inngest/functions/stock-alert";
import { stockReorderCheckFunction } from "@/lib/inngest/functions/stock-reorder-check";
import { invoicePdfGeneratorFunction } from "@/lib/inngest/functions/invoice-pdf-generator";
import { checkPaymentReminderFunction } from "@/lib/inngest/functions/check-payment-reminder";
import { eInvoiceStatusPollerFunction } from "@/lib/inngest/functions/e-invoice-status-poller";
import { parasutSyncFunction } from "@/lib/inngest/functions/parasut-sync";
import { sendWhatsAppFunction } from "@/lib/inngest/functions/send-whatsapp";
import { appointmentReminderFunction } from "@/lib/inngest/functions/appointment-reminder";
import { bulkNotificationFunction } from "@/lib/inngest/functions/bulk-notification";
import { subscriptionExpiryCheckFunction } from "@/lib/inngest/functions/subscription-expiry-check";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendEmailFunction,
    sendSmsFunction,
    maintenanceReminderFunction,
    overdueInvoiceReminderFunction,
    stockAlertFunction,
    stockReorderCheckFunction,
    invoicePdfGeneratorFunction,
    checkPaymentReminderFunction,
    eInvoiceStatusPollerFunction,
    parasutSyncFunction,
    sendWhatsAppFunction,
    appointmentReminderFunction,
    bulkNotificationFunction,
    subscriptionExpiryCheckFunction,
  ],
  signingKey: process.env.INNGEST_SIGNING_KEY,
} as any);
