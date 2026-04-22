"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import { auth } from "@/auth";
import { CreateMechanicInput, createMechanicSchema } from "@/lib/validations/mechanics";
import { checkLimit } from "@/lib/subscription-guard";

export async function createMechanic(data: CreateMechanicInput) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { error: "Yetkisiz erişim." };
    }

    // Subscription Guard — Personel limit kontrolü
    const limitCheck = await checkLimit(session.user.tenantId, "maxMechanics");
    if (!limitCheck.allowed) {
      return { error: limitCheck.message || "Personel limitinize ulaştınız. Paketinizi yükseltin." };
    }

    const validatedData = createMechanicSchema.parse(data);

    const newMechanic = await prisma.mechanic.create({
      data: {
        tenantId: session.user.tenantId,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone || null,
        email: validatedData.email || null,
        specialties: validatedData.specialties,
        experienceYears: validatedData.experienceYears || null,
        hourlyRate: validatedData.hourlyRate || null,
        isActive: validatedData.isActive,
      },
    });

    revalidatePath("/dashboard/mechanics");
    return { success: "Usta başarıyla kaydedildi", mechanicId: newMechanic.id };
  } catch (error: any) {
    console.error("Usta kaydı hatası:", error);
    return { error: "Usta kaydedilirken bir hata oluştu." };
  }
}

export async function getMechanics() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      throw new Error("Yetkisiz erişim");
    }

    const mechanics = await prisma.mechanic.findMany({
      where: {
        tenantId: session.user.tenantId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            serviceOrders: { where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const serializedMechanics = mechanics.map(m => ({
      ...m,
      hourlyRate: m.hourlyRate ? Number(m.hourlyRate.toString()) : 0
    }));

    return { mechanics: serializedMechanics };
  } catch (error: any) {
    console.error("Ustalar getirilemedi:", error);
    return { error: "Usta listesi alınamadı." };
  }
}

export async function updateMechanic(data: any) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

    // Schema import olmadığı için data'yı güvenli varsayıp update atabiliriz ya da import ettik
    // "UpdateMechanicInput" yukarıda import edilmediyse dinamik parse yapabiliriz AMA import listesinde yok.
    // data obje olarak geliyor, id'yi extract edelim:
    const { id, ...updateData } = data;
    if(!id) return { error: "ID bulunamadı" };

    await prisma.mechanic.update({
      where: { id, tenantId: session.user.tenantId },
      data: {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        phone: updateData.phone || null,
        email: updateData.email || null,
        specialties: updateData.specialties,
        experienceYears: updateData.experienceYears || null,
        hourlyRate: updateData.hourlyRate || null,
        isActive: updateData.isActive,
      }
    });

    revalidatePath("/dashboard/mechanics");
    return { success: "Usta başarıyla güncellendi." };
  } catch (error) {
    console.error(error);
    return { error: "Güncelleme sırasında bir hata oluştu." };
  }
}

export async function deleteMechanic(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

    await prisma.mechanic.update({
      where: { id, tenantId: session.user.tenantId },
      data: { deletedAt: new Date(), isActive: false }
    });

    revalidatePath("/dashboard/mechanics");
    return { success: "Personel sistemden (Soft-Delete) başarıyla kaldırıldı." };
  } catch (err) {
    console.error(err);
    return { error: "Personel silinirken bir engel ile karşılaşıldı." };
  }
}

export async function getMechanicById(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { mechanic: null, error: "Yetkisiz erişim" };
    }

    const mechanic = await prisma.mechanic.findUnique({
      where: { id, tenantId: session.user.tenantId },
    });

    if (!mechanic || mechanic.deletedAt) {
      return { mechanic: null };
    }

    // Aktif emirler: PENDING | IN_PROGRESS
    const activeOrders = await prisma.serviceOrder.findMany({
      where: {
        assignedMechanicId: id,
        tenantId: session.user.tenantId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      include: {
        vehicle: { select: { plate: true, brand: true, model: true } },
        customer: { select: { firstName: true, lastName: true, companyName: true, type: true } },
      },
    });

    // Tamamlanan emirler: COMPLETED, receptionDate desc
    const completedOrders = await prisma.serviceOrder.findMany({
      where: {
        assignedMechanicId: id,
        tenantId: session.user.tenantId,
        status: "COMPLETED",
      },
      orderBy: { receptionDate: "desc" },
      include: {
        vehicle: { select: { plate: true, brand: true, model: true } },
      },
    });

    const serialized = {
      ...mechanic,
      hourlyRate: mechanic.hourlyRate ? Number(mechanic.hourlyRate.toString()) : null,
      activeOrders: activeOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        receptionDate: o.receptionDate,
        vehicle: o.vehicle,
        customer: o.customer,
      })),
      completedOrders: completedOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        receptionDate: o.receptionDate,
        totalAmount: Number(o.totalAmount.toString()),
        vehicle: o.vehicle,
      })),
    };

    return { mechanic: serialized };
  } catch (error: any) {
    console.error("getMechanicById hatası:", error);
    return { mechanic: null, error: "Usta bilgileri alınamadı." };
  }
}

export async function getMechanicPerformance(mechanicId: string, period: "current" | "previous") {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };
    const tenantId = session.user.tenantId;

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (period === "current") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    }

    const completedOrders = await prisma.serviceOrder.findMany({
      where: {
        tenantId,
        assignedMechanicId: mechanicId,
        status: "COMPLETED",
        actualDeliveryDate: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        orderNumber: true,
        receptionDate: true,
        actualDeliveryDate: true,
        totalAmount: true,
        items: {
          where: { itemType: "LABOR" },
          select: { totalPrice: true },
        },
      },
    });

    const completedCount = completedOrders.length;
    const totalLaborAmount = completedOrders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + Number(i.totalPrice), 0),
      0
    );

    // Ortalama tamamlama süresi (saat)
    const durationsHours = completedOrders
      .filter((o) => o.actualDeliveryDate)
      .map((o) => {
        const diff = new Date(o.actualDeliveryDate!).getTime() - new Date(o.receptionDate).getTime();
        return diff / (1000 * 60 * 60);
      });
    const avgDurationHours =
      durationsHours.length > 0
        ? durationsHours.reduce((s, d) => s + d, 0) / durationsHours.length
        : 0;

    return {
      period,
      completedCount,
      totalLaborAmount,
      avgDurationHours: Math.round(avgDurationHours * 10) / 10,
    };
  } catch (err: any) {
    console.error("getMechanicPerformance hatası:", err);
    return { error: "Performans verileri alınamadı." };
  }
}

export async function getCommissionRules(mechanicId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };
    const tenantId = session.user.tenantId;

    const rules = await prisma.commissionRule.findMany({
      where: {
        tenantId,
        ...(mechanicId ? { mechanicId } : {}),
        isActive: true,
      },
      include: { mechanic: { select: { firstName: true, lastName: true } } },
    });

    return {
      rules: rules.map((r) => ({
        ...r,
        value: Number(r.value),
        minAmount: r.minAmount ? Number(r.minAmount) : null,
        maxAmount: r.maxAmount ? Number(r.maxAmount) : null,
      })),
    };
  } catch (err: any) {
    console.error("getCommissionRules hatası:", err);
    return { error: "Komisyon kuralları alınamadı." };
  }
}

export async function createCommissionRule(data: {
  mechanicId?: string;
  ruleType: "PERCENTAGE" | "FIXED";
  value: number;
  minAmount?: number;
  maxAmount?: number;
}): Promise<{ success?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };
    const tenantId = session.user.tenantId;

    await prisma.commissionRule.create({
      data: {
        tenantId,
        mechanicId: data.mechanicId ?? null,
        ruleType: data.ruleType,
        value: data.value,
        minAmount: data.minAmount ?? null,
        maxAmount: data.maxAmount ?? null,
        isActive: true,
      },
    });

    revalidatePath("/dashboard/mechanics");
    return { success: "Komisyon kuralı oluşturuldu" };
  } catch (err: any) {
    console.error("createCommissionRule hatası:", err);
    return { error: "Komisyon kuralı oluşturulamadı." };
  }
}

export async function calculateCommission(mechanicId: string, month: Date) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };
    const tenantId = session.user.tenantId;

    const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
    const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

    const completedOrders = await prisma.serviceOrder.findMany({
      where: {
        tenantId,
        assignedMechanicId: mechanicId,
        status: "COMPLETED",
        actualDeliveryDate: { gte: startDate, lte: endDate },
      },
      include: {
        items: { where: { itemType: "LABOR" }, select: { totalPrice: true } },
      },
    });

    const totalLabor = completedOrders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + Number(i.totalPrice), 0),
      0
    );

    // Usta'ya özel kural varsa onu, yoksa genel kuralı kullan
    const rules = await prisma.commissionRule.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [{ mechanicId }, { mechanicId: null }],
      },
      orderBy: { mechanicId: "desc" }, // usta'ya özel kural önce gelsin
    });

    const rule = rules[0];
    if (!rule) return { amount: 0, breakdown: [] };

    let amount = 0;
    if (rule.ruleType === "PERCENTAGE") {
      amount = totalLabor * Number(rule.value) / 100;
      if (rule.minAmount) amount = Math.max(amount, Number(rule.minAmount));
      if (rule.maxAmount) amount = Math.min(amount, Number(rule.maxAmount));
    } else {
      amount = Number(rule.value);
    }

    return {
      amount: Math.round(amount * 100) / 100,
      breakdown: [{ ruleType: rule.ruleType, value: Number(rule.value), totalLabor, result: amount }],
    };
  } catch (err: any) {
    console.error("calculateCommission hatası:", err);
    return { error: "Komisyon hesaplanamadı." };
  }
}
