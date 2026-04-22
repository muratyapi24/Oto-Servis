import { inngest } from "../client";
import { prisma } from "@repo/database";

export const overdueInvoiceReminderFunction = inngest.createFunction(
  {
    id: "overdue-invoice-reminder",
    name: "Gecikmiş Fatura Hatırlatma (Günlük)",
    triggers: [{ cron: "0 10 * * *" }], // Her gün saat 10:00 UTC
  },
  async ({ step }) => {
    const today = new Date();

    // Vadesi geçmiş, ödenmemiş (DRAFT, SENT) veya iptal edilmemiş faturaları bul. Kısmi ödenmişleri (üzerinde bakiye olan SENT) da dahil et
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        deletedAt: null,
        status: { in: ["SENT"] }, // STATUS enum değerlerini kendi yapınıza göre uyarla. Sadece SENT olanlar.
        dueDate: {
          lt: today,
        },
      },
      include: {
        customer: { select: { phone: true, email: true, firstName: true, lastName: true, companyName: true, type: true } },
        tenant: { select: { id: true, name: true } },
      },
    });

    let sent = 0;
    for (const invoice of overdueInvoices) {
      if (Number(invoice.paidAmount) >= Number(invoice.totalAmount)) continue; // Tüm bakiye kapanmışsa atla

      const customerName =
        invoice.customer?.type === "CORPORATE"
          ? invoice.customer.companyName ?? "Müşteri"
          : `${invoice.customer?.firstName ?? ""} ${invoice.customer?.lastName ?? ""}`.trim();

      const remainingAmount = Number(invoice.totalAmount) - Number(invoice.paidAmount);

      // SMS gönder (Örn. Twilio ile)
      if (invoice.customer?.phone) {
        await inngest.send({
          name: "notification/sms.send",
          data: {
            to: invoice.customer.phone,
            body: `Sayın ${customerName}, ${invoice.tenant.name} firmasına ait son ödeme tarihi geçen ${remainingAmount.toFixed(2)} TL bakiye bulunmaktadır. Lütfen ödemenizi gerçekleştiriniz.`,
            tenantId: invoice.tenant.id,
            customerId: invoice.customerId
          },
        });
        sent++;
      }
    }

    return { processed: overdueInvoices.length, sent };
  }
);
