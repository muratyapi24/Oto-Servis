import { inngest } from "../client";
import { prisma } from "@repo/database";

export const maintenanceReminderFunction = inngest.createFunction(
  {
    id: "maintenance-reminder",
    name: "Bakım Hatırlatma (Günlük)",
    triggers: [{ cron: "0 9 * * *" }], // Her gün 09:00 UTC
  },
  async ({ step }: { step: any }) => {
    const today = new Date();
    const reminderDate = new Date(today);
    reminderDate.setDate(reminderDate.getDate() + 7); // 7 gün sonrası

    // nextMaintenanceDate'i 7 gün içinde olan araçları bul
    const vehicles = await prisma.vehicle.findMany({
      where: {
        deletedAt: null,
        nextMaintenanceDate: {
          gte: today,
          lte: reminderDate,
        },
      },
      include: {
        customer: { select: { phone: true, email: true, firstName: true, lastName: true, companyName: true, type: true } },
        tenant: { select: { id: true } },
      },
    });

    let sent = 0;
    for (const vehicle of vehicles) {
      const customerName =
        vehicle.customer.type === "CORPORATE"
          ? vehicle.customer.companyName ?? "Müşteri"
          : `${vehicle.customer.firstName ?? ""} ${vehicle.customer.lastName ?? ""}`.trim();

      // SMS gönder
      if (vehicle.customer.phone) {
        await inngest.send({
          name: "notification/sms.send",
          data: {
            to: vehicle.customer.phone,
            body: `Sayın ${customerName}, ${vehicle.plate} plakalı aracınızın bakım zamanı yaklaşıyor. Randevu almak için bizi arayın.`,
            tenantId: vehicle.tenant.id,
          },
        });
        sent++;
      }
    }

    return { processed: vehicles.length, sent };
  }
);
