"use server";

import { prisma } from "@repo/database";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getUsageSummary, getSubscriptionInfo } from "@/lib/subscription-guard";

/**
 * Tenant'ın kendi abonelik bilgisini ve kullanım özetini getirir.
 * Dashboard → Ayarlar → Abonelik & Fatura sayfasında kullanılır.
 */
export async function getMySubscription() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim." };

    const tenantId = session.user.tenantId;

    // Abonelik bilgisi
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      return {
        subscription: null,
        plans: await getAvailablePlans(),
        usage: null,
      };
    }

    // Kullanım özeti
    const usage = await getUsageSummary(tenantId);

    // Mevcut plan bilgisi (serialize)
    const currentPlan = {
      id: subscription.plan.id,
      name: subscription.plan.name,
      slug: subscription.plan.slug,
      description: subscription.plan.description,
      priceMonthly: subscription.plan.priceMonthly,
      priceYearly: subscription.plan.priceYearly,
      currency: subscription.plan.currency,
      trialDays: subscription.plan.trialDays,
    };

    // Kalan gün
    let daysRemaining: number | undefined;
    if (subscription.currentPeriodEnd) {
      const diff = new Date(subscription.currentPeriodEnd).getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    return {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        startDate: subscription.startDate,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        cancelledAt: subscription.cancelledAt,
        daysRemaining,
      },
      currentPlan,
      usage,
      plans: await getAvailablePlans(),
    };
  } catch (error) {
    console.error("getMySubscription Hatası:", error);
    return { error: "Abonelik bilgileri yüklenemedi." };
  }
}

/**
 * Tüm aktif planları getirir (tenant self-service plan seçimi için).
 */
async function getAvailablePlans() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      priceMonthly: true,
      priceYearly: true,
      currency: true,
      trialDays: true,
      features: true,
      limits: true,
    },
  });

  return plans;
}

/**
 * Plan karşılaştırma tablosu verilerini getirir.
 */
export async function getPlanComparisonTable() {
  try {
    const features = await prisma.planFeature.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });

    return { features };
  } catch (error) {
    console.error("getPlanComparisonTable Hatası:", error);
    return { error: "Plan karşılaştırma tablosu alınamadı." };
  }
}

/**
 * Tenant kendi paketini yükseltme talebi gönderir.
 * NOT: Gerçek ödeme entegrasyonu (iyzico/PayTR) sonraki fazda eklenecek.
 * Şimdilik bir "upgrade request" kaydı oluşturulup admin'e bildirim gönderiliyor.
 */
export async function requestPlanUpgrade(newPlanId: string) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim." };

    const tenantId = session.user.tenantId;

    // Hedef planı doğrula
    const targetPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: newPlanId, isActive: true },
    });

    if (!targetPlan) return { error: "Seçilen plan bulunamadı." };

    // Mevcut aboneliği kontrol et
    const currentSub = await prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (currentSub && currentSub.planId === newPlanId) {
      return { error: "Zaten bu paketi kullanıyorsunuz." };
    }

    // Aynı veya daha düşük fiyatlı bir plana geçiş kontrolü
    if (currentSub && targetPlan.priceMonthly <= currentSub.plan.priceMonthly) {
      return { error: "Mevcut paketinizden daha düşük veya eşit bir paket seçemezsiniz. İndirim için destek ile iletişime geçin." };
    }

    // Aboneliği güncelle (ödeme entegrasyonu sonra)
    if (currentSub) {
      await prisma.subscription.update({
        where: { id: currentSub.id },
        data: {
          planId: newPlanId,
          status: "ACTIVE",
          cancelledAt: null,
          cancelAtPeriodEnd: false,
          metadata: {
            ...(typeof currentSub.metadata === "object" ? currentSub.metadata as Record<string, unknown> : {}),
            lastUpgrade: new Date().toISOString(),
            previousPlanId: currentSub.planId,
            upgradedBy: session.user.id,
          },
        },
      });
    } else {
      // Abonelik yoksa oluştur
      await prisma.subscription.create({
        data: {
          tenantId,
          planId: newPlanId,
          status: "ACTIVE",
          startDate: new Date(),
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 gün
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "SUBSCRIPTION",
        message: `Plan yükseltme: ${currentSub?.plan.name || "Yok"} → ${targetPlan.name}`,
        userId: session.user.id,
        tenantId,
      },
    });

    revalidatePath("/dashboard/settings/billing");
    revalidatePath("/dashboard/settings");
    return { success: `Paketiniz "${targetPlan.name}" olarak güncellendi!` };
  } catch (error) {
    console.error("requestPlanUpgrade Hatası:", error);
    return { error: "Paket yükseltme işlemi sırasında bir hata oluştu." };
  }
}

/**
 * Abonelik iptal talebi (dönem sonunda geçerli).
 */
export async function requestCancelSubscription(reason?: string) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim." };

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: session.user.tenantId },
    });

    if (!subscription) return { error: "Aktif abonelik bulunamadı." };

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        cancellationReason: reason || "Kullanıcı talebi",
        metadata: {
          ...(typeof subscription.metadata === "object" ? subscription.metadata as Record<string, unknown> : {}),
          cancellationRequestedAt: new Date().toISOString(),
          cancellationRequestedBy: session.user.id,
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        level: "WARNING",
        module: "SUBSCRIPTION",
        message: `Abonelik iptal talebi: ${reason || "Kullanıcı talebi"}`,
        userId: session.user.id,
        tenantId: session.user.tenantId,
      },
    });

    revalidatePath("/dashboard/settings/billing");
    return { success: "İptal talebiniz alındı. Aboneliğiniz mevcut dönem sonunda iptal edilecektir." };
  } catch (error) {
    console.error("requestCancelSubscription Hatası:", error);
    return { error: "İptal işlemi sırasında bir hata oluştu." };
  }
}
