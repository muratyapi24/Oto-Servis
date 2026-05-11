"use server";

import { auth } from "@/auth";
import type { Session } from "next-auth";
import {
  getSubscriptionInfo,
  checkLimit,
  checkFeature,
} from "@/lib/subscription-guard";

type AppRole =
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "MECHANIC"
  | "RECEPTIONIST"
  | "ACCOUNTANT"
  | "CUSTOMER";

// ---------------------------------------------------------------------------
// requireSession — session yoksa hata fırlatır
// ---------------------------------------------------------------------------
export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Oturum açmanız gerekiyor.");
  }
  return session;
}

// ---------------------------------------------------------------------------
// requireTenant — session + tenantId yoksa hata fırlatır
// Döner: { session, tenantId }
// ---------------------------------------------------------------------------
export async function requireTenant() {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    throw new Error("Yetkisiz erişim: tenant bilgisi eksik.");
  }
  return { session, tenantId };
}

// ---------------------------------------------------------------------------
// requireRole — izin verilen roller dışındaysa hata fırlatır
// Örnek: await requireRole(["TENANT_ADMIN", "ACCOUNTANT"])
// ---------------------------------------------------------------------------
export async function requireRole(allowedRoles: AppRole[]) {
  const { session, tenantId } = await requireTenant();
  const role = session.user.role as AppRole | undefined;

  if (!role || !allowedRoles.includes(role)) {
    throw new Error(
      `Yetkisiz erişim: bu işlem için [${allowedRoles.join(", ")}] rolü gereklidir.`
    );
  }

  return { session, tenantId, role };
}

// ---------------------------------------------------------------------------
// requireSuperAdmin — sadece SUPER_ADMIN rolüne izin verir
// ---------------------------------------------------------------------------
export async function requireSuperAdmin() {
  const session = await requireSession();
  if (session.user.role !== "SUPER_ADMIN") {
    throw new Error("Bu işlem sadece süper yöneticiler tarafından yapılabilir.");
  }
  return session;
}

// ---------------------------------------------------------------------------
// requireFeature — abonelik planında ilgili özellik açık değilse hata fırlatır
// Örnek: await requireFeature("whatsapp")
// ---------------------------------------------------------------------------
export async function requireFeature(feature: string) {
  const { session, tenantId } = await requireTenant();

  const result = await checkFeature(tenantId, feature as keyof import("@/lib/subscription-guard").PlanFeatures);
  if (!result.allowed) {
    throw new Error(
      `Bu özellik (${feature}) mevcut abonelik planınızda bulunmuyor. Planınızı yükseltiniz.`
    );
  }

  return { session, tenantId };
}

// ---------------------------------------------------------------------------
// requireLimit — belirli bir kaynağın limitini kontrol eder
// Örnek: await requireLimit("maxUsers", currentCount)
// ---------------------------------------------------------------------------
export async function requireLimit(limitKey: string) {
  const { session, tenantId } = await requireTenant();

  const result = await checkLimit(
    tenantId,
    limitKey as keyof import("@/lib/subscription-guard").PlanLimits
  );

  if (!result.allowed) {
    throw new Error(
      `Limit aşıldı: maksimum ${result.limit} kayıt oluşturabilirsiniz. Planınızı yükseltiniz.`
    );
  }

  return { session, tenantId };
}

// ---------------------------------------------------------------------------
// assertTenantIsolation — kaydın tenantId'si session ile eşleşmiyorsa hata fırlatır
// Böylece cross-tenant sorgular server action içinde önlenir.
// ---------------------------------------------------------------------------
export async function assertTenantIsolation(
  recordTenantId: string | null | undefined,
  sessionTenantId: string
): Promise<void> {
  if (recordTenantId !== sessionTenantId) {
    throw new Error("Yetkisiz erişim: farklı tenant kaydına erişim engellendi.");
  }
}

// ---------------------------------------------------------------------------
// guardTenantRole — action dosyaları için return-based guard (throw etmez)
// Kullanım: const g = await guardTenantRole(["TENANT_ADMIN", "ACCOUNTANT"]);
//           if ("error" in g) return g;
//           const { tenantId } = g;
// ---------------------------------------------------------------------------
type GuardSuccess = { session: Session; tenantId: string; role: AppRole };
type GuardError = { error: string };

export async function guardTenantRole(
  allowedRoles: AppRole[]
): Promise<GuardSuccess | GuardError> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return { error: "Yetkilendirme hatası: oturum bulunamadı." };
  }
  const role = session.user.role as AppRole | undefined;
  if (!role || (allowedRoles.length > 0 && !allowedRoles.includes(role))) {
    return {
      error: `Yetkisiz erişim: bu işlem için [${allowedRoles.join(", ")}] rolü gereklidir.`,
    };
  }
  return { session, tenantId: session.user.tenantId, role };
}

// ---------------------------------------------------------------------------
// guardTenant — rol kontrolü olmadan sadece tenant kontrolü (return-based)
// ---------------------------------------------------------------------------
export async function guardTenant(): Promise<
  { session: Session; tenantId: string } | GuardError
> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return { error: "Yetkilendirme hatası: oturum bulunamadı." };
  }
  return { session, tenantId: session.user.tenantId };
}

// ---------------------------------------------------------------------------
// require2FAVerified — 2FA aktif kullanıcı doğrulamamışsa hata fırlatır
// ---------------------------------------------------------------------------
export async function require2FAVerified() {
  const session = await requireSession();
  if (session.user.requiresTwoFactor && !session.user.twoFactorVerified) {
    throw new Error(
      "İki faktörlü doğrulama gerekiyor. Lütfen /dashboard/2fa adresini ziyaret edin."
    );
  }
  return session;
}
