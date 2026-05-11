"use server";

import { guardTenant } from "@/lib/guards";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";

export async function getNotificationProviders() {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const providers = await prisma.notificationProvider.findMany({
      where: { tenantId: tenantId },
      orderBy: { type: "asc" }
    });

    return { providers };
  } catch (error) {
    console.error("[getNotificationProviders] hatası:", error);
    Sentry.captureException(error);
    return { error: "Sağlayıcılar alınırken bir hata oluştu: " + (error instanceof Error ? error.message : String(error)) };
  }
}

export async function saveNotificationProvider(data: { type: string, provider: string, settings: any, isActive: boolean }) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId, session } = g;

    // Yalnızca admin ve super admin
    if (session.user.role !== "TENANT_ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return { error: "Bu işlem için yetkiniz yok" };
    }

    const { type, provider, settings, isActive } = data;

    // Aynı tür ve provider varsa güncelle, yoksa oluştur (upsert)
    // Ancak tenant için aktif olan tek bir SMS sağlayıcısı kalması iyi olabilir "isActive: true" yaparken
    // Diğer bu tipten olanları devre dışı bırakalım.
    if (isActive) {
      await prisma.notificationProvider.updateMany({
        where: { tenantId: tenantId, type },
        data: { isActive: false }
      });
    }

    const upserted = await prisma.notificationProvider.upsert({
      where: {
        tenantId_type_provider: {
          tenantId: tenantId,
          type,
          provider
        }
      },
      update: {
        settings,
        isActive
      },
      create: {
        tenantId: tenantId,
        type,
        provider,
        settings,
        isActive
      }
    });

    revalidatePath("/dashboard/settings/notifications");
    return { success: true, provider: upserted };

  } catch (error) {
    console.error("[saveNotificationProvider] hatası:", error);
    Sentry.captureException(error);
    return { error: "Sağlayıcı kaydedilemedi: " + (error instanceof Error ? error.message : String(error)) };
  }
}

export async function testSmsConnection(data: { to: string, provider: string, settings: any }) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;
    
    // Test logic simülasyonu / gerçek implementasyonda axios/fetch yapılacak
    const { to, provider, settings } = data;

    if (!to) {
      return { error: "Lütfen bir telefon numarası giriniz." };
    }

    // Gerçek API Call'lar
    if (provider === "NETGSM") {
      const { usercode, password } = settings;
      return { success: "NetGSM bağlantısı başarılı ve mesaj alındı (Simüle)" };
    } else if (provider === "ILETI_MERKEZI") {
      const { username, password } = settings;
      return { success: "İletim Merkezi bağlantısı başarılı (Simüle)" };
    } else if (provider === "TWILIO") {
      const { accountSid, authToken, fromNumber } = settings;
      return { success: "Twilio bağlantısı başarılı (Simüle)" };
    }

    return { error: "Bilinmeyen sağlayıcı tipi" };
  } catch (error) {
    console.error("[testSmsConnection] hatası:", error);
    return { error: "Bağlantı hatası: " + (error instanceof Error ? error.message : String(error)) };
  }
}
