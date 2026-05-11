"use server";

import { prisma } from "@repo/database";
import { guardTenant } from "@/lib/guards";
import { getCached, invalidateCache, CacheKeys, CacheTTL } from "@/lib/cache";

/**
 * Ana dashboard sayfası için tüm verileri veritabanından çeker.
 * Hiçbir mock/statik veri kullanılmaz. Tüm veriler Prisma üzerinden gelir.
 */
export async function getDashboardOverview() {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId, session } = g;
  const userName = session.user?.name || "Yönetici";
  try {

    // Cache'den dön (TTL: 300s)
    const cacheKey = CacheKeys.dashboardKpi(tenantId);
    return getCached(cacheKey, CacheTTL.dashboardKpi, async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Haftanın başı (Pazartesi)
    const weekStart = new Date(todayStart);
    const dayOfWeek = weekStart.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - diff);

    // =========================================================================
    // 1. KANBAN: Aktif Servisler (Tamamlanmamış & İptal olmamış)
    // =========================================================================
    const activeOrders = await prisma.serviceOrder.findMany({
      where: {
        tenantId,
        status: { in: ["PENDING", "IN_PROGRESS", "WAITING_APPROVAL"] },
        deletedAt: null,
      },
      include: {
        vehicle: { select: { plate: true, brand: true, model: true } },
        assignedMechanic: { select: { id: true, firstName: true, lastName: true, specialties: true } },
        customer: { select: { firstName: true, lastName: true, companyName: true, type: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const pendingOrders = activeOrders.filter((o) => o.status === "PENDING").map(serializeOrder);
    const inProgressOrders = activeOrders.filter((o) => o.status === "IN_PROGRESS").map(serializeOrder);
    const testOrders = activeOrders.filter((o) => o.status === "WAITING_APPROVAL").map(serializeOrder);

    // Teslime hazır: bugün veya daha önce COMPLETED olanlar
    const readyOrdersCount = await prisma.serviceOrder.count({
      where: { tenantId, status: "COMPLETED", deletedAt: null },
    });

    // =========================================================================
    // 2. METRIKLER
    // =========================================================================

    // Bugün tamamlanan
    const completedTodayCount = await prisma.serviceOrder.count({
      where: {
        tenantId,
        status: "COMPLETED",
        updatedAt: { gte: todayStart, lt: todayEnd },
      },
    });

    // Stok uyarıları (currentStock <= minStockLevel olan parçalar)
    const lowStockParts = await prisma.part.findMany({
      where: {
        tenantId,
        isActive: true,
        deletedAt: null,
      },
      select: { currentStock: true, minStockLevel: true },
    });
    const lowStockCount = lowStockParts.filter((p) => p.currentStock <= p.minStockLevel).length;

    // Tahsil edilecek (ödenmemiş faturalar)
    const unpaidInvoices = await prisma.invoice.findMany({
      where: { tenantId, status: { in: ["DRAFT", "SENT"] }, deletedAt: null },
      select: { totalAmount: true, paidAmount: true },
    });
    const pendingInvoicesTotal = unpaidInvoices.reduce(
      (acc, inv) => acc + (Number(inv.totalAmount) - Number(inv.paidAmount)),
      0
    );

    // =========================================================================
    // 3. BUGÜNKÜ RANDEVULAR (Timeline)
    // =========================================================================
    const todaysAppointments = await prisma.appointment.findMany({
      where: {
        tenantId,
        appointmentDate: { gte: todayStart, lt: todayEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
        deletedAt: null,
      },
      include: {
        customer: { select: { firstName: true, lastName: true, companyName: true, type: true } },
        vehicle: { select: { plate: true, brand: true, model: true } },
      },
      orderBy: { appointmentTime: "asc" },
    });

    // =========================================================================
    // 4. USTA DOLULUK ORANI (Gerçek veri: her ustanın aktif order sayısı)
    // =========================================================================
    const allMechanics = await prisma.mechanic.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialties: true,
        _count: {
          select: {
            serviceOrders: {
              where: { status: { in: ["PENDING", "IN_PROGRESS", "WAITING_APPROVAL"] } },
            },
          },
        },
      },
    });

    // Doluluk: aktif iş sayısı / max kapasite (günlük 5 iş varsayımı)
    const MAX_DAILY_CAPACITY = 5;
    const utilization = allMechanics.map((m) => ({
      name: `${m.firstName} ${m.lastName}`,
      spec: (m.specialties.length > 0 && m.specialties[0]) ? m.specialties[0]! : "Genel",
      value: Math.min(100, Math.round((m._count.serviceOrders / MAX_DAILY_CAPACITY) * 100)),
    }));

    // =========================================================================
    // 5. HAFTALIK GELİR (bu haftaki tahsilatlar)
    // =========================================================================
    const weeklyPayments = await prisma.payment.findMany({
      where: {
        tenantId,
        paymentType: "INCOMING",
        paymentDate: { gte: weekStart },
      },
      select: { amount: true, paymentDate: true },
    });

    const weeklyRevenue = weeklyPayments.reduce((acc, p) => acc + Number(p.amount), 0);

    // Geçen haftanın geliri (karşılaştırma için)
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekPayments = await prisma.payment.aggregate({
      where: {
        tenantId,
        paymentType: "INCOMING",
        paymentDate: { gte: prevWeekStart, lt: weekStart },
      },
      _sum: { amount: true },
    });
    const prevWeekRevenue = Number(prevWeekPayments._sum.amount || 0);
    const revenueChangePercent = prevWeekRevenue > 0
      ? Math.round(((weeklyRevenue - prevWeekRevenue) / prevWeekRevenue) * 100)
      : 0;

    // Günlük gelirler (grafik barları için — son 7 gün)
    const dailyRevenues: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayTotal = weeklyPayments
        .filter((p) => p.paymentDate >= dayStart && p.paymentDate < dayEnd)
        .reduce((acc, p) => acc + Number(p.amount), 0);
      dailyRevenues.push(dayTotal);
    }
    // Normalize barlar (0-100 arasında)
    const maxDailyRevenue = Math.max(...dailyRevenues, 1);
    const revenueBarHeights = dailyRevenues.map((r) => Math.round((r / maxDailyRevenue) * 100));

    // =========================================================================
    // 6. BAŞARI ORANI (Tamamlanan / Tüm servisler oranı)
    // =========================================================================
    const totalOrdersCount = await prisma.serviceOrder.count({
      where: { tenantId, deletedAt: null },
    });
    const completedOrdersCount = await prisma.serviceOrder.count({
      where: { tenantId, status: "COMPLETED", deletedAt: null },
    });
    const successRate = totalOrdersCount > 0
      ? Math.round((completedOrdersCount / totalOrdersCount) * 100)
      : 0;

    // =========================================================================
    // 7. SON AKTİVİTELER (en son güncellenen 5 servis emri)
    // =========================================================================
    const recentOrders = await prisma.serviceOrder.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        vehicle: { select: { plate: true, brand: true, model: true } },
        customer: { select: { firstName: true, lastName: true, companyName: true, type: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });
    const recentActivities = recentOrders.map((order) => {
      const customerName = order.customer.type === "CORPORATE"
        ? (order.customer.companyName || "Kurumsal Müşteri")
        : `${order.customer.firstName} ${order.customer.lastName}`;

      let description = "";
      let color = "primary";
      switch (order.status) {
        case "COMPLETED":
          description = `${order.vehicle.plate} plakalı aracın işlemi tamamlandı.`;
          color = "tertiary-container";
          break;
        case "IN_PROGRESS":
          description = `${order.vehicle.plate} plakalı araçta işlem devam ediyor.`;
          color = "secondary";
          break;
        case "PENDING":
          description = `${order.vehicle.plate} plakalı araç muayene bekliyor.`;
          color = "primary";
          break;
        case "WAITING_APPROVAL":
          description = `${order.vehicle.plate} plakalı araç onay bekliyor.`;
          color = "secondary";
          break;
        case "CANCELLED":
          description = `${order.vehicle.plate} plakalı araç işlemi iptal edildi.`;
          color = "error";
          break;
      }

      return {
        id: order.id,
        description,
        color,
        customerName: customerName ?? "Bilinmeyen Müşteri",
        timeAgo: getTimeAgo(order.updatedAt),
      };
    });

    // =========================================================================
    // 8. MÜŞTERİ MEMNUNİYETİ: Gerçek veri yoksa tenant'ın toplam istatistiklerini göster
    // =========================================================================
    const totalCustomers = await prisma.customer.count({
      where: { tenantId, deletedAt: null },
    });

    // =========================================================================
    // RESPONSE
    // =========================================================================
    return {
      overview: {
        userName,
        metrics: {
          activeServicesCount: activeOrders.length,
          completedTodayCount,
          pendingInvoicesTotal,
          lowStockCount,
        },
        kanban: {
          pending: pendingOrders,
          inProgress: inProgressOrders,
          testing: testOrders,
          readyCount: readyOrdersCount,
        },
        appointments: todaysAppointments.map((a) => ({
          id: a.id,
          appointmentTime: a.appointmentTime,
          type: a.type,
          status: a.status,
          customer: a.customer,
          vehicle: a.vehicle,
        })),
        utilization,
        finance: {
          weeklyRevenue,
          revenueChangePercent,
          revenueBarHeights,
        },
        stats: {
          successRate,
          totalCustomers,
        },
        recentActivities,
      },
    };
    }); // getCached kapanışı
  } catch (error) {
    console.error("Dashboard Overview Hatası:", error);
    return { error: "Dashboard verileri alınamadı: " + (error instanceof Error ? error.message : String(error)) };
  }
}

// Decimal alanlarını serialize et (Prisma Decimal → number)
function serializeOrder(order: any) {
  return {
    ...order,
    estimatedCost: order.estimatedCost ? Number(order.estimatedCost) : null,
    subTotal: Number(order.subTotal),
    discountAmount: Number(order.discountAmount),
    taxAmount: Number(order.taxAmount),
    totalAmount: Number(order.totalAmount),
  };
}

// Zaman farkını Türkçe string olarak döndür
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Az önce";
  if (diffMins < 60) return `${diffMins} dakika önce`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} saat önce`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} gün önce`;
}
