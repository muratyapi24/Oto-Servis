/**
 * Subscription Guard — Abonelik Limitleri Kontrol Modülü
 * 
 * Tenant'ın sahip olduğu SubscriptionPlan'daki `limits` ve `features` JSON
 * alanlarına göre runtime limitleri enforce eder.
 * 
 * Limits JSON yapısı (örnek):
 * {
 *   "maxUsers": 1,
 *   "maxMechanics": 2,
 *   "maxVehicles": 50,
 *   "maxCustomers": 100,
 *   "maxLocations": 1,
 *   "maxSmsPerMonth": 100,
 *   "maxWhatsappPerMonth": 50,
 *   "maxStorageMB": 500
 * }
 * 
 * Features JSON yapısı (örnek):
 * {
 *   "eInvoice": false,
 *   "whatsapp": false,
 *   "bulkNotifications": false,
 *   "advancedReporting": false,
 *   "multiLocation": false,
 *   "parasutIntegration": false,
 *   "apiAccess": false,
 *   "prioritySupport": false
 * }
 */

import { prisma } from "@repo/database";

// ---------------------------------------------------------------------------
// Tipler
// ---------------------------------------------------------------------------

export interface PlanLimits {
  maxUsers: number;
  maxMechanics: number;
  maxVehicles: number;
  maxCustomers: number;
  maxLocations: number;
  maxSmsPerMonth: number;
  maxWhatsappPerMonth: number;
  maxStorageMB: number;
  [key: string]: number;
}

export interface PlanFeatures {
  eInvoice: boolean;
  whatsapp: boolean;
  bulkNotifications: boolean;
  advancedReporting: boolean;
  multiLocation: boolean;
  parasutIntegration: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  [key: string]: boolean;
}

export interface SubscriptionInfo {
  status: string;
  planName: string;
  planSlug: string;
  limits: PlanLimits;
  features: PlanFeatures;
  trialDays: number;
  currentPeriodEnd: Date | null;
  isExpired: boolean;
  isSuspended: boolean;
  isActive: boolean;
}

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  message?: string;
}

export interface FeatureCheckResult {
  allowed: boolean;
  message?: string;
}

// ---------------------------------------------------------------------------
// Varsayılan limitler (plan bulunamazsa en kısıtlı hali)
// ---------------------------------------------------------------------------

const DEFAULT_LIMITS: PlanLimits = {
  maxUsers: 1,
  maxMechanics: 2,
  maxVehicles: 50,
  maxCustomers: 100,
  maxLocations: 1,
  maxSmsPerMonth: 50,
  maxWhatsappPerMonth: 0,
  maxStorageMB: 100,
};

const DEFAULT_FEATURES: PlanFeatures = {
  eInvoice: false,
  whatsapp: false,
  bulkNotifications: false,
  advancedReporting: false,
  multiLocation: false,
  parasutIntegration: false,
  apiAccess: false,
  prioritySupport: false,
};

// ---------------------------------------------------------------------------
// Ana fonksiyonlar
// ---------------------------------------------------------------------------

/**
 * Bir tenant'ın aktif abonelik bilgisini getirir.
 * Cache-friendly: server action veya middleware'den çağrılabilir.
 */
export async function getSubscriptionInfo(tenantId: string): Promise<SubscriptionInfo | null> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!subscription || !subscription.plan) {
      return null;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { status: true },
    });

    const limits = {
      ...DEFAULT_LIMITS,
      ...(typeof subscription.plan.limits === "object" ? subscription.plan.limits as Record<string, number> : {}),
    } as PlanLimits;

    const features = {
      ...DEFAULT_FEATURES,
      ...(typeof subscription.plan.features === "object" ? subscription.plan.features as Record<string, boolean> : {}),
    } as PlanFeatures;

    const now = new Date();
    const isExpired =
      subscription.status === "EXPIRED" ||
      (subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) < now : false);

    const isSuspended = tenant?.status === "SUSPENDED";

    const isActive =
      !isExpired &&
      !isSuspended &&
      (subscription.status === "ACTIVE" || subscription.status === "TRIAL");

    return {
      status: subscription.status,
      planName: subscription.plan.name,
      planSlug: subscription.plan.slug,
      limits,
      features,
      trialDays: subscription.plan.trialDays,
      currentPeriodEnd: subscription.currentPeriodEnd,
      isExpired,
      isSuspended,
      isActive,
    };
  } catch (error) {
    console.error("[SubscriptionGuard] getSubscriptionInfo hatası:", error);
    return null;
  }
}

/**
 * Belirli bir limit türünü kontrol eder.
 * Mevcut kullanım miktarını veritabanından sayar ve limite göre karşılaştırır.
 * 
 * @param tenantId - Kontrol edilecek tenant
 * @param limitKey - Limit anahtarı (ör: "maxUsers", "maxMechanics", "maxCustomers")
 * @returns LimitCheckResult
 */
export async function checkLimit(
  tenantId: string,
  limitKey: keyof PlanLimits
): Promise<LimitCheckResult> {
  const info = await getSubscriptionInfo(tenantId);

  if (!info) {
    // Abonelik yoksa varsayılan limitleri kullan
    return { allowed: true, current: 0, limit: DEFAULT_LIMITS[limitKey] ?? 999 };
  }

  if (!info.isActive) {
    return {
      allowed: false,
      current: 0,
      limit: 0,
      message: info.isSuspended
        ? "Hesabınız askıya alınmıştır. Lütfen yönetici ile iletişime geçin."
        : info.isExpired
        ? "Aboneliğinizin süresi dolmuştur. Lütfen paketinizi yenileyin."
        : "Aboneliğiniz aktif değil.",
    };
  }

  const limit = info.limits[limitKey];
  
  // 0 veya negatif limit = sınırsız
  if (!limit || limit <= 0) {
    return { allowed: true, current: 0, limit: 0 };
  }

  // Mevcut kullanım miktarını hesapla
  const current = await countCurrentUsage(tenantId, limitKey as string);

  if (current >= limit) {
    const limitLabels: Record<string, string> = {
      maxUsers: "kullanıcı",
      maxMechanics: "personel (usta)",
      maxVehicles: "araç",
      maxCustomers: "müşteri",
      maxLocations: "lokasyon/şube",
      maxSmsPerMonth: "aylık SMS",
      maxWhatsappPerMonth: "aylık WhatsApp mesajı",
      maxStorageMB: "MB depolama alanı",
    };

    return {
      allowed: false,
      current,
      limit,
      message: `"${info.planName}" paketinizde maksimum ${limit} ${limitLabels[limitKey] || limitKey} hakkınız bulunmaktadır. Mevcut: ${current}. Daha fazlası için paketinizi yükseltin.`,
    };
  }

  return { allowed: true, current, limit };
}

/**
 * Belirli bir özelliğin aktif olup olmadığını kontrol eder.
 * 
 * @param tenantId - Kontrol edilecek tenant
 * @param featureKey - Özellik anahtarı (ör: "eInvoice", "whatsapp", "multiLocation")
 * @returns FeatureCheckResult
 */
export async function checkFeature(
  tenantId: string,
  featureKey: keyof PlanFeatures
): Promise<FeatureCheckResult> {
  const info = await getSubscriptionInfo(tenantId);

  if (!info) {
    return { allowed: false, message: "Abonelik bilgisi bulunamadı." };
  }

  if (!info.isActive) {
    return {
      allowed: false,
      message: info.isSuspended
        ? "Hesabınız askıya alınmıştır."
        : "Aboneliğiniz aktif değil.",
    };
  }

  const isEnabled = info.features[featureKey];

  if (!isEnabled) {
    const featureLabels: Record<string, string> = {
      eInvoice: "E-Fatura / E-Arşiv",
      whatsapp: "WhatsApp Bildirim",
      bulkNotifications: "Toplu Bildirim Kampanyası",
      advancedReporting: "Gelişmiş Raporlama",
      multiLocation: "Çoklu Lokasyon/Şube",
      parasutIntegration: "Paraşüt Muhasebe Entegrasyonu",
      apiAccess: "API Erişimi",
      prioritySupport: "Öncelikli Destek",
    };

    return {
      allowed: false,
      message: `"${featureLabels[featureKey] || featureKey}" özelliği "${info.planName}" paketinizde bulunmamaktadır. Bu özelliği kullanmak için paketinizi yükseltin.`,
    };
  }

  return { allowed: true };
}

/**
 * Tenant'ın aktif bir aboneliğinin (TRIAL veya ACTIVE) olup olmadığını kontrol eder.
 * Middleware ve dashboard layout'ta kullanılır.
 */
export async function checkSubscriptionActive(tenantId: string): Promise<{
  active: boolean;
  status?: string;
  message?: string;
  daysRemaining?: number;
}> {
  const info = await getSubscriptionInfo(tenantId);

  if (!info) {
    return {
      active: false,
      status: "NONE",
      message: "Aktif aboneliğiniz bulunmamaktadır. Lütfen bir paket seçin.",
    };
  }

  if (info.isSuspended) {
    return {
      active: false,
      status: "SUSPENDED",
      message: "Hesabınız askıya alınmıştır. Lütfen destek ekibiyle iletişime geçin.",
    };
  }

  if (info.isExpired) {
    return {
      active: false,
      status: "EXPIRED",
      message: "Aboneliğinizin süresi dolmuştur. Lütfen paketinizi yenileyin.",
    };
  }

  if (info.status === "CANCELLED") {
    return {
      active: false,
      status: "CANCELLED",
      message: "Aboneliğiniz iptal edilmiştir. Yeniden aktifleştirmek için bir paket seçin.",
    };
  }

  if (info.status === "PAST_DUE") {
    return {
      active: true, // Hala kullanılabilir ama uyarı gösterilir
      status: "PAST_DUE",
      message: "Ödemeniz gecikmiştir. Lütfen en kısa sürede ödemenizi gerçekleştirin.",
    };
  }

  // Kalan gün hesabı (trial veya active dönem sonu)
  let daysRemaining: number | undefined;
  if (info.currentPeriodEnd) {
    const diff = new Date(info.currentPeriodEnd).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return {
    active: true,
    status: info.status,
    daysRemaining,
  };
}

// ---------------------------------------------------------------------------
// Yardımcı: Mevcut kullanım sayacı
// ---------------------------------------------------------------------------

async function countCurrentUsage(tenantId: string, limitKey: string): Promise<number> {
  try {
    switch (limitKey) {
      case "maxUsers":
        return prisma.user.count({
          where: { tenantId, isActive: true },
        });

      case "maxMechanics":
        return prisma.mechanic.count({
          where: { tenantId, deletedAt: null, isActive: true },
        });

      case "maxVehicles":
        return prisma.vehicle.count({
          where: { deletedAt: null, customer: { tenantId } },
        });

      case "maxCustomers":
        return prisma.customer.count({
          where: { tenantId, deletedAt: null },
        });

      case "maxLocations":
        return prisma.location.count({
          where: { tenantId, isActive: true },
        });

      case "maxSmsPerMonth": {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        return prisma.notification.count({
          where: {
            tenantId,
            type: "SMS",
            status: "SENT",
            sentAt: { gte: startOfMonth },
          },
        });
      }

      case "maxWhatsappPerMonth": {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        return prisma.notification.count({
          where: {
            tenantId,
            type: "WHATSAPP",
            status: "SENT",
            sentAt: { gte: startOfMonth },
          },
        });
      }

      default:
        return 0;
    }
  } catch (error) {
    console.error(`[SubscriptionGuard] ${limitKey} sayımı hatası:`, error);
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Tenant dashboard'unda gösterilecek kullanım özeti
// ---------------------------------------------------------------------------

export async function getUsageSummary(tenantId: string): Promise<{
  planName: string;
  status: string;
  daysRemaining?: number;
  usage: Array<{
    key: string;
    label: string;
    current: number;
    limit: number;
    percentage: number;
  }>;
  features: Array<{
    key: string;
    label: string;
    enabled: boolean;
  }>;
} | null> {
  const info = await getSubscriptionInfo(tenantId);
  if (!info) return null;

  const usageKeys: Array<{ key: keyof PlanLimits; label: string }> = [
    { key: "maxUsers", label: "Kullanıcılar" },
    { key: "maxMechanics", label: "Personel (Usta)" },
    { key: "maxCustomers", label: "Müşteriler" },
    { key: "maxVehicles", label: "Araçlar" },
    { key: "maxLocations", label: "Lokasyonlar" },
    { key: "maxSmsPerMonth", label: "SMS (Bu Ay)" },
    { key: "maxWhatsappPerMonth", label: "WhatsApp (Bu Ay)" },
  ];

  const usage = await Promise.all(
    usageKeys.map(async ({ key, label }) => {
      const limit = info.limits[key] ?? 0;
      const current = limit > 0 ? await countCurrentUsage(tenantId, key as string) : 0;
      const percentage = limit > 0 ? Math.round((current / limit) * 100) : 0;
      return { key: key as string, label, current, limit, percentage };
    })
  );

  const featureKeys: Array<{ key: keyof PlanFeatures; label: string }> = [
    { key: "eInvoice", label: "E-Fatura / E-Arşiv" },
    { key: "whatsapp", label: "WhatsApp Bildirim" },
    { key: "bulkNotifications", label: "Toplu Bildirim" },
    { key: "advancedReporting", label: "Gelişmiş Raporlama" },
    { key: "multiLocation", label: "Çoklu Lokasyon" },
    { key: "parasutIntegration", label: "Paraşüt Entegrasyonu" },
    { key: "apiAccess", label: "API Erişimi" },
    { key: "prioritySupport", label: "Öncelikli Destek" },
  ];

  const features = featureKeys.map(({ key, label }) => ({
    key: key as string,
    label,
    enabled: info.features[key] ?? false,
  }));

  let daysRemaining: number | undefined;
  if (info.currentPeriodEnd) {
    const diff = new Date(info.currentPeriodEnd).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return {
    planName: info.planName,
    status: info.status,
    daysRemaining,
    usage: usage.filter((u) => u.limit > 0), // Sınırsız olanları gösterme
    features,
  };
}
