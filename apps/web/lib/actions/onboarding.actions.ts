"use server";

import { guardTenant } from "@/lib/guards";

import { prisma } from "@repo/database";
import { revalidatePath } from "next/cache";

/**
 * Tenant'ın onboarding tamamlanma durumunu kontrol eder.
 * Dashboard layout'ta çağrılır — onboarding tamamlanmamışsa redirect.
 */
export async function checkOnboardingStatus(): Promise<{
  completed: boolean;
  currentStep?: number;
}> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g; // session yoksa engelleme

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    if (!tenant) return { completed: true };

    const settings = (tenant.settings as Record<string, unknown>) || {};
    const onboardingCompleted = settings.onboardingCompleted === true;
    const currentStep = typeof settings.onboardingStep === "number" ? settings.onboardingStep : 0;

    return { completed: onboardingCompleted, currentStep };
  } catch {
    return { completed: true }; // Hata durumunda engelleme yapma
  }
}

/**
 * Onboarding adımını günceller (adım kaydedilir, her adımda progress korunur).
 */
export async function saveOnboardingStep(step: number, data: Record<string, unknown>) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    const currentSettings = (tenant?.settings as Record<string, unknown>) || {};

    // Adım verilerini kaydet
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...currentSettings,
          onboardingStep: step,
          [`onboarding_step_${step}`]: data,
        } as any,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("saveOnboardingStep hatası:", error);
    return { error: "Adım kaydedilemedi." };
  }
}

/**
 * Adım 1: Firma bilgilerini günceller.
 */
export async function completeOnboardingStep1(data: {
  name: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  taxOffice?: string;
  address?: string;
  city?: string;
}) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        taxNumber: data.taxNumber || null,
        taxOffice: data.taxOffice || null,
        address: data.address || null,
        city: data.city || null,
      },
    });

    await saveOnboardingStep(1, data);
    return { success: true };
  } catch (error) {
    console.error("completeOnboardingStep1 hatası:", error);
    return { error: "Firma bilgileri kaydedilemedi." };
  }
}

/**
 * Adım 2: Logo ve tema ayarları.
 */
export async function completeOnboardingStep2(data: {
  logoUrl?: string;
  slogan?: string;
  theme?: string;
}) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    const currentSettings = (tenant?.settings as Record<string, unknown>) || {};

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        logoUrl: data.logoUrl || null,
        slogan: data.slogan || null,
        settings: {
          ...currentSettings,
          theme: data.theme || "system",
          onboardingStep: 2,
        } as any,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("completeOnboardingStep2 hatası:", error);
    return { error: "Logo ve tema ayarları kaydedilemedi." };
  }
}

/**
 * Adım 3: İlk hizmet tanımları.
 */
export async function completeOnboardingStep3(data: {
  serviceTypes?: string[];
  openingHoursWeekdays?: string;
  openingHoursSaturday?: string;
  openingHoursSunday?: string;
}) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    const currentSettings = (tenant?.settings as Record<string, unknown>) || {};

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...currentSettings,
          serviceTypes: data.serviceTypes || [],
          openingHours: {
            weekdays: data.openingHoursWeekdays || "08:30 - 18:30",
            saturday: data.openingHoursSaturday || "09:00 - 15:00",
            sunday: data.openingHoursSunday || "Kapalı",
          },
          onboardingStep: 3,
        } as any,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("completeOnboardingStep3 hatası:", error);
    return { error: "Hizmet bilgileri kaydedilemedi." };
  }
}

/**
 * Adım 4: Onboarding tamamla.
 */
export async function completeOnboarding() {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId, session } = g;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    const currentSettings = (tenant?.settings as Record<string, unknown>) || {};

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...currentSettings,
          onboardingCompleted: true,
          onboardingCompletedAt: new Date().toISOString(),
          onboardingStep: 4,
        } as any,
      },
    });

    await prisma.auditLog.create({
      data: {
        level: "INFO",
        module: "ONBOARDING",
        message: "Firma kurulum sihirbazı tamamlandı.",
        userId: session.user.id,
        tenantId: tenantId,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("completeOnboarding hatası:", error);
    return { error: "Kurulum tamamlanamadı." };
  }
}
