"use server";

import { guardTenant } from "@/lib/guards";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import * as Sentry from "@sentry/nextjs";
import { bulkCampaignSchema, type BulkCampaignInput } from "@/lib/validations/notification";
import { inngest } from "@/lib/inngest/client";
import { filterByIysConsent } from "@/lib/notifications/iys";

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ---------------------------------------------------------------------------
// 6.1 createBulkCampaign
// ---------------------------------------------------------------------------

export async function createBulkCampaign(
  data: BulkCampaignInput
): Promise<ActionResult<{ campaignId: string }>> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId, session } = g;

    // 6.3 Yalnızca TENANT_ADMIN rolüne izin ver
    if (session.user.role !== "TENANT_ADMIN") {
      return { success: false, error: "Bu işlem için yönetici yetkisi gereklidir." };
    }

    const validatedData = bulkCampaignSchema.parse(data);

    const campaign = await prisma.bulkNotificationCampaign.create({
      data: {
        tenantId,
        name: validatedData.name,
        channel: validatedData.channel,
        messageBody: validatedData.messageBody,
        segmentType: validatedData.segmentType,
        segmentParams: (validatedData.segmentParams as any) ?? {},
        status: "DRAFT",
        createdById: session.user.id ?? null,
      },
    });

    revalidatePath("/dashboard/notifications/bulk");
    return { success: true, data: { campaignId: campaign.id } };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "Kampanya oluşturulamadı." };
  }
}

// ---------------------------------------------------------------------------
// 6.1 getBulkCampaigns
// ---------------------------------------------------------------------------

export async function getBulkCampaigns(): Promise<
  ActionResult<{ campaigns: unknown[] }>
> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


    const campaigns = await prisma.bulkNotificationCampaign.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return {
      success: true,
      data: { campaigns: JSON.parse(JSON.stringify(campaigns)) },
    };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "Kampanyalar listelenemedi." };
  }
}

// ---------------------------------------------------------------------------
// 6.1 getBulkCampaignById
// ---------------------------------------------------------------------------

export async function getBulkCampaignById(
  campaignId: string
): Promise<ActionResult<{ campaign: unknown }>> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


    const campaign = await prisma.bulkNotificationCampaign.findFirst({
      where: { id: campaignId, tenantId },
    });

    if (!campaign) {
      return { success: false, error: "Kampanya bulunamadı." };
    }

    return {
      success: true,
      data: { campaign: JSON.parse(JSON.stringify(campaign)) },
    };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "Kampanya alınamadı." };
  }
}

// ---------------------------------------------------------------------------
// 6.2 previewBulkCampaign — Segment önizlemesi
// ---------------------------------------------------------------------------

export async function previewBulkCampaign(
  segmentType: string,
  segmentParams?: Record<string, unknown>
): Promise<ActionResult<{ count: number; sampleCustomers: unknown[] }>> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const customers = await getSegmentCustomers(tenantId, segmentType, segmentParams);

    return {
      success: true,
      data: {
        count: customers.length,
        sampleCustomers: customers.slice(0, 5).map((c) => ({
          id: c.id,
          name: c.companyName || [c.firstName, c.lastName].filter(Boolean).join(" "),
          phone: c.phone,
        })),
      },
    };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "Önizleme oluşturulamadı." };
  }
}

// ---------------------------------------------------------------------------
// 6.3 startBulkCampaign — Kampanyayı başlat
// ---------------------------------------------------------------------------

export async function startBulkCampaign(
  campaignId: string
): Promise<ActionResult> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId, session } = g;

    if (session.user.role !== "TENANT_ADMIN") {
      return { success: false, error: "Bu işlem için yönetici yetkisi gereklidir." };
    }


    const campaign = await prisma.bulkNotificationCampaign.findFirst({
      where: { id: campaignId, tenantId, status: "DRAFT" },
    });

    if (!campaign) {
      return { success: false, error: "Kampanya bulunamadı veya zaten başlatılmış." };
    }

    // IYS / marketing consent filtresi — SMS ve WhatsApp kanalları için
    const iysChannels = ["SMS", "WHATSAPP"];
    if (iysChannels.includes(campaign.channel.toUpperCase())) {
      const allCustomers = await getSegmentCustomers(tenantId, campaign.segmentType, campaign.segmentParams as Record<string, unknown>);
      const iysChannel = campaign.channel.toUpperCase() === "WHATSAPP" ? "MESAJ" : "MESAJ";
      const allowedCustomers = await filterByIysConsent(
        tenantId,
        allCustomers.map((c) => ({ id: c.id, phone: c.phone })),
        iysChannel
      );
      const skippedCount = allCustomers.length - allowedCustomers.length;
      if (skippedCount > 0) {
        await prisma.bulkNotificationCampaign.update({
          where: { id: campaignId },
          data: { skippedCount, totalCount: allowedCustomers.length },
        });
      }
    }

    // Kampanya durumunu RUNNING yap
    await prisma.bulkNotificationCampaign.update({
      where: { id: campaignId },
      data: { status: "RUNNING", startedAt: new Date() },
    });

    // Inngest event tetikle
    await inngest.send({
      name: "bulk/notification.start",
      data: {
        campaignId,
        tenantId,
      },
    });

    revalidatePath("/dashboard/notifications/bulk");
    return { success: true };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "Kampanya başlatılamadı." };
  }
}

// ---------------------------------------------------------------------------
// Yardımcı: Segment müşterilerini getir
// ---------------------------------------------------------------------------

export async function getSegmentCustomers(
  tenantId: string,
  segmentType: string,
  segmentParams?: Record<string, unknown>
): Promise<Array<{ id: string; firstName?: string | null; lastName?: string | null; companyName?: string | null; phone: string; email?: string | null }>> {
  const now = new Date();

  switch (segmentType) {
    case "ALL":
      return prisma.customer.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true, firstName: true, lastName: true, companyName: true, phone: true, email: true },
        take: 10000,
      });

    case "OVERDUE_INVOICE": {
      const days = Number(segmentParams?.days ?? 30);
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const invoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          status: "SENT",
          dueDate: { lt: cutoffDate },
          deletedAt: null,
        },
        select: { customerId: true },
        distinct: ["customerId"],
      });
      const customerIds = invoices.map((i) => i.customerId).filter(Boolean) as string[];
      return prisma.customer.findMany({
        where: { tenantId, id: { in: customerIds }, deletedAt: null },
        select: { id: true, firstName: true, lastName: true, companyName: true, phone: true, email: true },
      });
    }

    case "VEHICLE_BRAND": {
      const brand = String(segmentParams?.brand ?? "");
      const vehicles = await prisma.vehicle.findMany({
        where: { tenantId, brand: { contains: brand, mode: "insensitive" } },
        select: { customerId: true },
        distinct: ["customerId"],
      });
      const customerIds = vehicles.map((v) => v.customerId);
      return prisma.customer.findMany({
        where: { tenantId, id: { in: customerIds }, deletedAt: null },
        select: { id: true, firstName: true, lastName: true, companyName: true, phone: true, email: true },
      });
    }

    case "INACTIVE": {
      const days = Number(segmentParams?.days ?? 90);
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const activeCustomerIds = await prisma.serviceOrder.findMany({
        where: { tenantId, createdAt: { gte: cutoffDate } },
        select: { customerId: true },
        distinct: ["customerId"],
      });
      const activeIds = activeCustomerIds.map((s) => s.customerId);
      return prisma.customer.findMany({
        where: { tenantId, id: { notIn: activeIds }, deletedAt: null },
        select: { id: true, firstName: true, lastName: true, companyName: true, phone: true, email: true },
        take: 5000,
      });
    }

    case "ACTIVE": {
      const days = Number(segmentParams?.days ?? 30);
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const activeOrders = await prisma.serviceOrder.findMany({
        where: { tenantId, createdAt: { gte: cutoffDate } },
        select: { customerId: true },
        distinct: ["customerId"],
      });
      const customerIds = activeOrders.map((s) => s.customerId);
      return prisma.customer.findMany({
        where: { tenantId, id: { in: customerIds }, deletedAt: null },
        select: { id: true, firstName: true, lastName: true, companyName: true, phone: true, email: true },
      });
    }

    default:
      return [];
  }
}
