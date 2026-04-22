/**
 * Inngest Job: Çek/Senet Vade Hatırlatıcı
 * Günlük cron: sabah 09:00
 * Vadesi 3 gün veya daha az kalan PENDING çek/senetler için TENANT_ADMIN'e bildirim gönderir.
 */

import { inngest } from "../client";
import { prisma } from "@repo/database";
import * as Sentry from "@sentry/nextjs";

export const checkPaymentReminderFunction = inngest.createFunction(
  {
    id: "check-payment-reminder",
    name: "Çek/Senet Vade Hatırlatıcı",
    retries: 2,
    triggers: [{ cron: "0 9 * * *" }],
  },
  async ({ step }: { step: any }) => {
    const now = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    // Vadesi 3 gün içinde olan PENDING çek/senetleri bul
    const upcomingChecks = await step.run("fetch-upcoming-checks", async () => {
      return prisma.checkPayment.findMany({
        where: {
          status: "PENDING",
          dueDate: {
            gte: now,
            lte: threeDaysLater,
          },
        },
        include: {
          payment: {
            include: {
              customer: {
                select: { firstName: true, lastName: true, companyName: true },
              },
              invoice: {
                select: { invoiceNumber: true },
              },
            },
          },
        },
      });
    });

    if (upcomingChecks.length === 0) {
      return { processed: 0, reason: "Vadesi yaklaşan çek/senet yok" };
    }

    // Tenant bazında grupla
    const byTenant = new Map<string, typeof upcomingChecks>();
    for (const check of upcomingChecks) {
      const tenantId = check.tenantId;
      if (!byTenant.has(tenantId)) {
        byTenant.set(tenantId, []);
      }
      byTenant.get(tenantId)!.push(check);
    }

    let totalNotifications = 0;

    for (const [tenantId, checks] of byTenant) {
      await step.run(`notify-tenant-${tenantId}`, async () => {
        try {
          // TENANT_ADMIN rolündeki kullanıcıları bul
          const admins = await prisma.user.findMany({
            where: { tenantId, role: "TENANT_ADMIN", isActive: true },
            select: { id: true, email: true },
          });

          if (admins.length === 0) return;

          // Her çek için bildirim oluştur
          for (const check of checks) {
            const dueDate = new Date(check.dueDate);
            const daysLeft = Math.ceil(
              (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            const customerName = check.payment.customer
              ? check.payment.customer.companyName ||
                [check.payment.customer.firstName, check.payment.customer.lastName]
                  .filter(Boolean)
                  .join(" ") ||
                "Müşteri"
              : "Müşteri";

            const body = `${customerName} adına ${check.checkNumber} numaralı çek/senet ${daysLeft} gün içinde vadesi dolacak. Tutar: ${Number(check.payment.amount).toLocaleString("tr-TR")} TL`;

            await prisma.notification.createMany({
              data: admins.map((admin) => ({
                tenantId,
                type: "IN_APP" as const,
                channel: "IN_APP",
                recipient: admin.email ?? admin.id,
                subject: `⚠️ Çek/Senet Vade Uyarısı — ${daysLeft} Gün`,
                body,
                status: "PENDING" as const,
                metadata: {
                  checkPaymentId: check.id,
                  checkNumber: check.checkNumber,
                  dueDate: check.dueDate,
                  daysLeft,
                  amount: Number(check.payment.amount),
                },
              })),
            });

            totalNotifications += admins.length;
          }
        } catch (err) {
          Sentry.captureException(err, {
            tags: { module: "check-payment-reminder" },
            extra: { tenantId },
          });
        }
      });
    }

    return {
      processed: upcomingChecks.length,
      tenantsAffected: byTenant.size,
      notificationsSent: totalNotifications,
    };
  }
);
