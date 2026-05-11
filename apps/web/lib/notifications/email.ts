/**
 * E-posta Bildirim Servisi — Resend entegrasyonu
 * Ortam değişkeni: RESEND_API_KEY
 */

import { prisma } from "@repo/database";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  tenantId: string;
  customerId?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const { to, subject, html, tenantId, customerId } = options;

  // Notification kaydını PENDING olarak oluştur
  let notificationId: string | null = null;
  try {
    const notification = await prisma.notification.create({
      data: {
        tenantId,
        customerId: customerId ?? null,
        type: "EMAIL",
        channel: "resend",
        recipient: to,
        subject,
        body: html,
        status: "PENDING",
      },
    });
    notificationId = notification.id;
  } catch (dbErr) {
    console.error("Notification kaydı oluşturulamadı:", dbErr);
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("[EMAIL] RESEND_API_KEY eksik — e-posta simüle edildi:", { to, subject });
    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: "SENT", sentAt: new Date() },
      });
    }
    return { success: true };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "MS Oto Servis <noreply@bstoto.com>",
      to,
      subject,
      html,
    });

    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: "SENT", sentAt: new Date() },
      });
    }
    return { success: true };
  } catch (err: any) {
    console.error("[EMAIL] Gönderim hatası:", (err instanceof Error ? err.message : String(err)));
    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: "FAILED",
          retryCount: { increment: 1 },
          metadata: { error: (err instanceof Error ? err.message : String(err)) },
        },
      });
    }
    return { success: false, error: (err instanceof Error ? err.message : String(err)) };
  }
}
