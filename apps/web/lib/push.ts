/**
 * Web Push Bildirim Servisi — VAPID + web-push
 * Ortam değişkenleri: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 */

import { prisma } from "@repo/database";

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

function getWebPushConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@bstoto.com";
  return { publicKey, privateKey, subject };
}

/**
 * Belirli bir kullanıcının tüm push subscription'larına bildirim gönder
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  const { publicKey, privateKey, subject } = getWebPushConfig();

  if (!publicKey || !privateKey) {
    console.warn("[PUSH] VAPID anahtarları eksik — push bildirimi simüle edildi");
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) return { sent: 0, failed: 0 };

  const webpush = (await import("web-push")).default;
  webpush.setVapidDetails(subject, publicKey, privateKey);

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
      sent++;
    } catch (err: any) {
      // 410 Gone veya 404 — subscription geçersiz, sil
      if (err.statusCode === 410 || err.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Tenant'taki tüm kullanıcılara push bildirim gönder
 */
export async function sendPushToTenant(
  tenantId: string,
  payload: PushPayload
): Promise<void> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { tenantId },
    select: { userId: true },
    distinct: ["userId"],
  });

  await Promise.allSettled(
    subscriptions.map((s) => sendPushToUser(s.userId, payload))
  );
}
