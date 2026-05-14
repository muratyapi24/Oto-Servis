"use server";

import { prisma } from "@repo/database";
import { guardTenant } from "@/lib/guards";
import { getCached, CacheKeys, CacheTTL } from "@/lib/cache";

/**
 * Ana dashboard sayfası için tüm verileri veritabanından çeker.
 * Hiçbir mock/statik veri kullanılmaz. Tüm veriler Prisma üzerinden gelir.
 *
 * Performans notları:
 *  - Tüm bağımsız sorgular Promise.all ile paralel çalışır (12 sorgu → tek round-trip).
 *  - lowStockCount için tüm parçaları çekmek yerine $queryRaw ile doğrudan COUNT.
 *  - successRate için iki count birlikte Promise.all içinde paralel atılır.
 *  - Sonuç 300sn cache'lenir (CacheTTL.dashboardKpi).
 */
export async function getDashboardOverview() {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId, session } = g;
  const userName = session.user?.name || "Yönetici";
  try {
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

      const prevWeekStart = new Date(weekStart);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);

      // =========================================================================
      // Tüm bağımsız sorguları paralel çalıştır (TEK round-trip)
      // =========================================================================
      const [
        activeOrders,
        readyOrdersCount,
        completedTodayCount,
        lowStockRaw,
        unpaidInvoices,
        todaysAppointments,
        allMechanics,
        weeklyPayments,
        prevWeekPaymentsAgg,
        totalOrdersCount,
        completedOrdersCount,
        recentOrders,
        totalCustomers,
      ] = await Promise.all([
        // 1. Kanban için aktif servisler
        prisma.serviceOrder.findMany({
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
        }),

        // 2. Teslime hazır sayısı
        prisma.serviceOrder.count({
          where: { tenantId, status: "COMPLETED", deletedAt: null },
        }),

        // 3. Bugün tamamlanan
        prisma.serviceOrder.count({
          where: {
            tenantId,
            status: "COMPLETED",
            updatedAt: { gte: todayStart, lt: todayEnd },
          },
        }),

        // 4. Stok uyarıları — tüm parça listesini çekip client'te filtrelemek yerine
        //    veritabanında doğrudan say. İki int kolonun karşılaştırılması Prisma'nın
        //    standart `where` ifadeleriyle yapılamadığı için $queryRaw kullanıyoruz.
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*)::bigint AS count
          FROM "Part"
          WHERE "tenantId" = ${tenantId}
            AND "isActive" = true
            AND "deletedAt" IS NULL
            AND "currentStock" <= "minStockLevel"
        `,

        // 5. Tahsil edilecek (ödenmemiş faturalar)
        prisma.invoice.findMany({
          where: { tenantId, status: { in: ["DRAFT", "SENT"] }, deletedAt: null },
          select: { totalAmount: true, paidAmount: true },
        }),

        // 6. Bugünkü randevular
        prisma.appointment.findMany({
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
        }),

        // 7. Aktif ustalar (doluluk için)
        prisma.mechanic.findMany({
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
        }),

        // 8. Bu haftaki tahsilatlar
        prisma.payment.findMany({
          where: {
            tenantId,
            paymentType: "INCOMING",
            paymentDate: { gte: weekStart },
          },
          select: { amount: true, paymentDate: true },
        }),

        // 9. Geçen haftaki gelir toplamı
        prisma.payment.aggregate({
          where: {
            tenantId,
            paymentType: "INCOMING",
            paymentDate: { gte: prevWeekStart, lt: weekStart },
          },
          _sum: { amount: true },
        }),

        // 10. Toplam servis emri sayısı
        prisma.serviceOrder.count({
          where: { tenantId, deletedAt: null },
        }),

        // 11. Tamamlanan servis emri sayısı (başarı oranı için)
        prisma.serviceOrder.count({
          where: { tenantId, status: "COMPLETED", deletedAt: null },
        }),

        // 12. Son aktiviteler
        prisma.serviceOrder.findMany({
          where: { tenantId, deletedAt: null },
          include: {
            vehicle: { select: { plate: true, brand: true, model: true } },
            customer: { select: { firstName: true, lastName: true, companyName: true, type: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 5,
        }),

        // 13. Toplam müşteri sayısı
        prisma.customer.count({
          where: { tenantId, deletedAt: null },
        }),
      ]);

      // =========================================================================
      // Sonuçları işle (senkron, in-memory)
      // =========================================================================

      // Kanban kolonları
      const pendingOrders = activeOrders.filter((o) => o.status === "PENDING").map(serializeOrder);
      const inProgressOrders = activeOrders.filter((o) => o.status === "IN_PROGRESS").map(serializeOrder);
      const testOrders = activeOrders.filter((o) => o.status === "WAITING_APPROVAL").map(serializeOrder);

      // Stok uyarıları (bigint → number)
      const lowStockCount = Number(lowStockRaw[0]?.count ?? 0n);

      // Ödenmemiş fatura toplamı
      const pendingInvoicesTotal = unpaidInvoices.reduce(
        (acc, inv) => acc + (Number(inv.totalAmount) - Number(inv.paidAmount)),
        0
      );

      // Usta doluluk oranı
      const MAX_DAILY_CAPACITY = 5;
      const utilization = allMechanics.map((m) => ({
        name: `${m.firstName} ${m.lastName}`,
        spec: (m.specialties.length > 0 && m.specialties[0]) ? m.specialties[0]! : "Genel",
        value: Math.min(100, Math.round((m._count.serviceOrders / MAX_DAILY_CAPACITY) * 100)),
      }));

      // Haftalık gelir
      const weeklyRevenue = weeklyPayments.reduce((acc, p) => acc + Number(p.amount), 0);
      const prevWeekRevenue = Number(prevWeekPaymentsAgg._sum.amount || 0);
      const revenueChangePercent = prevWeekRevenue > 0
        ? Math.round(((weeklyRevenue - prevWeekRevenue) / prevWeekRevenue) * 100)
        : 0;

      // Son 7 günün barları
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
      const maxDailyRevenue = Math.max(...dailyRevenues, 1);
      const revenueBarHeights = dailyRevenues.map((r) => Math.round((r / maxDailyRevenue) * 100));

      // Başarı oranı
      const successRate = totalOrdersCount > 0
        ? Math.round((completedOrdersCount / totalOrdersCount) * 100)
        : 0;

      // Son aktiviteler — UI metin haritası
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
    });
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
