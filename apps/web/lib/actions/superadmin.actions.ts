"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

function isAdmin(session: any) {
  return (session?.user as any)?.role === "SUPER_ADMIN";
}

// ==========================================
// 1. DASHBOARD OVERVIEW
// ==========================================
export async function getDashboardMetrics() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim. Sadece süper adminler görebilir." };

    const totalTenants = await prisma.tenant.count({ where: { deletedAt: null } });
    const activeTenants = await prisma.tenant.count({ where: { status: "ACTIVE", deletedAt: null } });
    const totalUsers = await prisma.user.count();

    const activeSubs = await prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: true }
    });
    const mrr = activeSubs.reduce((acc, sub) => acc + (sub.plan?.priceMonthly || 0), 0);

    const recentTenantsRaw = await prisma.tenant.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const recentTenants = await Promise.all(recentTenantsRaw.map(async (t) => {
      const sub = await prisma.subscription.findUnique({
        where: { tenantId: t.id },
        include: { plan: true }
      });
      return {
        id: t.id,
        name: t.name,
        createdAt: t.createdAt,
        status: t.status,
        planName: sub?.plan?.name || "TEST SÜRÜMÜ"
      };
    }));

    return { totalTenants, activeTenants, totalUsers, mrr, recentTenants };
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return { error: "Sistem metrikleri yüklenemedi." };
  }
}

// ==========================================
// 2. TENANTS (FİRMALAR)
// ==========================================
export async function getExpandedTenants() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz" };

    const tenants = await prisma.tenant.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true, vehicles: true }
        }
      }
    });

    const mapped = await Promise.all(tenants.map(async (t) => {
      const sub = await prisma.subscription.findUnique({
        where: { tenantId: t.id },
        include: { plan: true }
      });
      return {
        id: t.id,
        name: t.name,
        email: t.email,
        phone: t.phone,
        status: t.status,
        createdAt: t.createdAt,
        planName: sub?.plan?.name || "TRIAL",
        userCount: t._count.users,
        vehicleCount: t._count.vehicles
      };
    }));

    return { tenants: mapped };
  } catch (error) {
    console.error("Tenant Listesi Hatası:", error);
    return { error: "Firmalar yüklenemedi." };
  }
}

export async function updateTenantStatus(tenantId: string, newStatus: "ACTIVE" | "SUSPENDED") {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz" };

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: newStatus }
    });

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "TENANT-MGMT",
        message: `Tenant ${tenantId} status changed to ${newStatus}`,
        userId: session.user.id
      }
    });

    revalidatePath("/super-admin/tenants");
    return { success: `Firma durumu başarıyla ${newStatus} yapıldı.` };
  } catch (error) {
    console.error("Tenant status error:", error);
    return { error: "Durum güncellenemedi." };
  }
}

export async function updateTenant(tenantId: string, data: any) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const { name, email, taxNumber, phone } = data;

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { name, email, taxNumber, phone }
    });

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "TENANT-MGMT",
        message: `Tenant ${tenantId} updated.`,
        userId: session.user.id
      }
    });

    revalidatePath("/super-admin/tenants");
    return { success: "Firma bilgileri başarıyla güncellendi." };
  } catch (error) {
    console.error("Tenant update error:", error);
    return { error: "Firma güncellenemedi." };
  }
}

export async function deleteTenant(tenantId: string) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    // Soft delete: status'u DELETED yapıp deletedAt atayabiliriz 
    // veya doğrudan db'den silebiliriz. Soft delete tercih edelim.
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { 
        status: "DELETED",
        deletedAt: new Date()
      }
    });

    await prisma.auditLog.create({
      data: {
        level: "WARNING",
        module: "TENANT-MGMT",
        message: `Tenant ${tenantId} logically deleted.`,
        userId: session.user.id
      }
    });

    revalidatePath("/super-admin/tenants");
    return { success: "Firma başarıyla silindi (Soft Delete)." };
  } catch (error) {
    console.error("Tenant delete error:", error);
    return { error: "Firma silinemedi." };
  }
}

export async function createTenantWithAdmin(data: any) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const { companyName, email, password, taxNumber, planId } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return { error: "Bu e-posta adresi zaten kullanımda." };

    const result = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: { name: companyName, email, taxNumber, status: "ACTIVE" }
      });

      const hashedPassword = await bcrypt.hash(password, 10);

      await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          tenantId: newTenant.id,
          role: "TENANT_ADMIN",
          name: "Yetkili Admin",
          isActive: true
        }
      });

      let planToUse = planId;
      if (!planToUse) {
        const defaultPlan = await tx.subscriptionPlan.findFirst({
           where: { isActive: true },
           orderBy: { priceMonthly: 'asc' }
        });
        if (defaultPlan) planToUse = defaultPlan.id;
      }

      if (planToUse) {
         await tx.subscription.create({
           data: {
             tenantId: newTenant.id,
             planId: planToUse,
             status: "TRIAL",
             startDate: new Date(),
             currentPeriodStart: new Date(),
             currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
           }
         });
      }

      await tx.auditLog.create({
        data: { level: "INFO", module: "TENANT-MGMT", message: `New tenant created: ${companyName}`, userId: session.user.id }
      });

      return newTenant;
    });

    revalidatePath("/super-admin/tenants");
    return { success: "Firma ve Yönetici kaydı başarıyla oluşturuldu." };
  } catch (error) {
    console.error("Firma açılış hatası:", error);
    return { error: "Oluşturma başarısız oldu. Girdiğiniz bilgileri kontrol edin." };
  }
}

// ==========================================
// 3. USERS (KULLANICILAR)
// ==========================================
export async function getAllSystemUsers() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: { select: { name: true } }
      }
    });

    return { users };
  } catch (error) {
    console.error("Kullanıcı listesi hatası:", error);
    return { error: "Kullanıcılar yüklenemedi." };
  }
}

// ==========================================
// 4. SUBSCRIPTIONS (ABONELİKLER)
// ==========================================
export async function getSubscriptionPlans() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return { plans };
  } catch (error) {
    return { error: "Abonelik paketleri çekilemedi." };
  }
}

export async function createSubscriptionPlan(data: any) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const { name, description, priceMonthly, priceYearly, trialDays } = data;

    // Generate a simple slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);

    const newPlan = await prisma.subscriptionPlan.create({
      data: {
        name,
        slug,
        description,
        priceMonthly: parseFloat(priceMonthly) || 0,
        priceYearly: priceYearly ? parseFloat(priceYearly) : parseFloat(priceMonthly) * 10,
        trialDays: parseInt(trialDays, 10) || 14,
        features: data.features || {},
        limits: data.limits || {},
        isActive: true,
        sortOrder: 99, // push to end
      }
    });

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "SUBSCRIPTION-MGMT",
        message: `New plan created: ${name}`,
        userId: session.user.id
      }
    });

    revalidatePath("/super-admin/subscriptions");
    return { success: "Yeni paket başarıyla eklendi." };
  } catch (error) {
    console.error("Paket oluşturma hatası:", error);
    return { error: "Paket oluşturulurken bir hata meydana geldi." };
  }
}

export async function getAllSubscriptions() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const subscriptionsRaw = await prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        plan: true,
      }
    });

    const tenants = await prisma.tenant.findMany({
      where: { id: { in: subscriptionsRaw.map(s => s.tenantId) } },
      select: { id: true, name: true, email: true }
    });

    const subscriptions = subscriptionsRaw.map(sub => ({
      ...sub,
      tenant: tenants.find(t => t.id === sub.tenantId) || { name: "Bilinmeyen Firma" }
    }));

    const activeSubs = subscriptions.filter(s => s.status === "ACTIVE" || s.status === "TRIAL");
    const totalMRR = activeSubs.reduce((acc, sub) => acc + (sub.plan?.priceMonthly || 0), 0);

    return { subscriptions, totalMRR };
  } catch (error) {
    console.error("Abonelik hatası:", error);
    return { error: "Gelir/Abonelik verileri yüklenemedi." };
  }
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelAtPeriodEnd: true
      }
    });

    await prisma.auditLog.create({
      data: {
        level: "WARNING",
        module: "SUBSCRIPTION-MGMT",
        message: `Subscription ${subscriptionId} cancelled.`,
        userId: session.user.id
      }
    });

    revalidatePath("/super-admin/subscriptions");
    return { success: "Abonelik başarıyla iptal edildi." };
  } catch (error) {
    console.error("Abonelik iptal hatası:", error);
    return { error: "Abonelik iptal edilemedi." };
  }
}

export async function changeSubscriptionPlan(subscriptionId: string, newPlanId: string) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: newPlanId }
    });

    if (!plan) return { error: "Seçilen plan bulunamadı." };

    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        planId: newPlanId,
        status: "ACTIVE", // Eğer IPTAL durumundan aktive ediliyorsa diye ACTIVE yap. Değilse aynen kalabilir ama default active iyidir.
        cancelledAt: null,
        cancelAtPeriodEnd: false
      }
    });

    // Tenant içindeki plan bilgisini değiştirmek, sadece subscription tablosunda değiştirmek genelde yeterlidir (Subscription.plan bağlanıyor).

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "SUBSCRIPTION-MGMT",
        message: `Subscription ${subscriptionId} changed to plan ${plan.name}`,
        userId: session.user.id
      }
    });

    revalidatePath("/super-admin/subscriptions");
    return { success: `Abonelik planı "${plan.name}" olarak değiştirildi.` };
  } catch (error) {
    console.error("Abonelik değiştirme hatası:", error);
    return { error: "Abonelik planı değiştirilemedi." };
  }
}

// ==========================================
// 5. AUDIT LOGS
// ==========================================
export async function getAuditLogs(filter?: { level?: string, search?: string }) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const whereClause: any = {};
    if (filter?.level && filter.level !== "ALL") {
      whereClause.level = filter.level;
    }
    if (filter?.search) {
      whereClause.OR = [
        { message: { contains: filter.search, mode: 'insensitive' } },
        { module: { contains: filter.search, mode: 'insensitive' } },
        { traceId: { contains: filter.search, mode: 'insensitive' } }
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return { logs };
  } catch (error) {
    return { error: "Loglar yüklenemedi" };
  }
}

// ==========================================
// 6. SYSTEM NOTIFICATIONS
// ==========================================
export async function getSystemNotifications() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const notifications = await prisma.systemNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return { notifications };
  } catch (error) {
    return { error: "Bildirimler yüklenemedi" };
  }
}

// ==========================================
// 7. SYSTEM SETTINGS
// ==========================================
export async function getSystemSettings() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const settings = await prisma.systemSetting.findMany();
    // Convert array of key-value into a nice object
    const config = settings.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    return { settings: config };
  } catch (error) {
    return { error: "Sistem ayarları yüklenemedi" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Grup 11: Super Admin Eksik Sayfalar için Yeni Fonksiyonlar
// ─────────────────────────────────────────────────────────────────────────────

export async function getCommandCenterData() {
  const session = await auth();
  if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

  const [
    activeTenantCount,
    recentErrors,
    expiringSubscriptions,
    totalUsers,
    activeServiceOrders,
  ] = await Promise.all([
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.auditLog.findMany({
      where: { level: "ERROR", createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { tenant: { select: { name: true } } },
    }),
    prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        currentPeriodEnd: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
      include: { plan: { select: { name: true } } },
      take: 10,
    }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.serviceOrder.count({ where: { status: { in: ["PENDING", "IN_PROGRESS"] } } }),
  ]);

  return {
    activeTenantCount,
    totalUsers,
    activeServiceOrders,
    recentErrors: recentErrors.map((e) => ({
      id: e.id,
      message: e.message,
      module: e.module,
      tenantName: e.tenant?.name ?? "Sistem",
      createdAt: e.createdAt,
    })),
    expiringSubscriptions: expiringSubscriptions.map((s) => ({
      id: s.id,
      tenantId: s.tenantId,
      planName: s.plan.name,
      currentPeriodEnd: s.currentPeriodEnd,
    })),
  };
}

export async function getStrategicInsights() {
  const session = await auth();
  if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

  const now = new Date();
  const months: { label: string; start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    months.push({ label: `${start.getMonth() + 1}/${start.getFullYear()}`, start, end });
  }

  const monthlyData = await Promise.all(
    months.map(async (m) => {
      const [newTenants, cancelledSubs] = await Promise.all([
        prisma.tenant.count({ where: { createdAt: { gte: m.start, lte: m.end } } }),
        prisma.subscription.count({
          where: { cancelledAt: { gte: m.start, lte: m.end } },
        }),
      ]);
      return { label: m.label, newTenants, cancelledSubs };
    })
  );

  const topTenants = await prisma.serviceOrder.groupBy({
    by: ["tenantId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  const topTenantDetails = await Promise.all(
    topTenants.map(async (t) => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: t.tenantId },
        select: { name: true },
      });
      return { tenantId: t.tenantId, name: tenant?.name ?? "—", orderCount: t._count.id };
    })
  );

  const totalActive = await prisma.subscription.count({ where: { status: "ACTIVE" } });
  const totalCancelled = await prisma.subscription.count({ where: { status: "CANCELLED" } });
  const churnRate = totalActive + totalCancelled > 0
    ? Math.round((totalCancelled / (totalActive + totalCancelled)) * 100)
    : 0;

  return { monthlyData, topTenants: topTenantDetails, churnRate, totalActive };
}

export async function getTenantPerformanceMatrix() {
  const session = await auth();
  if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

  const tenants = await prisma.tenant.findMany({
    where: { status: "ACTIVE" },
    include: {
      _count: { select: { users: true, serviceOrders: true, customers: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const rows = await Promise.all(
    tenants.map(async (t) => {
      const sub = await prisma.subscription.findUnique({
        where: { tenantId: t.id },
        include: { plan: { select: { name: true } } },
      });
      return {
        id: t.id,
        name: t.name,
        userCount: t._count.users,
        serviceOrderCount: t._count.serviceOrders,
        customerCount: t._count.customers,
        subscriptionStatus: sub?.status ?? "NONE",
        planName: sub?.plan?.name ?? "—",
        createdAt: t.createdAt,
      };
    })
  );

  return { rows };
}

export async function getPaymentOperations() {
  const session = await auth();
  if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

  const subscriptions = await prisma.subscription.findMany({
    include: {
      plan: { select: { name: true, priceMonthly: true, currency: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const pastDue = subscriptions.filter((s) => s.status === "PAST_DUE");
  const cancelled = subscriptions.filter((s) => s.status === "CANCELLED");
  const active = subscriptions.filter((s) => s.status === "ACTIVE");

  const tenantIds = subscriptions.map((s) => s.tenantId);
  const tenants = await prisma.tenant.findMany({
    where: { id: { in: tenantIds } },
    select: { id: true, name: true, email: true },
  });
  const tenantMap = new Map(tenants.map((t) => [t.id, t]));

  return {
    summary: {
      activeCount: active.length,
      pastDueCount: pastDue.length,
      cancelledCount: cancelled.length,
    },
    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      tenantId: s.tenantId,
      tenantName: tenantMap.get(s.tenantId)?.name ?? "—",
      tenantEmail: tenantMap.get(s.tenantId)?.email ?? "—",
      planName: s.plan.name,
      priceMonthly: s.plan.priceMonthly,
      currency: s.plan.currency,
      status: s.status,
      currentPeriodEnd: s.currentPeriodEnd,
      stripeSubscriptionId: s.stripeSubscriptionId,
    })),
  };
}

// ==========================================
// ANALYTICS
// ==========================================
export async function getAnalyticsData(period: "7d" | "30d" | "90d" | "1y" = "30d") {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const periodDays: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
    const days = periodDays[period] || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalTenants, newTenants, totalSubscriptions, activeSubscriptions, totalServiceOrders, newServiceOrders] =
      await Promise.all([
        prisma.tenant.count({ where: { deletedAt: null } }),
        prisma.tenant.count({ where: { createdAt: { gte: startDate }, deletedAt: null } }),
        prisma.subscription.count(),
        prisma.subscription.count({ where: { status: "ACTIVE" } }),
        prisma.serviceOrder.count(),
        prisma.serviceOrder.count({ where: { createdAt: { gte: startDate } } }),
      ]);

    const activeSubs = await prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: { select: { priceMonthly: true } } },
    });
    const mrr = activeSubs.reduce((acc, s) => acc + (s.plan?.priceMonthly ?? 0), 0);

    // Dönem bazlı büyüme: son N günü eşit parçalara böl (7 nokta)
    const segments = 7;
    const segmentMs = (days * 24 * 60 * 60 * 1000) / segments;
    const growth = await Promise.all(
      Array.from({ length: segments }, async (_, i) => {
        const segStart = new Date(startDate.getTime() + i * segmentMs);
        const segEnd = new Date(startDate.getTime() + (i + 1) * segmentMs);
        const count = await prisma.tenant.count({
          where: { createdAt: { gte: segStart, lt: segEnd }, deletedAt: null },
        });
        return { label: segStart.toLocaleDateString("tr-TR", { month: "short", day: "numeric" }), tenants: count };
      })
    );

    return {
      period,
      totalTenants,
      newTenants,
      totalSubscriptions,
      activeSubscriptions,
      totalServiceOrders,
      newServiceOrders,
      mrr,
      growth,
    };
  } catch (error) {
    console.error("Analytics hatası:", error);
    return { error: "Analitik veriler yüklenemedi." };
  }
}

// ==========================================
// PAYMENTS & SETTINGS & NOTIFICATIONS
// ==========================================
export async function getPaymentsData() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const subscriptions = await prisma.subscription.findMany({
      include: { plan: { select: { name: true, priceMonthly: true, currency: true } } },
      orderBy: { createdAt: "desc" },
    });

    const tenantIds = subscriptions.map((s) => s.tenantId);
    const tenants = await prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, name: true, email: true },
    });
    const tenantMap = new Map(tenants.map((t) => [t.id, t]));

    const totalRevenue = subscriptions
      .filter((s) => s.status === "ACTIVE")
      .reduce((acc, s) => acc + (s.plan?.priceMonthly ?? 0), 0);

    const successCount = subscriptions.filter((s) => s.status === "ACTIVE" || s.status === "TRIAL").length;
    const failedCount = subscriptions.filter((s) => s.status === "PAST_DUE").length;

    return {
      totalRevenue,
      successCount,
      failedCount,
      payments: subscriptions.map((s) => ({
        id: s.id,
        tenantName: tenantMap.get(s.tenantId)?.name ?? "—",
        tenantEmail: tenantMap.get(s.tenantId)?.email ?? "—",
        planName: s.plan.name,
        amount: s.plan.priceMonthly,
        currency: s.plan.currency,
        status: s.status,
        date: s.currentPeriodStart,
      })),
    };
  } catch (error) {
    console.error("Ödeme verisi hatası:", error);
    return { error: "Ödeme verileri yüklenemedi." };
  }
}

export async function updateSystemSetting(key: string, value: string) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: value as unknown as object, updatedBy: session.user.id },
      create: { key, value: value as unknown as object, updatedBy: session.user.id },
    });

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "SYSTEM-SETTINGS",
        message: `System setting updated: ${key}`,
        userId: session.user.id,
      },
    });

    revalidatePath("/super-admin/settings");
    return { success: "Sistem ayarı güncellendi." };
  } catch (error) {
    console.error("Ayar güncelleme hatası:", error);
    return { error: "Ayar güncellenemedi." };
  }
}

export async function markNotificationRead(id: string) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    await prisma.systemNotification.update({
      where: { id },
      data: { isRead: true },
    });

    revalidatePath("/super-admin/notifications");
    return { success: "Bildirim okundu olarak işaretlendi." };
  } catch (error) {
    console.error("Bildirim güncelleme hatası:", error);
    return { error: "Bildirim güncellenemedi." };
  }
}

// ==========================================
// SECURITY (Mock veri)
// ==========================================
type ThreatLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

type SecurityThreat = {
  id: string;
  sourceIp: string;
  location: string;
  threatLevel: ThreatLevel;
  action: string;
  timestamp: Date;
};

type SecurityAlert = {
  id: string;
  type: string;
  message: string;
  severity: ThreatLevel;
  timestamp: Date;
};

export async function getSecurityThreats() {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const threats: SecurityThreat[] = [
      { id: "t1", sourceIp: "185.220.101.45", location: "Rusya", threatLevel: "CRITICAL", action: "Brute Force", timestamp: new Date(Date.now() - 5 * 60 * 1000) },
      { id: "t2", sourceIp: "103.21.244.0", location: "Çin", threatLevel: "HIGH", action: "SQL Injection", timestamp: new Date(Date.now() - 15 * 60 * 1000) },
      { id: "t3", sourceIp: "91.108.4.0", location: "Almanya", threatLevel: "MEDIUM", action: "Port Scan", timestamp: new Date(Date.now() - 30 * 60 * 1000) },
      { id: "t4", sourceIp: "198.51.100.0", location: "ABD", threatLevel: "LOW", action: "Suspicious Request", timestamp: new Date(Date.now() - 60 * 60 * 1000) },
      { id: "t5", sourceIp: "45.33.32.156", location: "Hollanda", threatLevel: "HIGH", action: "DDoS Attempt", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    ];

    return { threats };
  } catch (error) {
    return { error: "Güvenlik tehditleri yüklenemedi." };
  }
}

export async function getSecurityAlerts() {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const alerts: SecurityAlert[] = [
      { id: "a1", type: "AUTH_FAILURE", message: "Ardışık 10 başarısız giriş denemesi tespit edildi.", severity: "CRITICAL", timestamp: new Date(Date.now() - 3 * 60 * 1000) },
      { id: "a2", type: "RATE_LIMIT", message: "API rate limit aşıldı: /api/auth/login", severity: "HIGH", timestamp: new Date(Date.now() - 10 * 60 * 1000) },
      { id: "a3", type: "SUSPICIOUS_QUERY", message: "Olağandışı veritabanı sorgusu tespit edildi.", severity: "MEDIUM", timestamp: new Date(Date.now() - 25 * 60 * 1000) },
      { id: "a4", type: "NEW_DEVICE", message: "Yeni cihazdan süper admin girişi.", severity: "LOW", timestamp: new Date(Date.now() - 45 * 60 * 1000) },
    ];

    return { alerts };
  } catch (error) {
    return { error: "Güvenlik alarmları yüklenemedi." };
  }
}

export async function blockThreat(threatId: string) {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    await prisma.auditLog.create({
      data: {
        level: "WARNING",
        module: "SECURITY",
        message: `Threat blocked: ${threatId}`,
        userId: session.user.id,
      },
    });

    return { success: "Tehdit başarıyla engellendi." };
  } catch (error) {
    return { error: "Tehdit engellenemedi." };
  }
}

// ==========================================
// DATABASE HEALTH (Mock veri)
// ==========================================
type SlowQuery = { query: string; duration: number; count: number };

export async function getDatabaseHealthMetrics() {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    // Gerçek bağlantı kontrolü
    await prisma.$queryRaw`SELECT 1`;

    const slowQueries: SlowQuery[] = [
      { query: "SELECT * FROM service_orders WHERE tenant_id = ?", duration: 1240, count: 45 },
      { query: "SELECT * FROM audit_logs ORDER BY created_at DESC", duration: 890, count: 120 },
      { query: "UPDATE subscriptions SET status = ?", duration: 650, count: 12 },
    ];

    return {
      connectionPool: { active: 8, idle: 12, max: 20 },
      tps: 142,
      lockWaitTime: 2.3,
      cacheHitRate: 94.7,
      slowQueries,
      status: "HEALTHY" as const,
    };
  } catch (error) {
    return { error: "Veritabanı metrikleri yüklenemedi." };
  }
}

// ==========================================
// BACKUP (Mock veri)
// ==========================================
type BackupRecord = { id: string; date: Date; size: string; status: "SUCCESS" | "FAILED"; duration: number };

export async function getBackupStatus() {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const history: BackupRecord[] = [
      { id: "b1", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), size: "2.4 GB", status: "SUCCESS", duration: 342 },
      { id: "b2", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), size: "2.3 GB", status: "SUCCESS", duration: 318 },
      { id: "b3", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), size: "2.3 GB", status: "FAILED", duration: 0 },
      { id: "b4", date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), size: "2.2 GB", status: "SUCCESS", duration: 305 },
      { id: "b5", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), size: "2.2 GB", status: "SUCCESS", duration: 298 },
    ];

    return {
      lastBackup: history[0]?.date || new Date(),
      size: history[0]?.size || "0 GB",
      status: history[0]?.status || "SUCCESS",
      history,
    };
  } catch (error) {
    return { error: "Yedekleme durumu yüklenemedi." };
  }
}

export async function triggerBackup() {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "BACKUP",
        message: "Manual backup triggered by super admin.",
        userId: session.user.id,
      },
    });

    return { success: "Yedekleme başlatıldı." };
  } catch (error) {
    return { error: "Yedekleme başlatılamadı." };
  }
}

// ==========================================
// CLOUD COSTS (Mock veri)
// ==========================================
type CloudService = { name: string; cost: number };

export async function getCloudCostMetrics() {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const byService: CloudService[] = [
      { name: "EC2 / Compute", cost: 1240 },
      { name: "RDS / Database", cost: 890 },
      { name: "S3 / Storage", cost: 320 },
      { name: "CloudFront / CDN", cost: 180 },
      { name: "SES / Email", cost: 45 },
      { name: "Diğer", cost: 125 },
    ];

    return {
      thisMonth: 2800,
      lastMonth: 2650,
      forecast: 2950,
      byService,
    };
  } catch (error) {
    return { error: "Bulut maliyet metrikleri yüklenemedi." };
  }
}

// ==========================================
// CAPACITY (Mock veri)
// ==========================================
type CapacityTrend = { label: string; cpu: number; ram: number };

export async function getCapacityMetrics() {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const trend: CapacityTrend[] = [
      { label: "Pzt", cpu: 42, ram: 58 },
      { label: "Sal", cpu: 55, ram: 62 },
      { label: "Çar", cpu: 48, ram: 60 },
      { label: "Per", cpu: 71, ram: 68 },
      { label: "Cum", cpu: 65, ram: 72 },
      { label: "Cmt", cpu: 38, ram: 55 },
      { label: "Paz", cpu: 30, ram: 50 },
    ];

    return {
      cpu: 65,
      ram: 72,
      disk: 48,
      network: 35,
      trend,
    };
  } catch (error) {
    return { error: "Kapasite metrikleri yüklenemedi." };
  }
}

// ==========================================
// INFRASTRUCTURE (Mock veri)
// ==========================================
type InfraNode = {
  id: string;
  name: string;
  type: string;
  status: "ONLINE" | "OFFLINE" | "DEGRADED";
  region: string;
  cpu: number;
  ram: number;
};

export async function getInfrastructureMap() {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const nodes: InfraNode[] = [
      { id: "n1", name: "web-app-01", type: "WEB_SERVER", status: "ONLINE", region: "eu-central-1", cpu: 45, ram: 62 },
      { id: "n2", name: "web-app-02", type: "WEB_SERVER", status: "ONLINE", region: "eu-central-1", cpu: 38, ram: 58 },
      { id: "n3", name: "db-primary", type: "DATABASE", status: "ONLINE", region: "eu-central-1", cpu: 72, ram: 85 },
      { id: "n4", name: "db-replica", type: "DATABASE", status: "ONLINE", region: "eu-west-1", cpu: 25, ram: 40 },
      { id: "n5", name: "cache-01", type: "CACHE", status: "ONLINE", region: "eu-central-1", cpu: 15, ram: 30 },
      { id: "n6", name: "worker-01", type: "WORKER", status: "DEGRADED", region: "eu-central-1", cpu: 90, ram: 78 },
      { id: "n7", name: "cdn-edge", type: "CDN", status: "ONLINE", region: "global", cpu: 10, ram: 20 },
    ];

    return { nodes };
  } catch (error) {
    return { error: "Altyapı haritası yüklenemedi." };
  }
}

// ==========================================
// DEPLOYMENTS (Mock veri)
// ==========================================
type Deployment = {
  id: string;
  version: string;
  status: "SUCCESS" | "FAILED" | "ROLLBACK" | "IN_PROGRESS";
  deployedAt: Date;
  deployedBy: string;
  notes: string;
};

export async function getDeploymentHistory() {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const deployments: Deployment[] = [
      { id: "d1", version: "v2.4.1", status: "SUCCESS", deployedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), deployedBy: "CI/CD Pipeline", notes: "Hotfix: ödeme akışı düzeltmesi" },
      { id: "d2", version: "v2.4.0", status: "SUCCESS", deployedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), deployedBy: "admin@msoto.com", notes: "Yeni abonelik modülü" },
      { id: "d3", version: "v2.3.9", status: "ROLLBACK", deployedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), deployedBy: "CI/CD Pipeline", notes: "Performans sorunu nedeniyle geri alındı" },
      { id: "d4", version: "v2.3.8", status: "SUCCESS", deployedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), deployedBy: "admin@msoto.com", notes: "Güvenlik yamaları" },
      { id: "d5", version: "v2.3.7", status: "FAILED", deployedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), deployedBy: "CI/CD Pipeline", notes: "Build hatası" },
    ];

    return { deployments };
  } catch (error) {
    return { error: "Dağıtım geçmişi yüklenemedi." };
  }
}

export async function getDeploymentStatus() {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    return {
      current: "v2.4.1",
      status: "STABLE" as const,
      lastDeployedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    };
  } catch (error) {
    return { error: "Dağıtım durumu yüklenemedi." };
  }
}

// ==========================================
// USERS (Genişletme)
// ==========================================
export async function getUserDirectory(filters?: { search?: string; role?: string; tenantId?: string }) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const where: any = {};

    if (filters?.role) where.role = filters.role;
    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        tenant: { select: { name: true } },
      },
    });

    return { users };
  } catch (error) {
    console.error("Kullanıcı dizini hatası:", error);
    return { error: "Kullanıcılar yüklenemedi." };
  }
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "USER-MGMT",
        message: `User ${userId} isActive set to ${isActive}`,
        userId: session.user.id,
      },
    });

    revalidatePath("/super-admin/users");
    return { success: `Kullanıcı durumu ${isActive ? "aktif" : "pasif"} yapıldı.` };
  } catch (error) {
    console.error("Kullanıcı durum güncelleme hatası:", error);
    return { error: "Kullanıcı durumu güncellenemedi." };
  }
}

// ==========================================
// ROLES (Mock veri — DB'de rol modeli yok, UserRole enum var)
// ==========================================
type RolePermissions = { name: string; permissions: string[] };

export async function getRolesAndPermissions() {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const roles: RolePermissions[] = [
      {
        name: "SUPER_ADMIN",
        permissions: ["platform.view", "platform.manage", "tenants.manage", "users.manage", "subscriptions.manage", "settings.manage", "audit.view", "security.manage"],
      },
      {
        name: "TENANT_ADMIN",
        permissions: ["dashboard.view", "users.manage", "customers.manage", "vehicles.manage", "serviceOrders.manage", "invoices.manage", "reports.view", "settings.manage"],
      },
      {
        name: "MECHANIC",
        permissions: ["dashboard.view", "serviceOrders.view", "serviceOrders.update", "parts.view", "workLogs.manage"],
      },
      {
        name: "RECEPTIONIST",
        permissions: ["dashboard.view", "customers.manage", "vehicles.manage", "appointments.manage", "serviceOrders.create"],
      },
      {
        name: "ACCOUNTANT",
        permissions: ["dashboard.view", "invoices.manage", "payments.manage", "reports.view", "finance.manage"],
      },
    ];

    return { roles };
  } catch (error) {
    return { error: "Roller yüklenemedi." };
  }
}

export async function updateRolePermissions(roleName: string, permissions: string[]) {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    await prisma.auditLog.create({
      data: {
        level: "WARNING",
        module: "ROLE-MGMT",
        message: `Role permissions updated: ${roleName} -> [${permissions.join(", ")}]`,
        userId: session.user.id,
      },
    });

    return { success: `${roleName} rolü izinleri güncellendi.` };
  } catch (error) {
    return { error: "Rol izinleri güncellenemedi." };
  }
}

// ==========================================
// SUBSCRIPTIONS (Genişletme)
// ==========================================
export async function getSubscriptionById(id: string) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!subscription) return { error: "Abonelik bulunamadı." };

    const tenant = await prisma.tenant.findUnique({
      where: { id: subscription.tenantId },
      select: { id: true, name: true, email: true, phone: true, status: true },
    });

    return { subscription: { ...subscription, tenant } };
  } catch (error) {
    console.error("Abonelik detay hatası:", error);
    return { error: "Abonelik yüklenemedi." };
  }
}

export async function updateSubscription(
  id: string,
  data: { status?: string; planId?: string; notes?: string }
) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    await prisma.subscription.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status as "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED" }),
        ...(data.planId && { planId: data.planId }),
        ...(data.notes && { metadata: { notes: data.notes } }),
      },
    });

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "SUBSCRIPTION-MGMT",
        message: `Subscription ${id} updated: ${JSON.stringify(data)}`,
        userId: session.user.id,
      },
    });

    revalidatePath("/super-admin/subscriptions");
    return { success: "Abonelik güncellendi." };
  } catch (error) {
    console.error("Abonelik güncelleme hatası:", error);
    return { error: "Abonelik güncellenemedi." };
  }
}

export async function createSubscription(data: { tenantId: string; planId: string; startDate: Date }) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const subscription = await prisma.subscription.create({
      data: {
        tenantId: data.tenantId,
        planId: data.planId,
        status: "ACTIVE",
        startDate: data.startDate,
        currentPeriodStart: data.startDate,
        currentPeriodEnd: new Date(data.startDate.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "SUBSCRIPTION-MGMT",
        message: `New subscription created for tenant ${data.tenantId}`,
        userId: session.user.id,
      },
    });

    revalidatePath("/super-admin/subscriptions");
    return { success: "Abonelik oluşturuldu.", id: subscription.id };
  } catch (error) {
    console.error("Abonelik oluşturma hatası:", error);
    return { error: "Abonelik oluşturulamadı." };
  }
}

export async function updateSubscriptionPlan(
  planId: string,
  data: { name?: string; priceMonthly?: number; priceYearly?: number; isActive?: boolean }
) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    await prisma.subscriptionPlan.update({
      where: { id: planId },
      data,
    });

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "SUBSCRIPTION-MGMT",
        message: `Subscription plan ${planId} updated: ${JSON.stringify(data)}`,
        userId: session.user.id,
      },
    });

    revalidatePath("/super-admin/plans");
    return { success: "Abonelik planı güncellendi." };
  } catch (error) {
    console.error("Plan güncelleme hatası:", error);
    return { error: "Plan güncellenemedi." };
  }
}

// ==========================================
// COUPONS (Mock veri — DB'de kupon modeli yok)
// ==========================================
type DiscountType = "PERCENT" | "FIXED";

type Coupon = {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  validUntil: Date;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
};

export async function getCoupons() {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const coupons: Coupon[] = [
      { id: "c1", code: "WELCOME20", discountType: "PERCENT", discountValue: 20, validUntil: new Date("2025-12-31"), usageLimit: 100, usedCount: 34, isActive: true },
      { id: "c2", code: "FLAT50TL", discountType: "FIXED", discountValue: 50, validUntil: new Date("2025-06-30"), usageLimit: 50, usedCount: 50, isActive: false },
      { id: "c3", code: "SUMMER30", discountType: "PERCENT", discountValue: 30, validUntil: new Date("2025-09-01"), usageLimit: 200, usedCount: 87, isActive: true },
    ];

    return { coupons };
  } catch (error) {
    return { error: "Kuponlar yüklenemedi." };
  }
}

export async function createCoupon(data: {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  validUntil: Date;
  usageLimit: number;
}) {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "COUPON-MGMT",
        message: `Coupon created: ${data.code} (${data.discountType} ${data.discountValue})`,
        userId: session.user.id,
      },
    });

    return { success: `Kupon "${data.code}" oluşturuldu.` };
  } catch (error) {
    return { error: "Kupon oluşturulamadı." };
  }
}

export async function deactivateCoupon(id: string) {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "COUPON-MGMT",
        message: `Coupon deactivated: ${id}`,
        userId: session.user.id,
      },
    });

    return { success: "Kupon devre dışı bırakıldı." };
  } catch (error) {
    return { error: "Kupon devre dışı bırakılamadı." };
  }
}

// ==========================================
// ADDONS (Mock veri — DB'de addon modeli yok)
// ==========================================
type Addon = {
  id: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  subscriberCount: number;
};

export async function getAddons() {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const addons: Addon[] = [
      { id: "a1", name: "SMS Paketi", description: "Aylık 500 SMS gönderimi", price: 99, isActive: true, subscriberCount: 42 },
      { id: "a2", name: "Gelişmiş Raporlama", description: "Özel rapor şablonları ve PDF export", price: 149, isActive: true, subscriberCount: 28 },
      { id: "a3", name: "Çoklu Şube", description: "Sınırsız şube yönetimi", price: 299, isActive: true, subscriberCount: 15 },
      { id: "a4", name: "API Erişimi", description: "REST API ve webhook desteği", price: 199, isActive: false, subscriberCount: 0 },
    ];

    return { addons };
  } catch (error) {
    return { error: "Ek hizmetler yüklenemedi." };
  }
}

export async function createAddon(data: { name: string; description: string; price: number }) {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "ADDON-MGMT",
        message: `Addon created: ${data.name} (${data.price} TRY)`,
        userId: session.user.id,
      },
    });

    return { success: `Ek hizmet "${data.name}" oluşturuldu.` };
  } catch (error) {
    return { error: "Ek hizmet oluşturulamadı." };
  }
}

export async function updateAddon(id: string, data: { name?: string; price?: number; isActive?: boolean }) {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "ADDON-MGMT",
        message: `Addon updated: ${id} -> ${JSON.stringify(data)}`,
        userId: session.user.id,
      },
    });

    return { success: "Ek hizmet güncellendi." };
  } catch (error) {
    return { error: "Ek hizmet güncellenemedi." };
  }
}

// ==========================================
// SUPPORT (Mock veri — DB'de destek bileti modeli yok)
// ==========================================
type TicketPriority = "HIGH" | "MEDIUM" | "LOW";
type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

type SupportTicket = {
  id: string;
  title: string;
  tenantName: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: Date;
};

export async function getSupportQueue(filters?: { priority?: string; status?: string; tenantId?: string }) {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    let tickets: SupportTicket[] = [
      { id: "s1", title: "Fatura PDF oluşturulmuyor", tenantName: "Oto Servis A", priority: "HIGH", status: "OPEN", createdAt: new Date(Date.now() - 30 * 60 * 1000) },
      { id: "s2", title: "Kullanıcı girişi yapılamıyor", tenantName: "Hızlı Servis B", priority: "HIGH", status: "IN_PROGRESS", createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { id: "s3", title: "Stok sayımı hatalı", tenantName: "Mega Oto C", priority: "MEDIUM", status: "OPEN", createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) },
      { id: "s4", title: "SMS bildirimleri gelmiyor", tenantName: "Servis Plus D", priority: "LOW", status: "RESOLVED", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { id: "s5", title: "Randevu takvimi senkronize olmuyor", tenantName: "Oto Servis A", priority: "MEDIUM", status: "OPEN", createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
    ];

    if (filters?.priority) tickets = tickets.filter((t) => t.priority === filters.priority);
    if (filters?.status) tickets = tickets.filter((t) => t.status === filters.status);

    return { tickets };
  } catch (error) {
    return { error: "Destek kuyruğu yüklenemedi." };
  }
}

export async function updateSupportTicket(
  id: string,
  data: { status?: string; assignedTo?: string; notes?: string }
) {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "SUPPORT",
        message: `Support ticket ${id} updated: ${JSON.stringify(data)}`,
        userId: session.user.id,
      },
    });

    return { success: "Destek bileti güncellendi." };
  } catch (error) {
    return { error: "Destek bileti güncellenemedi." };
  }
}

// ==========================================
// NPS (Mock veri)
// ==========================================
type NPSTrend = { label: string; score: number };
type NPSResponse = { id: string; score: number; comment: string; tenantName: string; createdAt: Date };

export async function getNPSMetrics() {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const trend: NPSTrend[] = [
      { label: "Oca", score: 42 },
      { label: "Şub", score: 48 },
      { label: "Mar", score: 45 },
      { label: "Nis", score: 52 },
      { label: "May", score: 58 },
      { label: "Haz", score: 61 },
    ];

    return {
      score: 61,
      promoters: 68,
      passives: 25,
      detractors: 7,
      trend,
    };
  } catch (error) {
    return { error: "NPS metrikleri yüklenemedi." };
  }
}

export async function getNPSResponses(filters?: { period?: string }) {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const responses: NPSResponse[] = [
      { id: "r1", score: 9, comment: "Çok kullanışlı, servis takibi artık çok kolay.", tenantName: "Oto Servis A", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { id: "r2", score: 8, comment: "Genel olarak memnunum, mobil uygulama daha iyi olabilir.", tenantName: "Hızlı Servis B", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { id: "r3", score: 10, comment: "Harika bir platform, kesinlikle tavsiye ederim.", tenantName: "Mega Oto C", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { id: "r4", score: 4, comment: "Fatura modülünde sorunlar var, düzeltilmeli.", tenantName: "Servis Plus D", createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
      { id: "r5", score: 7, comment: "İyi ama yavaş bazen.", tenantName: "Oto Servis A", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    ];

    return { responses };
  } catch (error) {
    return { error: "NPS yanıtları yüklenemedi." };
  }
}

// ==========================================
// AUTOMATION (Mock veri)
// ==========================================
type Workflow = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  isActive: boolean;
  lastRunAt: Date | null;
  runCount: number;
};

export async function getAutomationWorkflows() {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const workflows: Workflow[] = [
      { id: "w1", name: "Deneme Süresi Bitiş Uyarısı", trigger: "subscription.trial_ending", action: "email.send_warning", isActive: true, lastRunAt: new Date(Date.now() - 2 * 60 * 60 * 1000), runCount: 145 },
      { id: "w2", name: "Ödeme Başarısız Bildirimi", trigger: "payment.failed", action: "email.send_alert + sms.send", isActive: true, lastRunAt: new Date(Date.now() - 30 * 60 * 1000), runCount: 23 },
      { id: "w3", name: "Yeni Tenant Karşılama", trigger: "tenant.created", action: "email.send_welcome", isActive: true, lastRunAt: new Date(Date.now() - 5 * 60 * 60 * 1000), runCount: 67 },
      { id: "w4", name: "Aylık Rapor Gönderimi", trigger: "schedule.monthly", action: "report.generate + email.send", isActive: false, lastRunAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), runCount: 12 },
      { id: "w5", name: "Güvenlik Tehdidi Alarmı", trigger: "security.threat_detected", action: "notification.create + email.send_admin", isActive: true, lastRunAt: new Date(Date.now() - 10 * 60 * 1000), runCount: 8 },
    ];

    return { workflows };
  } catch (error) {
    return { error: "İş akışları yüklenemedi." };
  }
}

export async function toggleAutomationWorkflow(id: string) {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "AUTOMATION",
        message: `Automation workflow toggled: ${id}`,
        userId: session.user.id,
      },
    });

    return { success: "İş akışı durumu değiştirildi." };
  } catch (error) {
    return { error: "İş akışı güncellenemedi." };
  }
}

// ==========================================
// API INTEGRATIONS (Mock veri)
// ==========================================
type IntegrationStatus = "ACTIVE" | "ERROR" | "INACTIVE";

type APIIntegration = {
  id: string;
  name: string;
  status: IntegrationStatus;
  lastCallAt: Date | null;
  successRate: number;
  callCount: number;
};

type APIKey = {
  id: string;
  name: string;
  key: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  isActive: boolean;
};

export async function getAPIIntegrations() {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const integrations: APIIntegration[] = [
      { id: "i1", name: "Stripe", status: "ACTIVE", lastCallAt: new Date(Date.now() - 5 * 60 * 1000), successRate: 99.8, callCount: 12450 },
      { id: "i2", name: "Twilio SMS", status: "ACTIVE", lastCallAt: new Date(Date.now() - 15 * 60 * 1000), successRate: 98.2, callCount: 3210 },
      { id: "i3", name: "Resend Email", status: "ACTIVE", lastCallAt: new Date(Date.now() - 30 * 60 * 1000), successRate: 99.5, callCount: 8760 },
      { id: "i4", name: "AWS S3", status: "ACTIVE", lastCallAt: new Date(Date.now() - 2 * 60 * 1000), successRate: 100, callCount: 45230 },
      { id: "i5", name: "Meilisearch", status: "ERROR", lastCallAt: new Date(Date.now() - 60 * 60 * 1000), successRate: 72.3, callCount: 5670 },
      { id: "i6", name: "Upstash Redis", status: "ACTIVE", lastCallAt: new Date(Date.now() - 1 * 60 * 1000), successRate: 99.9, callCount: 98450 },
    ];

    return { integrations };
  } catch (error) {
    return { error: "API entegrasyonları yüklenemedi." };
  }
}

export async function getAPIUsageStats() {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    return {
      totalCalls: 173770,
      successRate: 98.7,
      avgLatency: 142,
      byEndpoint: [
        { endpoint: "/api/service-orders", calls: 45230 },
        { endpoint: "/api/auth/session", calls: 38900 },
        { endpoint: "/api/customers", calls: 28450 },
        { endpoint: "/api/invoices", calls: 22100 },
        { endpoint: "/api/parts", calls: 18760 },
        { endpoint: "/api/payments", calls: 12340 },
        { endpoint: "Diğer", calls: 7990 },
      ],
    };
  } catch (error) {
    return { error: "API kullanım istatistikleri yüklenemedi." };
  }
}

export async function getAPIKeys() {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const keys: APIKey[] = [
      { id: "k1", name: "Production Key", key: "sk_live_****************************abcd", createdAt: new Date("2024-01-15"), lastUsedAt: new Date(Date.now() - 5 * 60 * 1000), isActive: true },
      { id: "k2", name: "Staging Key", key: "sk_test_****************************efgh", createdAt: new Date("2024-03-20"), lastUsedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), isActive: true },
      { id: "k3", name: "Mobile App Key", key: "sk_live_****************************ijkl", createdAt: new Date("2024-06-01"), lastUsedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), isActive: false },
    ];

    return { keys };
  } catch (error) {
    return { error: "API anahtarları yüklenemedi." };
  }
}

export async function createAPIKey(name: string) {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const randomKey = `sk_live_${Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join("")}`;

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "API-KEYS",
        message: `New API key created: ${name}`,
        userId: session.user.id,
      },
    });

    return { success: `API anahtarı "${name}" oluşturuldu.`, key: randomKey };
  } catch (error) {
    return { error: "API anahtarı oluşturulamadı." };
  }
}

export async function revokeAPIKey(id: string) {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    await prisma.auditLog.create({
      data: {
        level: "WARNING",
        module: "API-KEYS",
        message: `API key revoked: ${id}`,
        userId: session.user.id,
      },
    });

    return { success: "API anahtarı iptal edildi." };
  } catch (error) {
    return { error: "API anahtarı iptal edilemedi." };
  }
}

// ==========================================
// KMS (Mock veri)
// ==========================================
type KMSKeyStatus = "ACTIVE" | "ROTATING" | "EXPIRED";

type KMSKey = {
  id: string;
  name: string;
  algorithm: string;
  status: KMSKeyStatus;
  lastRotatedAt: Date;
  nextRotationAt: Date;
};

export async function getKMSKeys() {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const keys: KMSKey[] = [
      { id: "km1", name: "Database Encryption Key", algorithm: "AES-256-GCM", status: "ACTIVE", lastRotatedAt: new Date("2025-01-01"), nextRotationAt: new Date("2025-07-01") },
      { id: "km2", name: "Session Secret Key", algorithm: "HMAC-SHA256", status: "ACTIVE", lastRotatedAt: new Date("2025-02-15"), nextRotationAt: new Date("2025-08-15") },
      { id: "km3", name: "S3 Encryption Key", algorithm: "AES-256-CBC", status: "ROTATING", lastRotatedAt: new Date("2024-12-01"), nextRotationAt: new Date("2025-06-01") },
      { id: "km4", name: "Legacy API Key", algorithm: "RSA-2048", status: "EXPIRED", lastRotatedAt: new Date("2024-06-01"), nextRotationAt: new Date("2024-12-01") },
    ];

    return { keys };
  } catch (error) {
    return { error: "KMS anahtarları yüklenemedi." };
  }
}

export async function rotateKMSKey(id: string) {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    await prisma.auditLog.create({
      data: {
        level: "CRITICAL",
        module: "KMS",
        message: `KMS key rotation initiated: ${id}`,
        userId: session.user.id,
      },
    });

    return { success: "Anahtar rotasyonu başlatıldı." };
  } catch (error) {
    return { error: "Anahtar rotasyonu başlatılamadı." };
  }
}

// ==========================================
// AUDIT TRAIL
// ==========================================
export async function getAuditTrail(filters?: {
  module?: string;
  level?: string;
  from?: Date;
  to?: Date;
  page?: number;
}) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const page = filters?.page ?? 1;
    const take = 50;
    const skip = (page - 1) * take;

    type AuditWhereClause = {
      module?: { contains: string; mode: "insensitive" };
      level?: string;
      createdAt?: { gte?: Date; lte?: Date };
    };

    const where: AuditWhereClause = {};
    if (filters?.module) where.module = { contains: filters.module, mode: "insensitive" };
    if (filters?.level && filters.level !== "ALL") where.level = filters.level;
    if (filters?.from || filters?.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          user: { select: { name: true, email: true } },
          tenant: { select: { name: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page, totalPages: Math.ceil(total / take) };
  } catch (error) {
    console.error("Audit trail hatası:", error);
    return { error: "Denetim logu yüklenemedi." };
  }
}

// ==========================================
// ARCHIVE (Mock veri)
// ==========================================
type ArchiveRecord = {
  id: string;
  type: string;
  description: string;
  size: string;
  archivedAt: Date;
};

export async function getArchiveData(filters?: { olderThanDays?: number }) {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const olderThan = filters?.olderThanDays ?? 90;
    const cutoff = new Date(Date.now() - olderThan * 24 * 60 * 60 * 1000);

    const records: ArchiveRecord[] = [
      { id: "ar1", type: "AUDIT_LOG", description: "Eski denetim logları (90+ gün)", size: "450 MB", archivedAt: new Date(cutoff.getTime() - 10 * 24 * 60 * 60 * 1000) },
      { id: "ar2", type: "SERVICE_ORDER", description: "Tamamlanmış servis emirleri (180+ gün)", size: "1.2 GB", archivedAt: new Date(cutoff.getTime() - 30 * 24 * 60 * 60 * 1000) },
      { id: "ar3", type: "INVOICE", description: "Eski faturalar (365+ gün)", size: "320 MB", archivedAt: new Date(cutoff.getTime() - 90 * 24 * 60 * 60 * 1000) },
      { id: "ar4", type: "NOTIFICATION", description: "Okunmuş bildirimler (30+ gün)", size: "85 MB", archivedAt: new Date(cutoff.getTime() - 5 * 24 * 60 * 60 * 1000) },
    ];

    return {
      records,
      totalSize: "2.05 GB",
      totalCount: records.length,
    };
  } catch (error) {
    return { error: "Arşiv verisi yüklenemedi." };
  }
}

export async function purgeArchivedData(criteria: { olderThanDays: number; types: string[] }) {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    await prisma.auditLog.create({
      data: {
        level: "CRITICAL",
        module: "ARCHIVE",
        message: `Archive purge initiated: olderThan=${criteria.olderThanDays}d, types=[${criteria.types.join(", ")}]`,
        userId: session.user.id,
      },
    });

    const deletedCount = criteria.types.length * Math.floor(Math.random() * 500 + 100);
    return { success: `${deletedCount} kayıt başarıyla silindi.`, deletedCount };
  } catch (error) {
    return { error: "Arşiv temizleme başarısız." };
  }
}

// ==========================================
// MOBILE APP STATS (Mock veri)
// ==========================================
export async function getMobileAppStats() {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    return {
      activeDevices: 1247,
      iosCount: 523,
      androidCount: 724,
      versionDistribution: [
        { version: "2.4.1", count: 845 },
        { version: "2.4.0", count: 312 },
        { version: "2.3.9", count: 67 },
        { version: "2.3.x ve altı", count: 23 },
      ],
      pushStats: {
        sent: 45230,
        delivered: 43890,
        opened: 18450,
      },
    };
  } catch (error) {
    return { error: "Mobil uygulama istatistikleri yüklenemedi." };
  }
}

// ==========================================
// REPORTS
// ==========================================
type ReportTemplate = {
  id: string;
  name: string;
  description: string;
  metrics: string[];
  lastUsedAt: Date | null;
};

export async function getReportTemplates() {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const templates: ReportTemplate[] = [
      { id: "rt1", name: "Aylık Gelir Raporu", description: "MRR, yeni abonelikler ve churn analizi", metrics: ["mrr", "newSubscriptions", "churnRate", "arpu"], lastUsedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { id: "rt2", name: "Tenant Performans Raporu", description: "Aktif tenant sayısı, servis emirleri ve kullanım metrikleri", metrics: ["activeTenants", "serviceOrders", "userActivity", "retention"], lastUsedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      { id: "rt3", name: "Güvenlik Özet Raporu", description: "Tehdit tespitleri, başarısız girişler ve güvenlik olayları", metrics: ["threats", "failedLogins", "blockedIPs", "auditEvents"], lastUsedAt: null },
      { id: "rt4", name: "Altyapı Sağlık Raporu", description: "CPU, RAM, disk kullanımı ve uptime metrikleri", metrics: ["cpuUsage", "ramUsage", "diskUsage", "uptime", "responseTime"], lastUsedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    ];

    return { templates };
  } catch (error) {
    return { error: "Rapor şablonları yüklenemedi." };
  }
}

export async function generateReport(params: {
  templateId?: string;
  metrics: string[];
  period: string;
  chartType: string;
}) {
  // TODO: Gerçek veri kaynağına bağla
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const reportId = `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "REPORTS",
        message: `Report generated: ${reportId} (metrics: ${params.metrics.join(", ")}, period: ${params.period})`,
        userId: session.user.id,
      },
    });

    const mockData: Record<string, unknown> = {
      reportId,
      generatedAt: new Date(),
      period: params.period,
      chartType: params.chartType,
      metrics: params.metrics.reduce<Record<string, number>>((acc, m) => {
        acc[m] = Math.floor(Math.random() * 10000);
        return acc;
      }, {}),
    };

    return { success: "Rapor oluşturuldu.", reportId, data: mockData };
  } catch (error) {
    return { error: "Rapor oluşturulamadı." };
  }
}

// ==========================================
// SAAS OVERVIEW
// ==========================================
export async function getSaaSOverviewMetrics() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const [activeSubs, totalTenants, totalUsers, cancelledSubs] = await Promise.all([
      prisma.subscription.findMany({
        where: { status: "ACTIVE" },
        include: { plan: { select: { priceMonthly: true, priceYearly: true } } },
      }),
      prisma.tenant.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.subscription.count({ where: { status: "CANCELLED" } }),
    ]);

    const mrr = activeSubs.reduce((acc, s) => acc + (s.plan?.priceMonthly ?? 0), 0);
    const totalActive = activeSubs.length;
    const churnRate = totalActive + cancelledSubs > 0
      ? Math.round((cancelledSubs / (totalActive + cancelledSubs)) * 100 * 10) / 10
      : 0;

    // TODO: Gerçek veri kaynağına bağla (ARR, LTV, büyüme oranı)
    const arr = mrr * 12;
    const ltv = mrr > 0 && churnRate > 0 ? Math.round(mrr / (churnRate / 100)) : 0;
    const growthRate = 12.4; // Mock

    return {
      mrr,
      arr,
      ltv,
      churnRate,
      growthRate,
      activeTenants: totalTenants,
      totalUsers,
      activeSubscriptions: totalActive,
    };
  } catch (error) {
    console.error("SaaS overview hatası:", error);
    return { error: "SaaS metrikleri yüklenemedi." };
  }
}

// ==========================================
// TENANT DETAIL
// ==========================================
export async function getTenantById(id: string) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            vehicles: true,
            serviceOrders: true,
            customers: true,
          },
        },
      },
    });

    if (!tenant) return null;

    const [subscription, recentAuditLogs] = await Promise.all([
      prisma.subscription.findUnique({
        where: { tenantId: id },
        include: { plan: true },
      }),
      prisma.auditLog.findMany({
        where: { tenantId: id },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    return {
      ...tenant,
      subscription,
      recentAuditLogs,
    };
  } catch (error) {
    console.error("Tenant detay hatası:", error);
    return { error: "Firma bilgileri yüklenemedi." };
  }
}
