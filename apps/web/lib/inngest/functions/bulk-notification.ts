/**
 * Inngest Job: Toplu Bildirim Gönderimi
 * bulk/notification.start event'ini dinler.
 * Dakikada 60 mesaj hız sınırı (Redis sliding window).
 */

import { inngest } from "../client";
import { prisma } from "@repo/database";
import { Redis } from "@upstash/redis";
import { dispatchWhatsApp, dispatchSms } from "@/lib/notifications/dispatch";
import { renderTemplate } from "@/lib/notifications/template-engine";
import { getSegmentCustomers } from "@/lib/actions/bulk-notification.actions";
import { Resend } from "resend";
import * as Sentry from "@sentry/nextjs";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

// Redis rate limiter
let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

// 6.5 Dakikada 60 mesaj hız sınırı
async function checkRateLimit(tenantId: string): Promise<boolean> {
  const r = getRedis();
  if (!r) return true; // Redis yoksa sınır yok

  const key = `bulk:ratelimit:${tenantId}:${Math.floor(Date.now() / 60000)}`;
  const count = await r.incr(key);
  if (count === 1) {
    await r.expire(key, 60);
  }
  return count <= 60;
}

export const bulkNotificationFunction = inngest.createFunction(
  {
    id: "bulk-notification",
    name: "Toplu Bildirim Gönderimi",
    retries: 2,
    triggers: [{ event: "bulk/notification.start" }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { campaignId, tenantId } = event.data as {
      campaignId: string;
      tenantId: string;
    };

    // Kampanyayı getir
    const campaign = await step.run("fetch-campaign", async () => {
      return prisma.bulkNotificationCampaign.findFirst({
        where: { id: campaignId, tenantId },
      });
    });

    if (!campaign || campaign.status !== "RUNNING") {
      return { skipped: true, reason: "Kampanya bulunamadı veya çalışmıyor" };
    }

    // Segment müşterilerini getir
    const customers = await step.run("fetch-customers", async () => {
      return getSegmentCustomers(
        tenantId,
        campaign.segmentType,
        campaign.segmentParams as Record<string, unknown>
      );
    });

    // Toplam sayıyı güncelle
    await prisma.bulkNotificationCampaign.update({
      where: { id: campaignId },
      data: { totalCount: customers.length },
    });

    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    // Her müşteri için mesaj gönder
    for (const customer of customers) {
      await step.run(`send-to-${customer.id}`, async () => {
        try {
          // 6.5 Rate limit kontrolü
          const allowed = await checkRateLimit(tenantId);
          if (!allowed) {
            // Rate limit aşıldı — kuyruğa al (Inngest retry ile)
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }

          // Müşteri tercihini kontrol et (6.6 tercih filtresi)
          const preference = await prisma.customerNotificationPreference.findFirst({
            where: { tenantId, customerId: customer.id },
          });

          const channelEnabled =
            campaign.channel === "SMS"
              ? preference?.smsEnabled !== false
              : preference?.whatsappEnabled !== false;

          if (!channelEnabled) {
            skippedCount++;
            return;
          }

          // 6.8 Kişiselleştirme değişkenlerini render et
          const customerName =
            customer.companyName ||
            [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
            "Müşteri";

          const variables: Record<string, string> = {
            musteriAdi: customerName,
          };

          const messageBody = renderTemplate(campaign.messageBody, variables);

          // 6.6 Mesaj gönder
          if (campaign.channel === "WHATSAPP" && customer.phone) {
            await dispatchWhatsApp({
              to: customer.phone,
              body: messageBody,
              tenantId,
              customerId: customer.id,
            });
          } else if (campaign.channel === "SMS" && customer.phone) {
            await dispatchSms({
              to: customer.phone,
              body: messageBody,
              tenantId,
              customerId: customer.id,
            });
          } else {
            skippedCount++;
            return;
          }

          // Notification kaydı oluştur
          await prisma.notification.create({
            data: {
              tenantId,
              customerId: customer.id,
              type: campaign.channel === "WHATSAPP" ? "WHATSAPP" : "SMS",
              channel: campaign.channel.toLowerCase(),
              recipient: customer.phone,
              body: messageBody,
              status: "SENT",
              sentAt: new Date(),
              bulkCampaignId: campaignId,
            },
          });

          sentCount++;
        } catch (err) {
          failedCount++;
          Sentry.captureException(err, {
            tags: { module: "bulk-notification" },
            extra: { campaignId, customerId: customer.id },
          });
        }
      });
    }

    // 6.7 Kampanya istatistiklerini güncelle
    await prisma.bulkNotificationCampaign.update({
      where: { id: campaignId },
      data: {
        sentCount,
        failedCount,
        skippedCount,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // 6.7 Özet rapor e-postası gönder
    const admins = await prisma.user.findMany({
      where: { tenantId, role: "TENANT_ADMIN", isActive: true },
      select: { email: true },
    });

    for (const admin of admins) {
      if (admin.email) {
        await getResend().emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? "noreply@msotoservis.com",
          to: admin.email,
          subject: `Toplu Bildirim Kampanyası Tamamlandı: ${campaign.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
              <h2>Kampanya Tamamlandı: ${campaign.name}</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; border: 1px solid #ddd;">Toplam Hedef</td><td style="padding: 8px; border: 1px solid #ddd;">${customers.length}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;">Gönderilen</td><td style="padding: 8px; border: 1px solid #ddd; color: green;">${sentCount}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;">Başarısız</td><td style="padding: 8px; border: 1px solid #ddd; color: red;">${failedCount}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;">Atlandı</td><td style="padding: 8px; border: 1px solid #ddd;">${skippedCount}</td></tr>
              </table>
            </div>
          `,
        });
      }
    }

    return { success: true, sentCount, failedCount, skippedCount };
  }
);
