"use server";

import { prisma } from "@repo/database";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import dayjs from "dayjs";

// ─────────────────────────────────────────────────────────────
// 1) Yaklaşan / Gecikmiş Bakım Planlarını Toplu Listele
// ─────────────────────────────────────────────────────────────

export async function getUpcomingMaintenances() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };
    const tenantId = session.user.tenantId;

    const now = new Date();
    const thirtyDaysLater = dayjs().add(30, "day").toDate();

    // Tamamlanmamış tüm bakım planlarını çek (araç + müşteri bilgisiyle)
    const plans = await prisma.maintenancePlan.findMany({
      where: {
        tenantId,
        isCompleted: false,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            plate: true,
            brand: true,
            model: true,
            year: true,
            mileage: true,
            customerId: true,
            customer: {
              select: {
                id: true,
                type: true,
                firstName: true,
                lastName: true,
                companyName: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    // Her planı kategorize et: gecikmiş / yaklaşan / ileride
    const serialized = plans.map((p) => {
      const isOverdue = p.dueDate != null && p.dueDate < now;
      const isUpcoming = p.dueDate != null && p.dueDate >= now && p.dueDate <= thirtyDaysLater;
      const isMileageDue = p.dueMileage != null && p.vehicle.mileage >= p.dueMileage;

      const customerName =
        p.vehicle.customer.type === "CORPORATE"
          ? p.vehicle.customer.companyName || "Kurumsal"
          : `${p.vehicle.customer.firstName || ""} ${p.vehicle.customer.lastName || ""}`.trim();

      return {
        id: p.id,
        title: p.title,
        dueDate: p.dueDate?.toISOString() ?? null,
        dueMileage: p.dueMileage,
        isOverdue,
        isUpcoming,
        isMileageDue,
        vehicleId: p.vehicle.id,
        plate: p.vehicle.plate,
        vehicleName: `${p.vehicle.brand} ${p.vehicle.model}`,
        vehicleYear: p.vehicle.year,
        currentMileage: p.vehicle.mileage,
        customerId: p.vehicle.customer.id,
        customerName,
        customerPhone: p.vehicle.customer.phone,
        createdAt: p.createdAt.toISOString(),
      };
    });

    // İstatistikler
    const overdueCount = serialized.filter((s) => s.isOverdue || s.isMileageDue).length;
    const upcomingCount = serialized.filter((s) => s.isUpcoming && !s.isOverdue).length;
    const totalPending = serialized.length;

    return {
      plans: serialized,
      stats: { overdueCount, upcomingCount, totalPending },
    };
  } catch (err: any) {
    console.error("getUpcomingMaintenances error:", err);
    return { error: "Bakım planları alınamadı: " + err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// 2) Bakım Hatırlatma SMS'i Gönder
// ─────────────────────────────────────────────────────────────

export async function sendMaintenanceReminderSms(
  planId: string
): Promise<{ success?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };
    const tenantId = session.user.tenantId;

    const plan = await prisma.maintenancePlan.findFirst({
      where: { id: planId, tenantId },
      include: {
        vehicle: {
          select: {
            plate: true,
            brand: true,
            model: true,
            mileage: true,
            customer: {
              select: {
                id: true,
                type: true,
                firstName: true,
                lastName: true,
                companyName: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!plan) return { error: "Bakım planı bulunamadı." };
    if (!plan.vehicle.customer.phone) return { error: "Müşterinin telefon numarası kayıtlı değil." };

    const customerName =
      plan.vehicle.customer.type === "CORPORATE"
        ? plan.vehicle.customer.companyName || "Değerli Müşterimiz"
        : `${plan.vehicle.customer.firstName || ""} ${plan.vehicle.customer.lastName || ""}`.trim() || "Değerli Müşterimiz";

    const vehicleInfo = `${plan.vehicle.plate} (${plan.vehicle.brand} ${plan.vehicle.model})`;

    // Tarih veya KM bazlı mesaj
    let detail = "";
    if (plan.dueDate) {
      detail = `Planlanan bakım tarihi: ${dayjs(plan.dueDate).format("DD.MM.YYYY")}.`;
    }
    if (plan.dueMileage) {
      detail += ` Hedef KM: ${plan.dueMileage.toLocaleString("tr-TR")} km (Mevcut: ${plan.vehicle.mileage.toLocaleString("tr-TR")} km).`;
    }

    const message = `Sayın ${customerName}, ${vehicleInfo} plakalı aracınızın "${plan.title}" bakımı yaklaşmaktadır. ${detail} Randevu almak için bizi arayabilirsiniz. İyi günler dileriz.`;

    const { sendSms } = await import("@/lib/notifications/sms");
    const result = await sendSms({
      to: plan.vehicle.customer.phone,
      body: message,
      tenantId,
      customerId: plan.vehicle.customer.id,
    });

    if (result.success) {
      return { success: `${customerName} müşterisine bakım hatırlatma SMS'i gönderildi.` };
    } else {
      return { error: result.error || "SMS gönderilemedi." };
    }
  } catch (err: any) {
    console.error("sendMaintenanceReminderSms error:", err);
    return { error: "SMS gönderilirken hata: " + err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// 3) Toplu Hatırlatma SMS (Gecikmiş veya Yaklaşan tüm planlar)
// ─────────────────────────────────────────────────────────────

export async function sendBulkMaintenanceReminders(): Promise<{ success?: string; sentCount?: number; failCount?: number; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

    const result = await getUpcomingMaintenances();
    if (result.error || !result.plans) return { error: result.error || "Veri alınamadı" };

    // Gecikmiş ve yaklaşan planları filtrele
    const actionable = result.plans.filter((p) => p.isOverdue || p.isUpcoming || p.isMileageDue);

    if (actionable.length === 0) {
      return { success: "Gönderilecek bakım hatırlatması bulunamadı.", sentCount: 0, failCount: 0 };
    }

    let sentCount = 0;
    let failCount = 0;

    for (const plan of actionable) {
      const res = await sendMaintenanceReminderSms(plan.id);
      if (res.success) sentCount++;
      else failCount++;
    }

    return {
      success: `Toplu bakım hatırlatması tamamlandı: ${sentCount} başarılı, ${failCount} başarısız.`,
      sentCount,
      failCount,
    };
  } catch (err: any) {
    console.error("sendBulkMaintenanceReminders error:", err);
    return { error: "Toplu gönderim hatası: " + err.message };
  }
}
