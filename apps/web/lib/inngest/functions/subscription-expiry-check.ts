import { inngest } from "../client";
import { prisma } from "@repo/database";

/**
 * Günlük Abonelik Süresi Kontrol Fonksiyonu
 * 
 * Her gün saat 02:00 UTC'de çalışır:
 * 1. Süresi dolmuş TRIAL/ACTIVE abonelikleri EXPIRED yapar
 * 2. cancelAtPeriodEnd=true olan abonelikleri dönem sonunda CANCELLED yapar
 * 3. 3 gün içinde süresi dolacak abonelikler için uyarı e-postası gönderir
 */
export const subscriptionExpiryCheckFunction = inngest.createFunction(
  {
    id: "subscription-expiry-check",
    name: "Günlük Abonelik Süresi Kontrol",
    triggers: [{ cron: "0 2 * * *" }], // Her gün saat 02:00 UTC
  },
  async ({ step }) => {
    const now = new Date();
    let expiredCount = 0;
    let cancelledCount = 0;
    let warningsSent = 0;

    // ─────────────────────────────────────────────────────────
    // 1. Süresi dolmuş abonelikleri EXPIRED yap
    // ─────────────────────────────────────────────────────────
    await step.run("expire-overdue-subscriptions", async () => {
      const expired = await prisma.subscription.findMany({
        where: {
          status: { in: ["TRIAL", "ACTIVE"] },
          currentPeriodEnd: { lt: now },
        },
        include: {
          plan: { select: { name: true } },
        },
      });

      for (const sub of expired) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "EXPIRED" },
        });

        // Tenant'ı askıya al (SUSPENDED)
        await prisma.tenant.update({
          where: { id: sub.tenantId },
          data: { status: "SUSPENDED" },
        });

        await prisma.auditLog.create({
          data: {
            level: "WARNING",
            module: "SUBSCRIPTION-AUTO",
            message: `Abonelik süresi doldu ve EXPIRED yapıldı. Plan: ${sub.plan.name}`,
            tenantId: sub.tenantId,
          },
        });

        expiredCount++;
      }
    });

    // ─────────────────────────────────────────────────────────
    // 2. İptal talebi olan abonelikleri dönem sonunda iptal et
    // ─────────────────────────────────────────────────────────
    await step.run("cancel-pending-cancellations", async () => {
      const toCancel = await prisma.subscription.findMany({
        where: {
          cancelAtPeriodEnd: true,
          status: { in: ["ACTIVE", "TRIAL"] },
          currentPeriodEnd: { lte: now },
        },
        include: {
          plan: { select: { name: true } },
        },
      });

      for (const sub of toCancel) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: "CANCELLED",
            cancelledAt: now,
          },
        });

        await prisma.auditLog.create({
          data: {
            level: "WARNING",
            module: "SUBSCRIPTION-AUTO",
            message: `Abonelik kullanıcı talebi ile iptal edildi. Plan: ${sub.plan.name}`,
            tenantId: sub.tenantId,
          },
        });

        cancelledCount++;
      }
    });

    // ─────────────────────────────────────────────────────────
    // 3. 3 gün içinde süresi dolacaklar için uyarı
    // ─────────────────────────────────────────────────────────
    await step.run("send-expiry-warnings", async () => {
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      const expiringSoon = await prisma.subscription.findMany({
        where: {
          status: { in: ["TRIAL", "ACTIVE"] },
          cancelAtPeriodEnd: false,
          currentPeriodEnd: {
            gte: now,
            lte: threeDaysFromNow,
          },
        },
        include: {
          plan: { select: { name: true } },
        },
      });

      for (const sub of expiringSoon) {
        // Admin kullanıcıları bul
        const admins = await prisma.user.findMany({
          where: {
            tenantId: sub.tenantId,
            role: { in: ["TENANT_ADMIN", "SUPER_ADMIN"] },
            isActive: true,
          },
          select: { email: true, name: true },
        });

        const daysLeft = Math.ceil(
          (new Date(sub.currentPeriodEnd!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        for (const admin of admins) {
          if (!admin.email) continue;

          await inngest.send({
            name: "notification/email.send",
            data: {
              to: admin.email,
              subject: `⏰ Aboneliğiniz ${daysLeft} gün içinde sona erecek`,
              body: `Sayın ${admin.name || "Yönetici"},\n\n"${sub.plan.name}" paketinizin süresi ${daysLeft} gün içinde (${new Date(sub.currentPeriodEnd!).toLocaleDateString("tr-TR")}) sona erecektir.\n\nHizmetlerinizin kesintiye uğramaması için lütfen aboneliğinizi yenileyin.\n\nAbonelik yönetimi: /dashboard/settings/billing\n\nTeşekkürler,\nOtoServis Ekibi`,
              tenantId: sub.tenantId,
            },
          });
          warningsSent++;
        }
      }
    });

    return {
      expiredCount,
      cancelledCount,
      warningsSent,
      checkedAt: now.toISOString(),
    };
  }
);
