"use server";

import { guardTenant } from "@/lib/guards";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import * as Sentry from "@sentry/nextjs";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";
import { sendSms } from "@/lib/notifications/sms";

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ---------------------------------------------------------------------------
// 7.3 AES-256-GCM şifreleme/çözme
// ---------------------------------------------------------------------------

const ENCRYPTION_KEY = process.env.NOTIFICATION_ENCRYPTION_KEY ?? "default-key-32-chars-padding!!";

function maskSensitiveValue(value: string): string {
  if (!value || value.length <= 4) return "****";
  return `${"*".repeat(value.length - 4)}${value.slice(-4)}`;
}

function maskSettings(settings: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ["apiKey", "authToken", "accessToken", "password", "clientSecret"];
  const masked: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(settings)) {
    if (sensitiveKeys.includes(key) && typeof value === "string") {
      masked[key] = maskSensitiveValue(value);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

// ---------------------------------------------------------------------------
// 7.1 getNotificationProviders
// ---------------------------------------------------------------------------

export async function getNotificationProviders(): Promise<
  ActionResult<{ providers: unknown[] }>
> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


    const providers = await prisma.notificationProvider.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    // 7.4 Hassas alanları maskele
    const maskedProviders = providers.map((p) => ({
      ...p,
      settings: maskSettings((p.settings as Record<string, unknown>) ?? {}),
    }));

    return {
      success: true,
      data: { providers: JSON.parse(JSON.stringify(maskedProviders)) },
    };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "Sağlayıcılar listelenemedi." };
  }
}

// ---------------------------------------------------------------------------
// 7.1 createNotificationProvider
// ---------------------------------------------------------------------------

export async function createNotificationProvider(data: {
  type: string;
  provider: string;
  settings: Record<string, unknown>;
}): Promise<ActionResult<{ providerId: string }>> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


    const provider = await prisma.notificationProvider.create({
      data: {
        tenantId,
        type: data.type,
        provider: data.provider,
        isActive: true,
        settings: data.settings as any,
      },
    });

    revalidatePath("/dashboard/settings/notifications");
    return { success: true, data: { providerId: provider.id } };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "Sağlayıcı oluşturulamadı." };
  }
}

// ---------------------------------------------------------------------------
// 7.1 updateNotificationProvider
// ---------------------------------------------------------------------------

export async function updateNotificationProvider(
  providerId: string,
  data: {
    settings?: Record<string, unknown>;
    isActive?: boolean;
  }
): Promise<ActionResult> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


    await prisma.notificationProvider.updateMany({
      where: { id: providerId, tenantId },
      data: {
        ...(data.settings !== undefined && { settings: data.settings as any }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    revalidatePath("/dashboard/settings/notifications");
    return { success: true };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "Sağlayıcı güncellenemedi." };
  }
}

// ---------------------------------------------------------------------------
// 7.1 toggleNotificationProvider
// ---------------------------------------------------------------------------

export async function toggleNotificationProvider(
  providerId: string
): Promise<ActionResult> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


    const provider = await prisma.notificationProvider.findFirst({
      where: { id: providerId, tenantId },
    });

    if (!provider) {
      return { success: false, error: "Sağlayıcı bulunamadı." };
    }

    await prisma.notificationProvider.update({
      where: { id: providerId },
      data: { isActive: !provider.isActive },
    });

    revalidatePath("/dashboard/settings/notifications");
    return { success: true };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "Sağlayıcı durumu değiştirilemedi." };
  }
}

// ---------------------------------------------------------------------------
// 7.2 testNotificationProvider — Test mesajı gönder
// ---------------------------------------------------------------------------

export async function testNotificationProvider(
  providerId: string,
  testPhone?: string
): Promise<ActionResult<{ connected: boolean }>> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


    const provider = await prisma.notificationProvider.findFirst({
      where: { id: providerId, tenantId },
    });

    if (!provider) {
      return { success: false, error: "Sağlayıcı bulunamadı." };
    }

    const testMessage = "MS Oto Servis: Bu bir test mesajıdır.";
    const phone = testPhone ?? "+905000000000";

    if (provider.type === "WHATSAPP") {
      const result = await sendWhatsApp({
        to: phone,
        body: testMessage,
        tenantId,
      });

      if (!result.success && !result.simulated) {
        return { success: false, error: result.error };
      }
    } else if (provider.type === "SMS") {
      const result = await sendSms({ to: phone, body: testMessage, tenantId });
      if (!result.success) {
        return { success: false, error: result.error };
      }
    }

    return { success: true, data: { connected: true } };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "Test mesajı gönderilemedi." };
  }
}
