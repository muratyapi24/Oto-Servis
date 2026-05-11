"use server";

import { prisma } from "@repo/database";
import { guardTenant } from "@/lib/guards";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// getReferralInfo — Tenant'ın referral kodu ve istatistikleri
// ---------------------------------------------------------------------------
export async function getReferralInfo() {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true, settings: true, name: true },
  });
  if (!tenant) return { error: "Firma bulunamadı." };

  const referralCode = tenant.slug ?? tenantId.slice(0, 8);
  const appUrl = process.env.NEXTAUTH_URL ?? "https://bstoto.com";
  const referralUrl = `${appUrl}/register?ref=${referralCode}`;

  // Bu tenant'ı referans gösterenleri say
  const referredCount = await prisma.tenant.count({
    where: {
      settings: { path: ["referredBySlug"], equals: referralCode },
    },
  });

  // Credited months
  const settings = (tenant.settings as Record<string, unknown>) ?? {};
  const creditedMonths = (settings.referralCreditMonths as number) ?? 0;

  return {
    referralCode,
    referralUrl,
    referredCount,
    creditedMonths,
    pendingCount: Math.max(0, referredCount - creditedMonths),
  };
}

// ---------------------------------------------------------------------------
// applyReferralCode — Yeni kayıt sırasında referral kodu kaydet
// Sadece registerTenant içinden çağrılır
// ---------------------------------------------------------------------------
export async function applyReferralCode(newTenantId: string, refCode: string) {
  if (!refCode || !newTenantId) return;

  // Referral kodunun geçerli bir tenant'a ait olduğunu doğrula
  const referrer = await prisma.tenant.findFirst({
    where: { slug: refCode, status: "ACTIVE" },
    select: { id: true },
  });
  if (!referrer || referrer.id === newTenantId) return;

  await prisma.tenant.update({
    where: { id: newTenantId },
    data: {
      settings: {
        referredBySlug: refCode,
        referredAt: new Date().toISOString(),
      },
    },
  });
}

// ---------------------------------------------------------------------------
// processReferralRewards — Aylık cron: ücretli aboneliğe geçen referred tenant'lar
// için referrer'a 1 ay kredi ver
// ---------------------------------------------------------------------------
export async function processReferralRewards() {
  // Paid subscriptions with referredBySlug — raw JSON filter
  const referredTenants = await prisma.tenant.findMany({
    where: { settings: { path: ["referredBySlug"], not: null } } as any,
    take: 100,
  });

  // JS-side filter: only process those without credit already given and with active paid subscription
  const eligibleTenants: typeof referredTenants = [];
  for (const t of referredTenants) {
    const s = (t.settings as Record<string, unknown>) ?? {};
    if (s.referralCreditGiven) continue;
    const sub = await prisma.subscription.findFirst({
      where: { tenantId: t.id, status: "ACTIVE" },
      include: { plan: true },
    });
    if (!sub || Number((sub as any).plan?.priceMonthly ?? 0) === 0) continue;
    eligibleTenants.push(t);
  }

  for (const tenant of eligibleTenants) {
    const refSlug = ((tenant.settings as Record<string, unknown>)?.referredBySlug as string);
    if (!refSlug) continue;

    const referrer = await prisma.tenant.findFirst({
      where: { slug: refSlug },
      select: { id: true, settings: true },
    });
    if (!referrer) continue;

    // Referrer'a 1 ay kredi ekle (subscription'ı 30 gün uzat)
    const referrerSub = await prisma.subscription.findFirst({ where: { tenantId: referrer.id } });
    if (referrerSub?.currentPeriodEnd) {
      const newEnd = new Date(referrerSub.currentPeriodEnd);
      newEnd.setDate(newEnd.getDate() + 30);
      await prisma.subscription.update({
        where: { id: referrerSub.id },
        data: { currentPeriodEnd: newEnd },
      });

      // Referrer settings güncelle
      const referrerSettings = (referrer.settings as Record<string, unknown>) ?? {};
      await prisma.tenant.update({
        where: { id: referrer.id },
        data: {
          settings: {
            ...referrerSettings,
            referralCreditMonths: ((referrerSettings.referralCreditMonths as number) ?? 0) + 1,
          },
        },
      });
    }

    // Referred tenant'ı işaretli yap
    const tenantSettings = (tenant.settings as Record<string, unknown>) ?? {};
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { settings: { ...tenantSettings, referralCreditGiven: true } },
    });

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "REFERRAL",
        message: `Referral kredisi verildi: ${referrer.id} ← ${tenant.id}`,
      },
    });
  }

  return { processed: eligibleTenants.length };
}
