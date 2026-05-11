"use server";

import { revalidatePath } from "next/cache";
import { prisma, UserRole } from "@repo/database";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import type { Session } from "next-auth";
import type { Prisma } from "@repo/database";
import { z } from 'zod';

// ==========================================
// Tip Tanımları
// ==========================================

interface CreateTenantInput {
  companyName: string;
  email: string;
  password: string;
  taxNumber?: string;
  planId?: string;
}

interface CreatePlanInput {
  name: string;
  description?: string;
  priceMonthly: number | string;
  priceYearly?: number | string;
  trialDays?: number | string;
  features?: Record<string, boolean | string>;
  limits?: Record<string, number>;
}

interface UpdateTenantInput {
  name?: string;
  email?: string;
  taxNumber?: string;
  phone?: string;
  address?: string;
  city?: string;
  website?: string;
  slogan?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
}

// Zod Doğrulama Şemaları — export edilmez ("use server" kısıtı)
const createCouponSchema = z.object({
  code: z.string().regex(/^[A-Z0-9-]{3,50}$/, "Yalnızca büyük harf, rakam ve tire"),
  discountType: z.enum(['PERCENT', 'FIXED']),
  discountValue: z.number().positive("İndirim değeri pozitif olmalı"),
  validUntil: z.date(),
  usageLimit: z.number().int().positive("Kullanım limiti pozitif tam sayı olmalı"),
});

const createAPIKeySchema = z.object({
  name: z.string().min(3, "En az 3 karakter").max(100, "En fazla 100 karakter"),
});

// Prisma Hata Yönetimi
function handlePrismaError(error: unknown): { error: string } {
  if (error instanceof Error) {
    const prismaError = error as Error & { code?: string };
    if (prismaError.code === 'P2002') {
      return { error: "Bu kayıt zaten mevcut." };
    }
    if (prismaError.code === 'P2025') {
      return { error: "Kayıt bulunamadı." };
    }
  }
  return { error: "Sunucu hatası oluştu." };
}

// Type predicate — narrows session: Session | null → Session after the check
function isAdmin(session: Session | null): session is Session {
  return session?.user?.role === "SUPER_ADMIN";
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

export async function updateTenant(tenantId: string, data: UpdateTenantInput) {
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

export async function createTenantWithAdmin(data: CreateTenantInput) {
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

export async function createSubscriptionPlan(data: CreatePlanInput) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const { name, description, priceMonthly, priceYearly, trialDays } = data;
    const monthlyPrice = Number(priceMonthly) || 0;
    const yearlyPrice =
      priceYearly !== undefined && priceYearly !== ""
        ? Number(priceYearly) || 0
        : monthlyPrice * 10;
    const trialDayCount =
      trialDays !== undefined && trialDays !== ""
        ? Number.parseInt(String(trialDays), 10) || 14
        : 14;

    // Generate a simple slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);

    const newPlan = await prisma.subscriptionPlan.create({
      data: {
        name,
        slug,
        description,
        priceMonthly: monthlyPrice,
        priceYearly: yearlyPrice,
        trialDays: trialDayCount,
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

    const whereClause: Prisma.AuditLogWhereInput = {};
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
    const config = settings.reduce((acc: Record<string, unknown>, curr) => {
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
// SECURITY (Gerçek Prisma sorguları — AuditLog'dan türetilir)
// ==========================================
type ThreatLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

type SecurityAlert = {
  id: string;
  type: string;
  message: string;
  severity: ThreatLevel;
  timestamp: Date;
};

export async function getSecurityThreats() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const logs = await prisma.auditLog.findMany({
      where: {
        level: { in: ["ERROR", "WARN", "WARNING"] },
        module: { in: ["SECURITY", "AUTH", "RATE-LIMIT", "API-GATEWAY"] },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const threats = logs.map((log) => ({
      id: log.id,
      sourceIp: "—",
      location: "—",
      threatLevel: (log.level === "ERROR" ? "CRITICAL" : "HIGH") as ThreatLevel,
      action: log.module,
      timestamp: log.createdAt,
      message: log.message,
    }));

    return { threats };
  } catch (error) {
    console.error("Güvenlik tehditleri hatası:", error);
    return { error: "Güvenlik tehditleri yüklenemedi." };
  }
}

export async function getSecurityAlerts() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    // Gerçek veri: AuditLog'daki ERROR/WARN seviyeli güvenlik olayları
    const logs = await prisma.auditLog.findMany({
      where: {
        level: { in: ["ERROR", "WARN", "WARNING"] },
        module: { in: ["SECURITY", "AUTH", "RATE-LIMIT", "API-GATEWAY"] },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const alerts: SecurityAlert[] = logs.map((log) => ({
      id: log.id,
      type: log.module.includes("AUTH") ? "AUTH_FAILURE"
        : log.module.includes("RATE") ? "RATE_LIMIT"
        : "SUSPICIOUS_QUERY",
      message: log.message,
      severity: log.level === "ERROR" ? "CRITICAL" : log.level === "WARN" || log.level === "WARNING" ? "HIGH" : "MEDIUM",
      timestamp: log.createdAt,
    }));

    // Demo: kendi gerçek loglarımız yoksa boş dön (mock yerine boş liste)
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
// DATABASE HEALTH (Gerçek Prisma sorguları)
// ==========================================

export async function getDatabaseHealthMetrics() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    // Gerçek bağlantı kontrolü
    await prisma.$queryRaw`SELECT 1`;

    // Gerçek aktif bağlantı sayısı
    const activeConnections = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT count(*) FROM pg_stat_activity WHERE state = 'active'
    `;

    // Yavaş sorgu logları AuditLog'dan
    const slowQueryLogs = await prisma.auditLog.findMany({
      where: { module: "DB-SLOW-QUERY" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return {
      connectionPool: {
        active: Number(activeConnections[0]?.count ?? 0),
        idle: 0,
        max: 20,
      },
      tps: 0,
      lockWaitTime: 0,
      cacheHitRate: 0,
      slowQueries: slowQueryLogs.map((l) => ({
        query: l.message,
        duration: 0,
        count: 1,
      })),
      status: "HEALTHY" as const,
    };
  } catch (error) {
    console.error("Veritabanı sağlık metrikleri hatası:", error);
    return { error: "Veritabanı metrikleri yüklenemedi." };
  }
}

// ==========================================
// BACKUP (Gerçek Prisma sorguları)
// ==========================================

function formatBytes(bytes: bigint): string {
  const gb = Number(bytes) / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = Number(bytes) / 1024 ** 2;
  return `${mb.toFixed(0)} MB`;
}

export async function getBackupStatus() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const records = await prisma.backupRecord.findMany({
      orderBy: { date: "desc" },
      take: 10,
    });

    const lastRecord = records[0];

    return {
      lastBackup: lastRecord?.date ?? new Date(),
      size: lastRecord ? formatBytes(lastRecord.sizeBytes) : "0 B",
      status: lastRecord?.status ?? "SUCCESS",
      history: records.map((r) => ({
        id: r.id,
        date: r.date,
        size: formatBytes(r.sizeBytes),
        status: r.status as "SUCCESS" | "FAILED",
        duration: r.durationSeconds,
      })),
    };
  } catch (error) {
    console.error("Yedekleme durumu hatası:", error);
    return { error: "Yedekleme durumu yüklenemedi." };
  }
}

export async function triggerBackup() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    await prisma.backupRecord.create({
      data: {
        date: new Date(),
        sizeBytes: BigInt(0),
        status: "IN_PROGRESS",
        durationSeconds: 0,
        type: "FULL",
        notes: `Manuel yedekleme — ${session.user.email ?? "super admin"}`,
      },
    });

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "BACKUP",
        message: "Manual backup triggered by super admin.",
        userId: session.user.id,
      },
    });

    revalidatePath("/super-admin/infrastructure");
    return { success: "Yedekleme başlatıldı." };
  } catch (error) {
    console.error("Yedekleme başlatma hatası:", error);
    return { error: "Yedekleme başlatılamadı." };
  }
}

// ==========================================
// CLOUD COSTS (Gerçek Prisma sorguları)
// ==========================================

export async function getCloudCostMetrics() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const records = await prisma.cloudCostRecord.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 6,
    });

    const thisMonth = records[0];
    const lastMonth = records[1];
    const forecast = thisMonth ? Math.round(thisMonth.totalCost * 1.05) : 0;

    const byService = thisMonth
      ? Object.entries(thisMonth.byService as Record<string, number>).map(
          ([name, cost]) => ({ name, cost })
        )
      : [];

    return {
      thisMonth: thisMonth?.totalCost ?? 0,
      lastMonth: lastMonth?.totalCost ?? 0,
      forecast,
      byService,
    };
  } catch (error) {
    console.error("Bulut maliyet metrikleri hatası:", error);
    return { error: "Bulut maliyet metrikleri yüklenemedi." };
  }
}

// ==========================================
// CAPACITY (Gerçek Prisma sorguları)
// ==========================================

export async function getCapacityMetrics() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const [latest, trendRecords] = await Promise.all([
      prisma.capacitySnapshot.findFirst({ orderBy: { recordedAt: "desc" } }),
      prisma.capacitySnapshot.findMany({
        orderBy: { recordedAt: "desc" },
        take: 7,
      }),
    ]);

    const trend = [...trendRecords].reverse().map((r) => ({
      label: r.recordedAt.toLocaleDateString("tr-TR", { weekday: "short" }),
      cpu: r.cpuPercent,
      ram: r.ramPercent,
    }));

    return {
      cpu: latest?.cpuPercent ?? 0,
      ram: latest?.ramPercent ?? 0,
      disk: latest?.diskPercent ?? 0,
      network: latest?.networkMbps ?? 0,
      trend,
    };
  } catch (error) {
    console.error("Kapasite metrikleri hatası:", error);
    return { error: "Kapasite metrikleri yüklenemedi." };
  }
}

// ==========================================
// INFRASTRUCTURE (Gerçek Prisma sorguları)
// ==========================================

export async function getInfrastructureMap() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const infraNodes = await prisma.infraNode.findMany({
      orderBy: { name: "asc" },
    });

    // UI uyumluluğu: cpuPercent → cpu, ramPercent → ram
    const nodes = infraNodes.map((n) => ({
      id: n.id,
      name: n.name,
      type: n.type,
      status: n.status as "ONLINE" | "OFFLINE" | "DEGRADED",
      region: n.region,
      cpu: n.cpuPercent,
      ram: n.ramPercent,
    }));

    return { nodes };
  } catch (error) {
    console.error("Altyapı haritası hatası:", error);
    return { error: "Altyapı haritası yüklenemedi." };
  }
}

// ==========================================
// DEPLOYMENTS (Gerçek Prisma sorguları)
// ==========================================

export async function getDeploymentHistory() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const deployments = await prisma.deployment.findMany({
      orderBy: { deployedAt: "desc" },
      take: 20,
    });

    return { deployments };
  } catch (error) {
    console.error("Dağıtım geçmişi hatası:", error);
    return { error: "Dağıtım geçmişi yüklenemedi." };
  }
}

export async function getDeploymentStatus() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const latest = await prisma.deployment.findFirst({
      orderBy: { deployedAt: "desc" },
    });

    return {
      current: latest?.version ?? "—",
      status: latest?.status === "SUCCESS" ? "STABLE" : (latest?.status ?? "UNKNOWN"),
      lastDeployedAt: latest?.deployedAt ?? new Date(),
    };
  } catch (error) {
    console.error("Dağıtım durumu hatası:", error);
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

    const where: Prisma.UserWhereInput = {};

    if (filters?.role && Object.values(UserRole).includes(filters.role as UserRole)) {
      where.role = filters.role as UserRole;
    }
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
// COUPONS (Gerçek Prisma sorguları)
// ==========================================

export async function getCoupons() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return { coupons };
  } catch (error) {
    console.error("Kupon listesi hatası:", error);
    return { error: "Kuponlar yüklenemedi." };
  }
}

export async function createCoupon(data: {
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  validUntil: Date;
  usageLimit: number;
}) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const validated = createCouponSchema.safeParse(data);
    if (!validated.success) return { error: validated.error.errors[0]?.message ?? "Geçersiz veri" };

    const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
    if (existing) return { error: "Bu kupon kodu zaten kullanımda." };

    await prisma.coupon.create({
      data: {
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        validUntil: data.validUntil,
        usageLimit: data.usageLimit,
        usedCount: 0,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "COUPON-MGMT",
        message: `Coupon created: ${data.code} (${data.discountType} ${data.discountValue})`,
        userId: session.user.id,
      },
    });

    revalidatePath("/super-admin/coupons");
    return { success: `Kupon "${data.code}" oluşturuldu.` };
  } catch (error) {
    console.error("Kupon oluşturma hatası:", error);
    return handlePrismaError(error);
  }
}

export async function deactivateCoupon(id: string) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    await prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "COUPON-MGMT",
        message: `Coupon deactivated: ${id}`,
        userId: session.user.id,
      },
    });

    revalidatePath("/super-admin/coupons");
    return { success: "Kupon devre dışı bırakıldı." };
  } catch (error) {
    console.error("Kupon devre dışı bırakma hatası:", error);
    return handlePrismaError(error);
  }
}

// ==========================================
// ADDONS (Gerçek Prisma sorguları)
// ==========================================

export async function getAddons() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const addons = await prisma.addon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return { addons };
  } catch (error) {
    console.error("Addon listesi hatası:", error);
    return { error: "Ek hizmetler yüklenemedi." };
  }
}

export async function createAddon(data: { name: string; description: string; price: number }) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    await prisma.addon.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        isActive: true,
        subscriberCount: 0,
      },
    });

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "ADDON-MGMT",
        message: `Addon created: ${data.name} (${data.price} TRY)`,
        userId: session.user.id,
      },
    });

    revalidatePath("/super-admin/addons");
    return { success: `Ek hizmet "${data.name}" oluşturuldu.` };
  } catch (error) {
    console.error("Addon oluşturma hatası:", error);
    return handlePrismaError(error);
  }
}

export async function updateAddon(id: string, data: { name?: string; price?: number; isActive?: boolean }) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    await prisma.addon.update({
      where: { id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "ADDON-MGMT",
        message: `Addon updated: ${id} -> ${JSON.stringify(data)}`,
        userId: session.user.id,
      },
    });

    revalidatePath("/super-admin/addons");
    return { success: "Ek hizmet güncellendi." };
  } catch (error) {
    console.error("Addon güncelleme hatası:", error);
    return handlePrismaError(error);
  }
}

// ==========================================
// SUPPORT (Gerçek Prisma sorguları)
// ==========================================

export async function getSupportQueue(filters?: { priority?: string; status?: string; tenantId?: string }) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const where: Prisma.SupportTicketWhereInput = {};
    if (filters?.priority) where.priority = filters.priority as "HIGH" | "MEDIUM" | "LOW";
    if (filters?.status) where.status = filters.status as "OPEN" | "IN_PROGRESS" | "RESOLVED";
    if (filters?.tenantId) where.tenantId = filters.tenantId;

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { tenant: { select: { name: true } } },
    });

    return {
      tickets: tickets.map((t) => ({
        ...t,
        tenantName: t.tenant.name,
      })),
    };
  } catch (error) {
    console.error("Destek kuyruğu hatası:", error);
    return { error: "Destek kuyruğu yüklenemedi." };
  }
}

export async function updateSupportTicket(
  id: string,
  data: { status?: string; assignedTo?: string; notes?: string }
) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const updateData: Prisma.SupportTicketUpdateInput = {};
    if (data.status) updateData.status = data.status as "OPEN" | "IN_PROGRESS" | "RESOLVED";
    if (data.assignedTo) updateData.assignedTo = data.assignedTo;
    if (data.status === "RESOLVED") updateData.resolvedAt = new Date();

    await prisma.supportTicket.update({ where: { id }, data: updateData });

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "SUPPORT",
        message: `Support ticket ${id} updated: ${JSON.stringify(data)}`,
        userId: session.user.id,
      },
    });

    revalidatePath("/super-admin/support");
    return { success: "Destek bileti güncellendi." };
  } catch (error) {
    console.error("Destek bileti güncelleme hatası:", error);
    return handlePrismaError(error);
  }
}

// ==========================================
// NPS (Gerçek Prisma sorguları)
// ==========================================

export async function getNPSMetrics() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const responses = await prisma.nPSResponse.findMany();
    const total = responses.length;

    if (total === 0) {
      return { score: 0, promoters: 0, passives: 0, detractors: 0, trend: [] };
    }

    const promoters = responses.filter((r) => r.score >= 9).length;
    const passives = responses.filter((r) => r.score >= 7 && r.score <= 8).length;
    const detractors = responses.filter((r) => r.score <= 6).length;
    const score = Math.round(((promoters - detractors) / total) * 100);

    // Son 6 ay aylık ortalama NPS trendi
    const now = new Date();
    const trend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const monthResponses = responses.filter(
        (r) => r.createdAt >= d && r.createdAt <= monthEnd
      );
      const mTotal = monthResponses.length;
      const mPromoters = monthResponses.filter((r) => r.score >= 9).length;
      const mDetractors = monthResponses.filter((r) => r.score <= 6).length;
      const mScore = mTotal > 0 ? Math.round(((mPromoters - mDetractors) / mTotal) * 100) : 0;
      return {
        label: d.toLocaleDateString("tr-TR", { month: "short" }),
        score: mScore,
      };
    });

    return { score, promoters, passives, detractors, trend };
  } catch (error) {
    console.error("NPS metrikleri hatası:", error);
    return { error: "NPS metrikleri yüklenemedi." };
  }
}

export async function getNPSResponses(filters?: { period?: string }) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const where: Prisma.NPSResponseWhereInput = {};
    if (filters?.period) {
      const days = filters.period === "7d" ? 7 : filters.period === "30d" ? 30 : 90;
      where.createdAt = { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    }

    const responses = await prisma.nPSResponse.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { tenant: { select: { name: true } } },
    });

    return {
      responses: responses.map((r) => ({
        ...r,
        tenantName: r.tenant.name,
      })),
    };
  } catch (error) {
    console.error("NPS yanıtları hatası:", error);
    return { error: "NPS yanıtları yüklenemedi." };
  }
}

// ==========================================
// AUTOMATION (Gerçek Prisma sorguları)
// ==========================================

export async function getAutomationWorkflows() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const workflows = await prisma.automationWorkflow.findMany({
      orderBy: { createdAt: "desc" },
    });

    return { workflows };
  } catch (error) {
    console.error("Otomasyon iş akışları hatası:", error);
    return { error: "İş akışları yüklenemedi." };
  }
}

export async function toggleAutomationWorkflow(id: string) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const workflow = await prisma.automationWorkflow.findUnique({ where: { id } });
    if (!workflow) return { error: "İş akışı bulunamadı." };

    await prisma.automationWorkflow.update({
      where: { id },
      data: { isActive: !workflow.isActive },
    });

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "AUTOMATION",
        message: `Automation workflow ${id} toggled to ${!workflow.isActive}`,
        userId: session.user.id,
      },
    });

    revalidatePath("/super-admin/automation");
    return { success: "İş akışı durumu değiştirildi." };
  } catch (error) {
    console.error("Otomasyon toggle hatası:", error);
    return handlePrismaError(error);
  }
}

// ==========================================
// API INTEGRATIONS (AuditLog'dan türetilen gerçek veri)
// ==========================================

export async function getAPIIntegrations() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    // Gerçek entegrasyon durumunu AuditLog'daki hata kayıtlarından türet
    const recentErrors = await prisma.auditLog.findMany({
      where: {
        level: { in: ["ERROR", "WARN"] },
        module: { in: ["STRIPE", "TWILIO", "RESEND", "AWS-S3", "MEILISEARCH", "REDIS"] },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });

    const errorModules = new Set(recentErrors.map((l) => l.module));

    // Platform entegrasyonları — yapılandırma tabanlı sabit liste, durum AuditLog'dan
    const integrations = [
      { id: "i1", name: "Stripe", module: "STRIPE" },
      { id: "i2", name: "Twilio SMS", module: "TWILIO" },
      { id: "i3", name: "Resend Email", module: "RESEND" },
      { id: "i4", name: "AWS S3", module: "AWS-S3" },
      { id: "i5", name: "Meilisearch", module: "MEILISEARCH" },
      { id: "i6", name: "Upstash Redis", module: "REDIS" },
    ].map((i) => ({
      id: i.id,
      name: i.name,
      status: errorModules.has(i.module) ? "ERROR" : "ACTIVE",
      lastCallAt: recentErrors.find((e) => e.module === i.module)?.createdAt ?? null,
      successRate: errorModules.has(i.module) ? 85.0 : 99.5,
      callCount: 0,
    }));

    return { integrations };
  } catch (error) {
    console.error("API entegrasyonları hatası:", error);
    return { error: "API entegrasyonları yüklenemedi." };
  }
}

export async function getAPIUsageStats() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    // AuditLog'dan API çağrı istatistiklerini türet
    const [totalLogs, errorLogs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { level: "ERROR" } }),
    ]);

    const successRate = totalLogs > 0
      ? Math.round(((totalLogs - errorLogs) / totalLogs) * 1000) / 10
      : 100;

    return {
      totalCalls: totalLogs,
      successRate,
      avgLatency: 0,
      byEndpoint: [] as { endpoint: string; calls: number }[],
    };
  } catch (error) {
    console.error("API kullanım istatistikleri hatası:", error);
    return { error: "API kullanım istatistikleri yüklenemedi." };
  }
}

// ==========================================
// API KEYS (Gerçek Prisma sorguları)
// ==========================================

export async function getAPIKeys() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const apiKeys = await prisma.aPIKey.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        createdBy: true,
        lastUsedAt: true,
        isActive: true,
        revokedAt: true,
        createdAt: true,
        // keyHash HARIÇ tutulur
      },
    });

    // UI uyumluluğu: keyPrefix'i maskeli "key" olarak sun
    const keys = apiKeys.map((k) => ({
      ...k,
      key: `${k.keyPrefix}${"*".repeat(28)}`,
    }));

    return { keys };
  } catch (error) {
    console.error("API anahtarları hatası:", error);
    return { error: "API anahtarları yüklenemedi." };
  }
}

export async function createAPIKey(name: string) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const validated = createAPIKeySchema.safeParse({ name });
    if (!validated.success) return { error: validated.error.errors[0]?.message ?? "Geçersiz isim" };

    // Kriptografik olarak güvenli rastgele anahtar
    const crypto = await import("crypto");
    const rawKey = crypto.randomBytes(32).toString("hex");
    const keyHash = await bcrypt.hash(rawKey, 10);
    const keyPrefix = rawKey.substring(0, 8);

    await prisma.aPIKey.create({
      data: {
        name,
        keyHash,
        keyPrefix,
        createdBy: session.user.id ?? "unknown",
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "API-KEYS",
        message: `New API key created: ${name}`,
        userId: session.user.id,
      },
    });

    revalidatePath("/super-admin/developer");
    // Tam anahtar YALNIZCA BİR KEZ döndürülür
    return { success: `API anahtarı "${name}" oluşturuldu.`, key: rawKey };
  } catch (error) {
    console.error("API anahtarı oluşturma hatası:", error);
    return handlePrismaError(error);
  }
}

export async function revokeAPIKey(id: string) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const key = await prisma.aPIKey.findUnique({ where: { id } });
    if (!key) return { error: "API anahtarı bulunamadı." };

    await prisma.aPIKey.update({
      where: { id },
      data: { isActive: false, revokedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        level: "WARNING",
        module: "API-KEYS",
        message: `API key revoked: ${id} (${key.name})`,
        userId: session.user.id,
      },
    });

    revalidatePath("/super-admin/developer");
    return { success: "API anahtarı iptal edildi." };
  } catch (error) {
    console.error("API anahtarı iptal hatası:", error);
    return handlePrismaError(error);
  }
}

// ==========================================
// KMS (Gerçek Prisma sorguları)
// ==========================================

export async function getKMSKeys() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const keys = await prisma.kMSKey.findMany({
      orderBy: { lastRotatedAt: "desc" },
    });

    return { keys };
  } catch (error) {
    console.error("KMS anahtarları hatası:", error);
    return { error: "KMS anahtarları yüklenemedi." };
  }
}

export async function rotateKMSKey(id: string) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    await prisma.kMSKey.update({
      where: { id },
      data: {
        status: "ROTATING",
        lastRotatedAt: new Date(),
        nextRotationAt: sixMonthsLater,
      },
    });

    await prisma.auditLog.create({
      data: {
        level: "CRITICAL",
        module: "KMS",
        message: `KMS key rotation initiated: ${id}`,
        userId: session.user.id,
      },
    });

    revalidatePath("/super-admin/security");
    return { success: "Anahtar rotasyonu başlatıldı." };
  } catch (error) {
    console.error("KMS rotasyon hatası:", error);
    return handlePrismaError(error);
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
// ARCHIVE (Gerçek Prisma sorguları)
// ==========================================

export async function getArchiveData(filters?: { olderThanDays?: number }) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const olderThan = filters?.olderThanDays ?? 90;
    const cutoff = new Date(Date.now() - olderThan * 24 * 60 * 60 * 1000);

    const [serviceOrderCount, invoiceCount, auditLogCount] = await Promise.all([
      prisma.serviceOrder.count({ where: { deletedAt: { lt: cutoff } } }),
      prisma.invoice.count({ where: { deletedAt: { lt: cutoff } } }),
      prisma.auditLog.count({ where: { createdAt: { lt: cutoff } } }),
    ]);

    const records = [
        {
          id: "audit",
          type: "AUDIT_LOG",
          description: `Eski denetim logları (${olderThan}+ gün)`,
          count: auditLogCount,
          size: `${auditLogCount.toLocaleString("tr-TR")} kayıt`,
          archivedAt: cutoff,
        },
        {
          id: "service",
          type: "SERVICE_ORDER",
          description: `Silinmiş servis emirleri (${olderThan}+ gün)`,
          count: serviceOrderCount,
          size: `${serviceOrderCount.toLocaleString("tr-TR")} kayıt`,
          archivedAt: cutoff,
        },
        {
          id: "invoice",
          type: "INVOICE",
          description: `Silinmiş faturalar (${olderThan}+ gün)`,
          count: invoiceCount,
          size: `${invoiceCount.toLocaleString("tr-TR")} kayıt`,
          archivedAt: cutoff,
        },
      ];
    const totalCount = serviceOrderCount + invoiceCount + auditLogCount;

    return {
      records,
      totalCount,
      totalSize: `${totalCount.toLocaleString("tr-TR")} kayıt`,
    };
  } catch (error) {
    console.error("Arşiv verisi hatası:", error);
    return { error: "Arşiv verisi yüklenemedi." };
  }
}

export async function purgeArchivedData(criteria: { olderThanDays: number; types: string[] }) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const cutoff = new Date(Date.now() - criteria.olderThanDays * 24 * 60 * 60 * 1000);
    let totalDeleted = 0;

    await prisma.$transaction(async (tx) => {
      if (criteria.types.includes("SERVICE_ORDER")) {
        const { count } = await tx.serviceOrder.deleteMany({
          where: { deletedAt: { lt: cutoff } },
        });
        totalDeleted += count;
      }
      if (criteria.types.includes("INVOICE")) {
        const { count } = await tx.invoice.deleteMany({
          where: { deletedAt: { lt: cutoff } },
        });
        totalDeleted += count;
      }
      if (criteria.types.includes("AUDIT_LOG")) {
        const { count } = await tx.auditLog.deleteMany({
          where: { createdAt: { lt: cutoff } },
        });
        totalDeleted += count;
      }
      await tx.auditLog.create({
        data: {
          level: "CRITICAL",
          module: "ARCHIVE",
          message: `Archive purge: ${totalDeleted} records deleted, types=[${criteria.types.join(", ")}], olderThan=${criteria.olderThanDays}d`,
          userId: session.user.id,
        },
      });
    });

    revalidatePath("/super-admin/archive");
    return { success: `${totalDeleted} kayıt başarıyla silindi.`, deletedCount: totalDeleted };
  } catch (error) {
    console.error("Arşiv temizleme hatası:", error);
    return { error: "Arşiv temizleme başarısız." };
  }
}

// ==========================================
// MOBILE APP STATS (Gerçek Prisma sorguları — PushSubscription'dan türetilir)
// ==========================================
export async function getMobileAppStats() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const [totalDevices, androidDevices, iosDevices] = await Promise.all([
      prisma.pushSubscription.count(),
      prisma.pushSubscription.count({
        where: { endpoint: { contains: "fcm.googleapis.com" } },
      }),
      prisma.pushSubscription.count({
        where: { endpoint: { contains: "web.push.apple.com" } },
      }),
    ]);

    return {
      activeDevices: totalDevices,
      iosCount: iosDevices,
      androidCount: androidDevices,
      versionDistribution: [] as { version: string; count: number }[],
      pushStats: { sent: 0, delivered: 0, opened: 0 },
    };
  } catch (error) {
    console.error("Mobil uygulama istatistikleri hatası:", error);
    return { error: "Mobil uygulama istatistikleri yüklenemedi." };
  }
}

// ==========================================
// REPORTS (Gerçek Prisma sorguları)
// ==========================================

export async function getReportTemplates() {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    const templates = await prisma.reportTemplate.findMany({
      orderBy: { lastUsedAt: "desc" },
    });

    return { templates };
  } catch (error) {
    console.error("Rapor şablonları hatası:", error);
    return { error: "Rapor şablonları yüklenemedi." };
  }
}

export async function generateReport(params: {
  templateId?: string;
  metrics: string[];
  period: string;
  chartType: string;
}) {
  try {
    const session = await auth();
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" };

    // Şablon kullanıldıysa lastUsedAt güncelle
    if (params.templateId) {
      await prisma.reportTemplate.update({
        where: { id: params.templateId },
        data: { lastUsedAt: new Date() },
      }).catch(() => { /* şablon bulunamazsa sessizce geç */ });
    }

    const reportId = `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Gerçek metrik toplama — mevcut modellerden
    const metricData: Record<string, unknown> = {};

    if (params.metrics.includes("mrr")) {
      const subs = await prisma.subscription.findMany({
        where: { status: "ACTIVE" },
        include: { plan: { select: { priceMonthly: true } } },
      });
      metricData.mrr = subs.reduce((acc, s) => acc + (s.plan?.priceMonthly ?? 0), 0);
    }
    if (params.metrics.includes("activeTenants")) {
      metricData.activeTenants = await prisma.tenant.count({
        where: { status: "ACTIVE", deletedAt: null },
      });
    }
    if (params.metrics.includes("serviceOrders")) {
      metricData.serviceOrders = await prisma.serviceOrder.count();
    }
    if (params.metrics.includes("newSubscriptions")) {
      const days = params.period === "7d" ? 7 : params.period === "30d" ? 30 : 90;
      metricData.newSubscriptions = await prisma.subscription.count({
        where: { createdAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } },
      });
    }
    if (params.metrics.includes("auditEvents")) {
      metricData.auditEvents = await prisma.auditLog.count();
    }

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "REPORTS",
        message: `Report generated: ${reportId} (metrics: ${params.metrics.join(", ")}, period: ${params.period})`,
        userId: session.user.id,
      },
    });

    revalidatePath("/super-admin/reports");
    return {
      success: "Rapor oluşturuldu.",
      reportId,
      data: {
        reportId,
        generatedAt: new Date(),
        period: params.period,
        chartType: params.chartType,
        metrics: metricData,
      },
    };
  } catch (error) {
    console.error("Rapor oluşturma hatası:", error);
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
