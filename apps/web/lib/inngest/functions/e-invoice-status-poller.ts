/**
 * Inngest Job: e-Fatura Durum Sorgulayıcı
 * Saatlik cron: her saat başı
 * eInvoiceStatus = SENT olan faturaların GİB'deki durumunu sorgular.
 */

import { inngest } from "../client";
import { prisma } from "@repo/database";
import { queryEInvoiceStatusFromGIB } from "@/lib/e-invoice/integrator-client";
import * as Sentry from "@sentry/nextjs";

export const eInvoiceStatusPollerFunction = inngest.createFunction(
  {
    id: "e-invoice-status-poller",
    name: "e-Fatura Durum Sorgulayıcı",
    retries: 1,
    triggers: [{ cron: "0 * * * *" }],
  },
  async ({ step }: { step: any }) => {
    // eInvoiceStatus = SENT olan faturaları bul
    const pendingInvoices = await step.run("fetch-pending-invoices", async () => {
      return prisma.invoice.findMany({
        where: {
          eInvoiceStatus: "SENT",
          eInvoiceUUID: { not: null },
          deletedAt: null,
        },
        select: {
          id: true,
          tenantId: true,
          invoiceNumber: true,
          eInvoiceUUID: true,
        },
        take: 100, // Batch limit
      });
    });

    if (pendingInvoices.length === 0) {
      return { processed: 0, reason: "Bekleyen e-Fatura yok" };
    }

    let updated = 0;
    let rejected = 0;

    for (const invoice of pendingInvoices) {
      if (!invoice.eInvoiceUUID) continue;

      await step.run(`check-invoice-${invoice.id}`, async () => {
        try {
          const result = await queryEInvoiceStatusFromGIB(invoice.eInvoiceUUID!);

          if (!result.success || !result.status) return;

          // Durum değiştiyse güncelle
          if (result.status !== "SENT") {
            await prisma.invoice.update({
              where: { id: invoice.id },
              data: { eInvoiceStatus: result.status },
            });

            updated++;

            // REJECTED ise tenant admin'e bildirim
            if (result.status === "REJECTED") {
              rejected++;

              const admins = await prisma.user.findMany({
                where: {
                  tenantId: invoice.tenantId,
                  role: "TENANT_ADMIN",
                  isActive: true,
                },
                select: { id: true, email: true },
              });

              if (admins.length > 0) {
                await prisma.notification.createMany({
                  data: admins.map((admin) => ({
                    tenantId: invoice.tenantId,
                    type: "IN_APP" as const,
                    channel: "IN_APP",
                    recipient: admin.email ?? admin.id,
                    subject: "e-Fatura GİB Tarafından Reddedildi",
                    body: `${invoice.invoiceNumber} numaralı e-Fatura GİB tarafından reddedildi. Lütfen fatura detayını kontrol edin.`,
                    status: "PENDING" as const,
                    metadata: {
                      invoiceId: invoice.id,
                      invoiceNumber: invoice.invoiceNumber,
                      eInvoiceStatus: result.status,
                    },
                  })),
                });
              }
            }
          }
        } catch (err) {
          Sentry.captureException(err, {
            tags: { module: "e-invoice-status-poller" },
            extra: { invoiceId: invoice.id },
          });
        }
      });
    }

    return {
      processed: pendingInvoices.length,
      updated,
      rejected,
    };
  }
);
