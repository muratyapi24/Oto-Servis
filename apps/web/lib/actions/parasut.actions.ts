"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import { auth } from "@/auth";
import * as Sentry from "@sentry/nextjs";
import { inngest } from "@/lib/inngest/client";
import { testParasutConnectionWithCreds } from "@/lib/parasut/client";

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ---------------------------------------------------------------------------
// 6.5 syncInvoiceToParasut — Manuel senkronizasyon tetikle
// ---------------------------------------------------------------------------

export async function syncInvoiceToParasut(
  invoiceId: string
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId, deletedAt: null },
    });

    if (!invoice) {
      return { success: false, error: "Fatura bulunamadı." };
    }

    // Inngest event tetikle
    await inngest.send({
      name: "invoice/status-changed",
      data: {
        invoiceId,
        tenantId,
        status: invoice.status,
        manualSync: true,
      },
    });

    return { success: true };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "Senkronizasyon başlatılamadı." };
  }
}

// ---------------------------------------------------------------------------
// 6.5 testParasutConnection — Bağlantı testi
// ---------------------------------------------------------------------------

export async function testParasutConnection(): Promise<
  ActionResult<{ connected: boolean }>
> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;

    const integration = await prisma.accountingIntegration.findFirst({
      where: { tenantId, provider: "PARASUT" },
    });

    if (!integration) {
      return { success: false, error: "Paraşüt entegrasyonu yapılandırılmamış." };
    }

    const result = await testParasutConnectionWithCreds({
      clientId: integration.clientId,
      clientSecret: integration.clientSecret,
      username: integration.username,
      password: integration.password,
      companyId: integration.companyId,
    });

    return { success: true, data: { connected: result.connected } };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "Bağlantı testi başarısız." };
  }
}

// ---------------------------------------------------------------------------
// 6.5 getParasutSyncLogs — Senkronizasyon log listesi
// ---------------------------------------------------------------------------

export async function getParasutSyncLogs(
  invoiceId: string
): Promise<ActionResult<{ logs: unknown[] }>> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;

    const logs = await prisma.parasutSyncLog.findMany({
      where: { tenantId, invoiceId },
      orderBy: { attemptedAt: "desc" },
      take: 20,
    });

    return {
      success: true,
      data: { logs: JSON.parse(JSON.stringify(logs)) },
    };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "Senkronizasyon logları alınamadı." };
  }
}
