/**
 * Inngest Job: Randevu Hatırlatma Otomasyonu
 * Saatlik cron: her saat başı
 * Önümüzdeki 25 saat içindeki CONFIRMED randevular için hatırlatma gönderir.
 * 24 saat ve 2 saat öncesi hatırlatma — idempotent (tekrar gönderim yok)
 */

import { inngest } from "../client";
import { prisma } from "@repo/database";
import { dispatchWhatsApp, dispatchSms } from "@/lib/notifications/dispatch";
import { Resend } from "resend";
import * as Sentry from "@sentry/nextjs";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

export const appointmentReminderFunction = inngest.createFunction(
  {
    id: "appointment-reminder",
    name: "Randevu Hatırlatma",
    retries: 3,
    triggers: [{ cron: "0 * * * *" }],
  },
  async ({ step }: { step: any }) => {
    const now = new Date();
    const twentyFiveHoursLater = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // 5.1 Önümüzdeki 25 saat içindeki CONFIRMED randevuları sorgula
    const appointments = await step.run("fetch-appointments", async () => {
      return prisma.appointment.findMany({
        where: {
          status: "CONFIRMED",
          deletedAt: null,
          appointmentDate: {
            gte: now,
            lte: twentyFiveHoursLater,
          },
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
              phone: true,
              email: true,
            },
          },
          vehicle: {
            select: { plate: true },
          },
          location: {
            select: { name: true, address: true },
          },
          tenant: {
            select: { id: true, name: true, phone: true, email: true },
          },
        },
      });
    });

    if (appointments.length === 0) {
      return { processed: 0, reason: "Hatırlatılacak randevu yok" };
    }

    let sent24h = 0;
    let sent2h = 0;
    let failed = 0;

    for (const appointment of appointments) {
      const appointmentDateTime = new Date(
        `${appointment.appointmentDate.toISOString().split("T")[0]}T${appointment.appointmentTime}:00`
      );
      const hoursUntil =
        (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      const customerName = appointment.customer?.companyName ||
        [appointment.customer?.firstName, appointment.customer?.lastName]
          .filter(Boolean)
          .join(" ") ||
        "Müşteri";

      const variables = {
        musteriAdi: customerName,
        aracPlaka: appointment.vehicle?.plate ?? "",
        randevuTarihi: appointment.appointmentDate.toLocaleDateString("tr-TR"),
        randevuSaati: appointment.appointmentTime,
        adres: appointment.location?.address ?? appointment.location?.name ?? "",
      };

      // 5.2 24 saat hatırlatma (22-26 saat arası)
      if (hoursUntil >= 22 && hoursUntil <= 26) {
        await step.run(`reminder-24h-${appointment.id}`, async () => {
          try {
            // 5.5 İdempotans: daha önce gönderildi mi?
            const existing = await prisma.notification.findFirst({
              where: {
                tenantId: appointment.tenantId,
                customerId: appointment.customerId,
                reminderType: "24H",
                appointmentId: appointment.id,
              },
            });

            if (existing) return; // Zaten gönderildi

            const message = `Sayın ${customerName}, yarın ${appointment.appointmentDate.toLocaleDateString("tr-TR")} tarihinde saat ${appointment.appointmentTime} randevunuz bulunmaktadır.${appointment.vehicle?.plate ? ` Araç: ${appointment.vehicle.plate}` : ""}`;

            // 5.4 WhatsApp varsa WhatsApp, yoksa SMS
            const hasWhatsApp = await prisma.notificationProvider.findFirst({
              where: { tenantId: appointment.tenantId, type: "WHATSAPP", isActive: true },
            });

            if (hasWhatsApp && appointment.customer?.phone) {
              await dispatchWhatsApp({
                to: appointment.customer.phone,
                body: message,
                tenantId: appointment.tenantId,
                customerId: appointment.customerId,
              });
            } else if (appointment.customer?.phone) {
              await dispatchSms({
                to: appointment.customer.phone,
                body: message,
                tenantId: appointment.tenantId,
                customerId: appointment.customerId,
              });
            }

            // Notification kaydı oluştur (idempotans için)
            await prisma.notification.create({
              data: {
                tenantId: appointment.tenantId,
                customerId: appointment.customerId,
                type: hasWhatsApp ? "WHATSAPP" : "SMS",
                channel: hasWhatsApp ? "whatsapp" : "sms",
                recipient: appointment.customer?.phone ?? "",
                body: message,
                status: "SENT",
                sentAt: new Date(),
                reminderType: "24H",
                appointmentId: appointment.id,
              },
            });

            sent24h++;
          } catch (err) {
            failed++;
            Sentry.captureException(err, {
              tags: { module: "appointment-reminder-24h" },
              extra: { appointmentId: appointment.id },
            });
          }
        });
      }

      // 5.3 2 saat hatırlatma (1.5-2.5 saat arası)
      if (hoursUntil >= 1.5 && hoursUntil <= 2.5) {
        await step.run(`reminder-2h-${appointment.id}`, async () => {
          try {
            // 5.5 İdempotans kontrolü
            const existing = await prisma.notification.findFirst({
              where: {
                tenantId: appointment.tenantId,
                customerId: appointment.customerId,
                reminderType: "2H",
                appointmentId: appointment.id,
              },
            });

            if (existing) return;

            const message = `Sayın ${customerName}, bugün saat ${appointment.appointmentTime} randevunuz 2 saat sonra.${appointment.vehicle?.plate ? ` Araç: ${appointment.vehicle.plate}` : ""}`;

            const hasWhatsApp = await prisma.notificationProvider.findFirst({
              where: { tenantId: appointment.tenantId, type: "WHATSAPP", isActive: true },
            });

            if (hasWhatsApp && appointment.customer?.phone) {
              await dispatchWhatsApp({
                to: appointment.customer.phone,
                body: message,
                tenantId: appointment.tenantId,
                customerId: appointment.customerId,
              });
            } else if (appointment.customer?.phone) {
              await dispatchSms({
                to: appointment.customer.phone,
                body: message,
                tenantId: appointment.tenantId,
                customerId: appointment.customerId,
              });
            }

            await prisma.notification.create({
              data: {
                tenantId: appointment.tenantId,
                customerId: appointment.customerId,
                type: hasWhatsApp ? "WHATSAPP" : "SMS",
                channel: hasWhatsApp ? "whatsapp" : "sms",
                recipient: appointment.customer?.phone ?? "",
                body: message,
                status: "SENT",
                sentAt: new Date(),
                reminderType: "2H",
                appointmentId: appointment.id,
              },
            });

            sent2h++;
          } catch (err) {
            failed++;
            Sentry.captureException(err, {
              tags: { module: "appointment-reminder-2h" },
              extra: { appointmentId: appointment.id },
            });
          }
        });
      }
    }

    // 5.6 Tüm denemeler başarısız olursa tenant admin'e e-posta
    if (failed > 0 && sent24h === 0 && sent2h === 0) {
      const tenantIds = Array.from<string>(new Set(appointments.map((a: any) => String(a.tenantId))));
      for (const tenantId of tenantIds) {
        const admins = await prisma.user.findMany({
          where: { tenantId, role: "TENANT_ADMIN", isActive: true },
          select: { email: true },
        });

        for (const admin of admins) {
          if (admin.email) {
            await getResend().emails.send({
              from: process.env.RESEND_FROM_EMAIL ?? "noreply@msotoservis.com",
              to: admin.email,
              subject: "Randevu Hatırlatma Bildirimleri Gönderilemedi",
              html: `<p>Randevu hatırlatma bildirimleri gönderilemedi. Lütfen bildirim sağlayıcı ayarlarını kontrol edin.</p>`,
            });
          }
        }
      }
    }

    return {
      processed: appointments.length,
      sent24h,
      sent2h,
      failed,
    };
  }
);
