"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import { auth } from "@/auth";
import * as Sentry from "@sentry/nextjs";
import {
  notificationTemplateSchema,
  type NotificationTemplateInput,
} from "@/lib/validations/notification";
import { parseTemplate, renderTemplate } from "@/lib/notifications/template-engine";

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ---------------------------------------------------------------------------
// 3.5 createNotificationTemplate
// ---------------------------------------------------------------------------

export async function createNotificationTemplate(
  data: NotificationTemplateInput
): Promise<ActionResult<{ templateId: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;
    const validatedData = notificationTemplateSchema.parse(data);

    // 3.7 Değişkenleri otomatik tespit et
    const { variables } = parseTemplate(validatedData.body);

    const template = await prisma.notificationTemplate.create({
      data: {
        tenantId,
        type: validatedData.type,
        channel: validatedData.channel,
        name: validatedData.name,
        body: validatedData.body,
        variables,
        templateName: validatedData.templateName ?? null,
        languageCode: validatedData.languageCode ?? null,
        isActive: validatedData.isActive,
        isDefault: validatedData.isDefault,
      },
    });

    revalidatePath("/dashboard/notifications/templates");
    return { success: true, data: { templateId: template.id } };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "Şablon oluşturulamadı." };
  }
}

// ---------------------------------------------------------------------------
// 3.5 updateNotificationTemplate
// ---------------------------------------------------------------------------

export async function updateNotificationTemplate(
  templateId: string,
  data: Partial<NotificationTemplateInput>
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;

    const template = await prisma.notificationTemplate.findFirst({
      where: { id: templateId, tenantId, deletedAt: null },
    });

    if (!template) {
      return { success: false, error: "Şablon bulunamadı." };
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.body !== undefined) {
      updateData.body = data.body;
      // 3.7 Değişkenleri yeniden tespit et
      const { variables } = parseTemplate(data.body);
      updateData.variables = variables;
    }
    if (data.templateName !== undefined) updateData.templateName = data.templateName;
    if (data.languageCode !== undefined) updateData.languageCode = data.languageCode;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

    await prisma.notificationTemplate.update({
      where: { id: templateId },
      data: updateData,
    });

    revalidatePath("/dashboard/notifications/templates");
    return { success: true };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "Şablon güncellenemedi." };
  }
}

// ---------------------------------------------------------------------------
// 3.5 deleteNotificationTemplate (soft-delete)
// ---------------------------------------------------------------------------

export async function deleteNotificationTemplate(
  templateId: string
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;

    await prisma.notificationTemplate.updateMany({
      where: { id: templateId, tenantId, deletedAt: null },
      data: { deletedAt: new Date(), isActive: false },
    });

    revalidatePath("/dashboard/notifications/templates");
    return { success: true };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "Şablon silinemedi." };
  }
}

// ---------------------------------------------------------------------------
// 3.5 getNotificationTemplates
// ---------------------------------------------------------------------------

export async function getNotificationTemplates(filters?: {
  type?: string;
  channel?: string;
}): Promise<ActionResult<{ templates: unknown[] }>> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;

    const templates = await prisma.notificationTemplate.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(filters?.type && { type: filters.type }),
        ...(filters?.channel && { channel: filters.channel }),
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: { templates: JSON.parse(JSON.stringify(templates)) },
    };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "Şablonlar listelenemedi." };
  }
}

// ---------------------------------------------------------------------------
// 3.5 getNotificationTemplateById
// ---------------------------------------------------------------------------

export async function getNotificationTemplateById(
  templateId: string
): Promise<ActionResult<{ template: unknown }>> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;

    const template = await prisma.notificationTemplate.findFirst({
      where: { id: templateId, tenantId, deletedAt: null },
    });

    if (!template) {
      return { success: false, error: "Şablon bulunamadı." };
    }

    return {
      success: true,
      data: { template: JSON.parse(JSON.stringify(template)) },
    };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "Şablon alınamadı." };
  }
}

// ---------------------------------------------------------------------------
// 3.6 previewTemplate — Örnek verilerle şablon render et
// ---------------------------------------------------------------------------

const SAMPLE_VARIABLES: Record<string, string> = {
  musteriAdi: "Ahmet Yılmaz",
  aracPlaka: "34 ABC 123",
  isEmriNo: "1234",
  durum: "Onarım Sürüyor",
  tutar: "1.500,00",
  randevuTarihi: "15.01.2025",
  randevuSaati: "10:30",
  onayUrl: "https://msotoservis.com/onay/abc123",
};

export async function previewTemplate(
  templateId: string,
  customVariables?: Record<string, string>
): Promise<ActionResult<{ preview: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;

    const template = await prisma.notificationTemplate.findFirst({
      where: { id: templateId, tenantId, deletedAt: null },
    });

    if (!template) {
      return { success: false, error: "Şablon bulunamadı." };
    }

    const variables = { ...SAMPLE_VARIABLES, ...(customVariables ?? {}) };
    const preview = renderTemplate(template.body, variables);

    return { success: true, data: { preview } };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "Önizleme oluşturulamadı." };
  }
}
