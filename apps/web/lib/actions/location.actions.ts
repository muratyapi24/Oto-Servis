"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import { auth } from "@/auth";

export async function getLocations() {
  const session = await auth();
  if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

  const locations = await prisma.location.findMany({
    where: { tenantId: session.user.tenantId },
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
}) {
  const session = await auth();
  if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

  const tenantId = session.user.tenantId;

  // Eğer yeni lokasyon varsayılan olacaksa diğerlerini güncelle
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

  revalidatePath("/dashboard/locations");
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
  const session = await auth();
  if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

  const tenantId = session.user.tenantId;

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

  revalidatePath("/dashboard/locations");
  return { success: "Lokasyon güncellendi" };
}

export async function deleteLocation(id: string) {
  const session = await auth();
  if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

  // Varsayılan lokasyon silinemez
  const location = await prisma.location.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });

  if (location?.isDefault) {
    return { error: "Varsayılan lokasyon silinemez" };
  }

  await prisma.location.delete({ where: { id, tenantId: session.user.tenantId } });

  revalidatePath("/dashboard/locations");
  return { success: "Lokasyon silindi" };
}

export async function getConsolidatedReport() {
  const session = await auth();
  if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

  const tenantId = session.user.tenantId;

  const locations = await prisma.location.findMany({
    where: { tenantId, isActive: true },
    include: {
      _count: {
        select: { serviceOrders: true, appointments: true },
      },
    },
  });

  // Her lokasyon için gelir hesapla
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
