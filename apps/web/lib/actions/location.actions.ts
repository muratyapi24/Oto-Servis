"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import { guardTenantRole, guardTenant } from "@/lib/guards";
import { checkFeature, checkLimit } from "@/lib/subscription-guard";

function revalidateLocationPaths() {
  revalidatePath("/dashboard/settings/locations");
  revalidatePath("/dashboard/locations");
}

export async function getLocations() {
  const g = await guardTenant();
  if ("error" in g) return g;
  const { tenantId } = g;

  const locations = await prisma.location.findMany({
    where: { tenantId },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    include: {
      _count: {
        select: { serviceOrders: true, appointments: true },
      },
    },
  });

  return { locations };
}

export async function createLocation(data: {
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  isDefault?: boolean;
}): Promise<{ error?: string; success?: string; locationId?: string }> {
  const g = await guardTenantRole(["TENANT_ADMIN"]);
  if ("error" in g) return g as never;
  const { tenantId } = g;

  // Çoklu şube özelliği kontrolü (tek şube planlarında limit var)
  const existing = await prisma.location.count({ where: { tenantId, isActive: true } });
  if (existing >= 1) {
    const featureCheck = await checkFeature(tenantId, "multiLocation");
    if (!featureCheck.allowed) {
      return { error: featureCheck.message ?? "Planınız tek lokasyon destekliyor. Çoklu şube için planınızı yükseltin." };
    }
  }
  const limitCheck = await checkLimit(tenantId, "maxLocations");
  if (!limitCheck.allowed) {
    return { error: limitCheck.message ?? "Lokasyon limitinize ulaştınız." };
  }

  if (data.isDefault) {
    await prisma.location.updateMany({
      where: { tenantId },
      data: { isDefault: false },
    });
  }

  const location = await prisma.location.create({
    data: {
      tenantId,
      name: data.name,
      address: data.address ?? null,
      city: data.city ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      isDefault: data.isDefault ?? false,
    },
  });

  revalidateLocationPaths();
  return { success: "Lokasyon oluşturuldu", locationId: location.id };
}

export async function updateLocation(
  id: string,
  data: {
    name?: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
    isActive?: boolean;
    isDefault?: boolean;
  }
) {
  const g = await guardTenantRole(["TENANT_ADMIN"]);
  if ("error" in g) return g as never;
  const { tenantId } = g;

  if (data.isDefault) {
    await prisma.location.updateMany({
      where: { tenantId, id: { not: id } },
      data: { isDefault: false },
    });
  }

  await prisma.location.update({
    where: { id, tenantId },
    data,
  });

  revalidateLocationPaths();
  return { success: "Lokasyon güncellendi" };
}

export async function deleteLocation(id: string) {
  const g = await guardTenantRole(["TENANT_ADMIN"]);
  if ("error" in g) return g as never;
  const { tenantId } = g;

  const location = await prisma.location.findFirst({
    where: { id, tenantId },
  });

  if (location?.isDefault) {
    return { error: "Varsayılan lokasyon silinemez" };
  }

  await prisma.location.delete({ where: { id, tenantId } });

  revalidateLocationPaths();
  return { success: "Lokasyon silindi" };
}

export async function getConsolidatedReport() {
  const g = await guardTenantRole(["TENANT_ADMIN", "ACCOUNTANT"]);
  if ("error" in g) return g as never;
  const { tenantId } = g;

  const locations = await prisma.location.findMany({
    where: { tenantId, isActive: true },
    include: {
      _count: {
        select: { serviceOrders: true, appointments: true },
      },
    },
  });

  const locationReports = await Promise.all(
    locations.map(async (loc) => {
      const revenue = await prisma.payment.aggregate({
        where: {
          tenantId,
          paymentType: "INCOMING",
          serviceOrder: { locationId: loc.id },
        },
        _sum: { amount: true },
      });

      return {
        id: loc.id,
        name: loc.name,
        city: loc.city,
        serviceOrderCount: loc._count.serviceOrders,
        appointmentCount: loc._count.appointments,
        totalRevenue: Number(revenue._sum.amount ?? 0),
      };
    })
  );

  const totals = locationReports.reduce(
    (acc, loc) => ({
      serviceOrderCount: acc.serviceOrderCount + loc.serviceOrderCount,
      appointmentCount: acc.appointmentCount + loc.appointmentCount,
      totalRevenue: acc.totalRevenue + loc.totalRevenue,
    }),
    { serviceOrderCount: 0, appointmentCount: 0, totalRevenue: 0 }
  );

  return { locations: locationReports, totals };
}
