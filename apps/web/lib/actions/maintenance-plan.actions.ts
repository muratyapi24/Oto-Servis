"use server";

import { guardTenant } from "@/lib/guards";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import { createMaintenancePlanSchema, updateMaintenancePlanSchema } from "@/lib/validations/maintenance-plan";

export async function getMaintenancePlans(vehicleId: string) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const plans = await prisma.maintenancePlan.findMany({
      where: { vehicleId, tenantId: tenantId },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const serialized = plans.map((p) => ({
      ...p,
      dueDate: p.dueDate?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      isOverdue: !p.isCompleted && p.dueDate != null && p.dueDate < now,
    }));

    return { plans: serialized };
  } catch (err) {
    console.error("Bakım planları getirme hatası:", err);
    return { error: "Bakım planları yüklenemedi." };
  }
}

export async function createMaintenancePlan(data: {
  vehicleId: string;
  title: string;
  dueDate?: string | null;
  dueMileage?: number | null;
}) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const validated = createMaintenancePlanSchema.safeParse(data);
    if (!validated.success) {
      return { error: validated.error?.errors?.[0]?.message || "Ge�ersiz veri" };
    }

    // Aracın bu tenant'a ait olduğunu doğrula
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: validated.data.vehicleId, tenantId: tenantId },
      select: { id: true },
    });
    if (!vehicle) return { error: "Araç bulunamadı." };

    const plan = await prisma.maintenancePlan.create({
      data: {
        tenantId: tenantId,
        vehicleId: validated.data.vehicleId,
        title: validated.data.title,
        dueDate: validated.data.dueDate ? new Date(validated.data.dueDate) : null,
        dueMileage: validated.data.dueMileage ?? null,
      },
    });

    revalidatePath(`/dashboard/vehicles/${validated.data.vehicleId}`);
    return { success: "Bakım planı oluşturuldu.", plan };
  } catch (err) {
    console.error("Bakım planı oluşturma hatası:", err);
    return { error: "Bakım planı oluşturulurken bir hata oluştu." };
  }
}

export async function updateMaintenancePlan(
  planId: string,
  data: { title?: string; dueDate?: string | null; dueMileage?: number | null; isCompleted?: boolean }
) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const validated = updateMaintenancePlanSchema.safeParse(data);
    if (!validated.success) {
      return { error: validated.error?.errors?.[0]?.message || "Ge�ersiz veri" };
    }

    const plan = await prisma.maintenancePlan.findUnique({
      where: { id: planId, tenantId: tenantId },
      select: { id: true, vehicleId: true },
    });
    if (!plan) return { error: "Bakım planı bulunamadı." };

    await prisma.maintenancePlan.update({
      where: { id: planId },
      data: {
        ...(validated.data.title !== undefined && { title: validated.data.title }),
        ...(validated.data.dueDate !== undefined && { dueDate: validated.data.dueDate ? new Date(validated.data.dueDate) : null }),
        ...(validated.data.dueMileage !== undefined && { dueMileage: validated.data.dueMileage }),
        ...(validated.data.isCompleted !== undefined && { isCompleted: validated.data.isCompleted }),
      },
    });

    revalidatePath(`/dashboard/vehicles/${plan.vehicleId}`);
    return { success: "Bakım planı güncellendi." };
  } catch (err) {
    console.error("Bakım planı güncelleme hatası:", err);
    return { error: "Bakım planı güncellenirken bir hata oluştu." };
  }
}

export async function deleteMaintenancePlan(planId: string) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const plan = await prisma.maintenancePlan.findUnique({
      where: { id: planId, tenantId: tenantId },
      select: { id: true, vehicleId: true },
    });
    if (!plan) return { error: "Bakım planı bulunamadı." };

    await prisma.maintenancePlan.delete({ where: { id: planId } });

    revalidatePath(`/dashboard/vehicles/${plan.vehicleId}`);
    return { success: "Bakım planı silindi." };
  } catch (err) {
    console.error("Bakım planı silme hatası:", err);
    return { error: "Bakım planı silinirken bir hata oluştu." };
  }
}
