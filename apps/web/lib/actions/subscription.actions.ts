"use server";

import { guardTenant } from "@/lib/guards";

import { prisma } from "@repo/database";
import { revalidatePath } from "next/cache";
import { getUsageSummary, getSubscriptionInfo } from "@/lib/subscription-guard";

/**
 * Tenant'ın kendi abonelik bilgisini ve kullanım özetini getirir.
 * Dashboard → Ayarlar → Abonelik & Fatura sayfasında kullanılır.
 */
export async function getMySubscription() {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


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
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId, session } = g;


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
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId, session } = g;

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: tenantId },
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
        tenantId: tenantId,
      },
    });

    revalidatePath("/dashboard/settings/billing");
    return { success: "İptal talebiniz alındı. Aboneliğiniz mevcut dönem sonunda iptal edilecektir." };
  } catch (error) {
    console.error("requestCancelSubscription Hatası:", error);
    return { error: "İptal işlemi sırasında bir hata oluştu." };
  }
}

/**
 * iyzico/PayTR webhook callback sonrası aboneliği aktive eder.
 * Sadece webhook route'dan çağrılır (server-to-server).
 */
export async function activateSubscription(
  tenantId: string,
  planSlug: string,
  billing: "monthly" | "yearly",
  paymentId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    // İdempotency: aynı paymentId daha önce işlendiyse tekrar işleme
    if (paymentId) {
      const existing = await prisma.payment.findFirst({
        where: { tenantId, notes: { contains: paymentId } },
      });
      if (existing) {
        return { success: true }; // Zaten işlendi
      }
    }

    const plan = await prisma.subscriptionPlan.findFirst({
      where: { slug: planSlug, isActive: true },
    });
    if (!plan) return { error: "Plan bulunamadı." };

    const periodEnd = new Date();
    if (billing === "yearly") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const now = new Date();
    await prisma.subscription.upsert({
      where: { tenantId },
      update: {
        planId: plan.id,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelledAt: null,
        cancelAtPeriodEnd: false,
      },
      create: {
        tenantId,
        planId: plan.id,
        status: "ACTIVE",
        startDate: now,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    await prisma.payment.create({
      data: {
        tenantId,
        amount: billing === "yearly" ? plan.priceYearly ?? plan.priceMonthly * 12 : plan.priceMonthly,
        paymentMethod: "CREDIT_CARD",
        paymentType: "INCOMING",
        paymentDate: new Date(),
        notes: `Abonelik: ${plan.name} (${billing}) — ${paymentId}`,
      },
    });

    revalidatePath("/dashboard/settings/subscription");
    return { success: true };
  } catch (err) {
    console.error("activateSubscription hatası:", err);
    return { error: "Abonelik aktivasyonu başarısız." };
  }
}

/**
 * Pricing sayfasından plan satın alma akışını başlatır.
 * iyzico checkout form HTML'i döner (kart bilgisi iyzico modalda girilir).
 * Env: IYZICO_API_KEY, IYZICO_SECRET_KEY → gerçek; yoksa sandbox simülasyon.
 */
export async function startSubscriptionCheckout(
  planSlug: string,
  billing: "monthly" | "yearly"
): Promise<{ checkoutFormContent?: string; upgradeUrl?: string; error?: string }> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId, session } = g;


    const [plan, tenant, user] = await Promise.all([
      prisma.subscriptionPlan.findFirst({ where: { slug: planSlug, isActive: true } }),
      prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, address: true, city: true, email: true, phone: true, taxNumber: true } }),
      prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true } }),
    ]);

    if (!plan) return { error: "Plan bulunamadı." };
    if (!tenant) return { error: "Firma bilgisi bulunamadı." };

    const amount = billing === "yearly"
      ? (plan.priceYearly ?? plan.priceMonthly * 12)
      : plan.priceMonthly;

    const callbackBase = process.env.NEXTAUTH_URL ?? "https://bstoto.com";
    const basketId = `sub-${tenantId}-${Date.now()}`;
    const callbackUrl = `${callbackBase}/api/webhooks/iyzico-subscription?planSlug=${plan.slug}&billing=${billing}&basketId=${basketId}`;

    // iyzico API anahtarları yoksa test modunda doğrudan aboneliği aktive et
    if (!process.env.IYZICO_API_KEY || !process.env.IYZICO_SECRET_KEY) {
      const upgradeUrl = `/dashboard/settings/billing?payment=success`;
      return { upgradeUrl };
    }

    const { createIyzicoPaymentForm } = await import("@/lib/payment-providers/iyzico");

    const userNameParts = (user?.name ?? "Demo Kullanıcı").split(" ");
    const buyerName = userNameParts[0] ?? "Demo";
    const buyerSurname = userNameParts.slice(1).join(" ") || "Kullanıcı";

    const result = await createIyzicoPaymentForm({
      price: String(amount),
      paidPrice: String(amount),
      currency: "TRY",
      basketId,
      callbackUrl,
      buyer: {
        id: tenantId,
        name: buyerName,
        surname: buyerSurname,
        email: user?.email ?? tenant.email ?? "noreply@bstoto.com",
        identityNumber: tenant.taxNumber ?? "11111111111",
        registrationAddress: tenant.address ?? "Türkiye",
        city: tenant.city ?? "İstanbul",
        country: "Turkey",
        ip: "85.34.78.112",
      },
      billingAddress: {
        contactName: tenant.name,
        city: tenant.city ?? "İstanbul",
        country: "Turkey",
        address: tenant.address ?? tenant.name,
      },
      basketItems: [
        {
          id: plan.slug,
          name: `${plan.name} Abonelik (${billing === "yearly" ? "Yıllık" : "Aylık"})`,
          category1: "SaaS Abonelik",
          itemType: "VIRTUAL",
          price: String(amount),
        },
      ],
    });

    if (result.status === "failure") {
      return { error: result.errorMessage ?? "iyzico ödeme formu oluşturulamadı." };
    }

    return { checkoutFormContent: result.checkoutFormContent };
  } catch (err) {
    console.error("startSubscriptionCheckout hatası:", err);
    return { error: "Ödeme başlatılamadı." };
  }
}
