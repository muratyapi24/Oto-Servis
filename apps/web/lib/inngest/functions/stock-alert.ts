import { inngest } from "../client";
import { prisma } from "@repo/database";

export const stockAlertFunction = inngest.createFunction(
  {
    id: "stock-alert-daily",
    name: "Günlük Kritik Stok Kontrol",
    triggers: [{ cron: "0 8 * * *" }], // Her gün saat 08:00 UTC
  },
  async ({ step }) => {
    // Tüm tenant'lar için kritik stokları bul
    const criticalParts = await prisma.part.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        partNumber: true,
        currentStock: true,
        minStockLevel: true,
        tenantId: true,
        tenant: { select: { name: true } },
      },
    });

    const alerts = criticalParts.filter(p => p.currentStock <= p.minStockLevel);

    // Tenant bazında grupla
    const grouped: Record<string, typeof alerts> = {};
    for (const alert of alerts) {
      if (!grouped[alert.tenantId]) grouped[alert.tenantId] = [];
      grouped[alert.tenantId]!.push(alert);
    }

    let totalNotifications = 0;

    for (const [tenantId, parts] of Object.entries(grouped)) {
      // Admin kullanıcıları bul
      const admins = await prisma.user.findMany({
        where: { tenantId, role: { in: ["TENANT_ADMIN", "SUPER_ADMIN"] }, isActive: true },
        select: { email: true, name: true },
      });

      if (admins.length === 0) continue;

      const partList = parts
        .map(p => `• ${p.name} (${p.partNumber}): Mevcut ${p.currentStock}, Min ${p.minStockLevel}`)
        .join("\n");

      for (const admin of admins) {
        if (!admin.email) continue;

        await inngest.send({
          name: "notification/email.send",
          data: {
            to: admin.email,
            subject: `⚠️ Kritik Stok Uyarısı - ${parts.length} ürün`,
            body: `Sayın ${admin.name || "Yönetici"},\n\nAşağıdaki ${parts.length} ürün kritik stok seviyesinin altına düşmüştür:\n\n${partList}\n\nLütfen en kısa sürede sipariş veriniz.\n\n${parts[0]?.tenant?.name ?? ""}`,
            tenantId,
          },
        });
        totalNotifications++;
      }
    }

    return {
      totalCriticalParts: alerts.length,
      tenantsAffected: Object.keys(grouped).length,
      notificationsSent: totalNotifications,
    };
  }
);
