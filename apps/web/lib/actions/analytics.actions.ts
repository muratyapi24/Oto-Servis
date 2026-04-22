"use server";

import { auth } from "@/auth";
import { prisma } from "@repo/database";
import dayjs from "dayjs";

export async function getAnalyticsDashboard() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Oturum bulunamadı." };
    const tenantId = session.user.tenantId;

    const now = dayjs();
    const startOfMonth = now.startOf("month").toDate();
    const endOfMonth = now.endOf("month").toDate();
    const startOfLastMonth = now.subtract(1, "month").startOf("month").toDate();
    const endOfLastMonth = now.subtract(1, "month").endOf("month").toDate();

    // Toplam müşteri sayısı
    const totalCustomers = await prisma.customer.count({
      where: { tenantId, deletedAt: null },
    });

    // Bu ay yeni müşteriler
    const newCustomersThisMonth = await prisma.customer.count({
      where: { tenantId, deletedAt: null, createdAt: { gte: startOfMonth, lte: endOfMonth } },
    });

    // Geçen ay yeni müşteriler — kıyaslama için
    const newCustomersLastMonth = await prisma.customer.count({
      where: { tenantId, deletedAt: null, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
    });

    // Toplam araç
    const totalVehicles = await prisma.vehicle.count({
      where: { tenantId, deletedAt: null },
    });

    // Bu ay servis emirleri
    const serviceOrdersThisMonth = await prisma.serviceOrder.count({
      where: { tenantId, deletedAt: null, createdAt: { gte: startOfMonth, lte: endOfMonth } },
    });

    // Geçen ay servis emirleri
    const serviceOrdersLastMonth = await prisma.serviceOrder.count({
      where: { tenantId, deletedAt: null, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
    });

    // Tamamlanan servisler bu ay
    const completedServicesThisMonth = await prisma.serviceOrder.count({
      where: { tenantId, deletedAt: null, status: "COMPLETED", updatedAt: { gte: startOfMonth, lte: endOfMonth } },
    });

    // Aktif servisler
    const activeServices = await prisma.serviceOrder.count({
      where: { tenantId, deletedAt: null, status: { in: ["PENDING", "IN_PROGRESS", "WAITING_APPROVAL"] } },
    });

    // Bu ayki faturalar — gelir hesabı
    const monthlyInvoices = await prisma.invoice.findMany({
      where: { tenantId, deletedAt: null, issueDate: { gte: startOfMonth, lte: endOfMonth } },
      select: { totalAmount: true, paidAmount: true, status: true },
    });

    const monthlyRevenue = monthlyInvoices.reduce((acc, inv) => acc + Number(inv.totalAmount), 0);
    const monthlyCollected = monthlyInvoices.reduce((acc, inv) => acc + Number(inv.paidAmount), 0);

    // Geçen ayki gelir — kıyaslama
    const lastMonthInvoices = await prisma.invoice.findMany({
      where: { tenantId, deletedAt: null, issueDate: { gte: startOfLastMonth, lte: endOfLastMonth } },
      select: { totalAmount: true },
    });
    const lastMonthRevenue = lastMonthInvoices.reduce((acc, inv) => acc + Number(inv.totalAmount), 0);

    // Gelir değişim oranı
    const revenueChangePercent = lastMonthRevenue > 0
      ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : monthlyRevenue > 0 ? 100 : 0;

    // Stok durumu
    const totalParts = await prisma.part.count({ where: { tenantId, deletedAt: null } });
    // Low stock: currentStock <= minStockLevel (Prisma doesn't support field-to-field, use $queryRawUnsafe)
    const lowStockResult = await prisma.$queryRawUnsafe<[{count: bigint}]>(
      `SELECT COUNT(*)::int as count FROM "Part" WHERE "tenantId" = $1 AND "deletedAt" IS NULL AND "currentStock" <= "minStockLevel"`,
      tenantId
    );
    const lowStockParts = Number(lowStockResult[0]?.count || 0);

    // Randevu istatistikleri
    const appointmentsThisMonth = await prisma.appointment.count({
      where: { tenantId, deletedAt: null, appointmentDate: { gte: startOfMonth, lte: endOfMonth } },
    });

    // Personel sayısı
    const totalMechanics = await prisma.mechanic.count({
      where: { tenantId, deletedAt: null },
    });

    const activeMechanics = await prisma.mechanic.count({
      where: { tenantId, deletedAt: null, isActive: true },
    });

    // Son 6 aylık aylık gelir trendi
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = now.subtract(i, "month").startOf("month").toDate();
      const mEnd = now.subtract(i, "month").endOf("month").toDate();
      const mLabel = dayjs(mStart).format("MMM");

      const invs = await prisma.invoice.findMany({
        where: { tenantId, deletedAt: null, issueDate: { gte: mStart, lte: mEnd } },
        select: { totalAmount: true },
      });
      const total = invs.reduce((acc, inv) => acc + Number(inv.totalAmount), 0);
      monthlyTrend.push({ month: mLabel, revenue: total });
    }

    // Servis tipi dağılımı (status bazında)
    const statusDistribution = await prisma.serviceOrder.groupBy({
      by: ["status"],
      where: { tenantId, deletedAt: null },
      _count: { id: true },
    });

    const serviceDistribution = statusDistribution.map((s) => ({
      status: s.status,
      count: s._count.id,
    }));

    // Son aktiviteler (son 10)
    const recentOrders = await prisma.serviceOrder.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: {
        vehicle: { select: { plate: true, brand: true, model: true } },
      },
    });

    const recentActivity = recentOrders.map((o) => ({
      id: o.id,
      plate: o.vehicle.plate,
      vehicleName: `${o.vehicle.brand} ${o.vehicle.model}`,
      status: o.status,
      updatedAt: o.updatedAt.toISOString(),
    }));

    // Başarı oranı — tamamlanmış / toplam
    const totalEverOrders = await prisma.serviceOrder.count({ where: { tenantId, deletedAt: null } });
    const totalCompletedOrders = await prisma.serviceOrder.count({ where: { tenantId, deletedAt: null, status: "COMPLETED" } });
    const successRate = totalEverOrders > 0 ? Math.round((totalCompletedOrders / totalEverOrders) * 100) : 0;

    return {
      metrics: {
        totalCustomers,
        newCustomersThisMonth,
        customerGrowthPercent: newCustomersLastMonth > 0
          ? Math.round(((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth) * 100)
          : newCustomersThisMonth > 0 ? 100 : 0,
        totalVehicles,
        serviceOrdersThisMonth,
        serviceOrdersLastMonth,
        serviceGrowthPercent: serviceOrdersLastMonth > 0
          ? Math.round(((serviceOrdersThisMonth - serviceOrdersLastMonth) / serviceOrdersLastMonth) * 100)
          : serviceOrdersThisMonth > 0 ? 100 : 0,
        completedServicesThisMonth,
        activeServices,
        monthlyRevenue,
        monthlyCollected,
        revenueChangePercent,
        totalParts,
        lowStockParts,
        appointmentsThisMonth,
        totalMechanics,
        activeMechanics,
        successRate,
      },
      monthlyTrend,
      serviceDistribution,
      recentActivity,
    };
  } catch (e: any) {
    console.error("Analytics error:", e);
    return { error: e.message || "Analitik verileri alınırken hata oluştu." };
  }
}

// Müşteri Yaşam Boyu Değeri (CLV) analizi — üst 10 müşteri
export async function getCustomerLifetimeValue() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Oturum bulunamadı." };
    const tenantId = session.user.tenantId;

    const results = await prisma.$queryRawUnsafe<
      Array<{
        customerId: string;
        customerName: string;
        totalRevenue: number;
        serviceCount: number;
        avgServiceValue: number;
        lastServiceDate: Date | null;
      }>
    >(
      `
      SELECT
        c.id AS "customerId",
        COALESCE(c."companyName", CONCAT(c."firstName", ' ', c."lastName")) AS "customerName",
        COALESCE(SUM(i."totalAmount"), 0) AS "totalRevenue",
        COUNT(DISTINCT so.id)::int AS "serviceCount",
        COALESCE(AVG(i."totalAmount"), 0) AS "avgServiceValue",
        MAX(so."createdAt") AS "lastServiceDate"
      FROM "Customer" c
      LEFT JOIN "ServiceOrder" so ON so."customerId" = c.id AND so."tenantId" = $1 AND so."deletedAt" IS NULL
      LEFT JOIN "Invoice" i ON i."customerId" = c.id AND i."tenantId" = $1 AND i."deletedAt" IS NULL AND i.status IN ('SENT','PAID')
      WHERE c."tenantId" = $1 AND c."deletedAt" IS NULL
      GROUP BY c.id, c."companyName", c."firstName", c."lastName"
      ORDER BY "totalRevenue" DESC
      LIMIT 10
      `,
      tenantId
    );

    return {
      clvList: results.map((r) => ({
        customerId: r.customerId,
        customerName: r.customerName,
        totalRevenue: Number(r.totalRevenue),
        serviceCount: r.serviceCount,
        avgServiceValue: Number(r.avgServiceValue),
        lastServiceDate: r.lastServiceDate?.toISOString() ?? null,
      })),
    };
  } catch (e: any) {
    console.error("CLV error:", e);
    return { error: e.message };
  }
}

// Sonraki ay gelir tahmini — son 3 ayın ağırlıklı ortalaması (3-2-1 ağırlık)
export async function forecastNextMonthRevenue() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Oturum bulunamadı." };
    const tenantId = session.user.tenantId;

    const now = dayjs();
    const revenues: number[] = [];

    for (let i = 1; i <= 3; i++) {
      const mStart = now.subtract(i, "month").startOf("month").toDate();
      const mEnd = now.subtract(i, "month").endOf("month").toDate();
      const invs = await prisma.invoice.findMany({
        where: { tenantId, deletedAt: null, issueDate: { gte: mStart, lte: mEnd } },
        select: { totalAmount: true },
      });
      revenues.unshift(invs.reduce((acc, inv) => acc + Number(inv.totalAmount), 0));
    }

    // Ağırlıklı ortalama: en yakın ay 3 kat, önceki 2 kat, en eski 1 kat
    const weights = [1, 2, 3];
    const weightedSum = revenues.reduce((acc, rev, i) => acc + rev * weights[i]!, 0);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const forecast = Math.round(weightedSum / totalWeight);

    return { forecast, basedOnMonths: revenues };
  } catch (e: any) {
    return { error: e.message };
  }
}

// Araç marka bazında servis dağılımı
export async function getVehicleBrandDistribution() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Oturum bulunamadı." };
    const tenantId = session.user.tenantId;

    const results = await prisma.serviceOrder.groupBy({
      by: ["vehicleId"],
      where: { tenantId, deletedAt: null },
      _count: { id: true },
    });

    const vehicleIds = results.map((r) => r.vehicleId);
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIds }, tenantId },
      select: { id: true, brand: true },
    });

    const brandMap: Record<string, number> = {};
    for (const r of results) {
      const brand = vehicles.find((v) => v.id === r.vehicleId)?.brand ?? "Diğer";
      brandMap[brand] = (brandMap[brand] ?? 0) + r._count.id;
    }

    const brandDistribution = Object.entries(brandMap)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { brandDistribution };
  } catch (e: any) {
    return { error: e.message };
  }
}
