"use server";

import { guardTenant } from "@/lib/guards";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";

export async function getAccountingIntegration() {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const integration = await prisma.accountingIntegration.findUnique({
      where: { tenantId: tenantId }
    });

    return { integration };
  } catch (error) {
    Sentry.captureException(error);
    return { error: "Entegrasyon bilgileri alınamadı." };
  }
}

export async function saveAccountingIntegration(data: {
  provider: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password?: string;
  companyId: string;
  isActive: boolean;
}) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


    const existing = await prisma.accountingIntegration.findUnique({
      where: { tenantId }
    });

    if (existing) {
      // Sifre gonderilmediyse eskisini koru
      const pwd = data.password ? data.password : existing.password;
      
      await prisma.accountingIntegration.update({
        where: { tenantId },
        data: {
          provider: data.provider,
          clientId: data.clientId,
          clientSecret: data.clientSecret,
          username: data.username,
          password: pwd,
          companyId: data.companyId,
          isActive: data.isActive
        }
      });
    } else {
      if (!data.password) return { error: "Şifre zorunludur." };
      
      await prisma.accountingIntegration.create({
        data: {
          tenantId,
          provider: data.provider,
          clientId: data.clientId,
          clientSecret: data.clientSecret,
          username: data.username,
          password: data.password,
          companyId: data.companyId,
          isActive: data.isActive
        }
      });
    }

    revalidatePath("/dashboard/settings/accounting");
    return { success: "Muhasebe ayarları kaydedildi." };
  } catch (error) {
    Sentry.captureException(error);
    return { error: "Ayarlar kaydedilemedi." };
  }
}

export async function testAccountingConnection() {
  // Gelecekte gerçek parasut login token isteği ile test edilebilir.
  // Şu anlık sadece simülasyon.
  await new Promise(res => setTimeout(res, 1000));
  return { success: "Bağlantı başarılı!" };
}

/**
 * Muhasebe Yazılımı XML Export (Logo / Netsis / LUCA uyumlu)
 * Faturalar → standart XML formatına dönüştürülür.
 */
export async function getInvoicesForExport(params: {
  startDate?: string;
  endDate?: string;
  type?: "SALES" | "PURCHASE" | "ALL";
}): Promise<{ error?: string; invoices?: InvoiceExportRow[] }> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const where: Record<string, unknown> = { tenantId, deletedAt: null };
    if (params.type && params.type !== "ALL") where.type = params.type;
    if (params.startDate || params.endDate) {
      where.issueDate = {
        ...(params.startDate ? { gte: new Date(params.startDate) } : {}),
        ...(params.endDate ? { lte: new Date(params.endDate) } : {}),
      };
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: {
            type: true, firstName: true, lastName: true,
            companyName: true, taxNumber: true, taxOffice: true,
            address: true, city: true, phone: true,
          },
        },
        supplier: {
          select: { name: true, taxNumber: true, taxOffice: true, address: true },
        },
        items: {
          select: {
            name: true, quantity: true, unitPrice: true, taxRate: true,
            discountRate: true, lineTotal: true, type: true,
          },
        },
      },
      orderBy: { issueDate: "asc" },
      take: 1000,
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, taxNumber: true, taxOffice: true, address: true, city: true, phone: true },
    });

    const rows: InvoiceExportRow[] = invoices.map((inv) => {
      const counterpartyName =
        inv.type === "PURCHASE"
          ? (inv.supplier?.name ?? "")
          : inv.customer?.type === "CORPORATE"
          ? (inv.customer?.companyName ?? "")
          : `${inv.customer?.firstName ?? ""} ${inv.customer?.lastName ?? ""}`.trim();

      return {
        invoiceNumber: inv.invoiceNumber ?? "",
        invoiceDate: inv.issueDate.toISOString().split("T")[0]!,
        dueDate: inv.dueDate ? inv.dueDate.toISOString().split("T")[0]! : null,
        type: inv.type as "SALES" | "PURCHASE",
        status: String(inv.status),
        counterpartyName,
        counterpartyTaxNumber: inv.type === "PURCHASE" ? (inv.supplier?.taxNumber ?? "") : (inv.customer?.taxNumber ?? ""),
        counterpartyTaxOffice: inv.type === "PURCHASE" ? (inv.supplier?.taxOffice ?? "") : (inv.customer?.taxOffice ?? ""),
        counterpartyAddress: inv.type === "PURCHASE" ? (inv.supplier?.address ?? "") : (inv.customer?.address ?? ""),
        subTotal: Number(inv.subTotal),
        discountAmount: Number(inv.discountAmount),
        taxAmount: Number(inv.taxAmount),
        totalAmount: Number(inv.totalAmount),
        currency: "TRY",
        tenantName: tenant?.name ?? "",
        tenantTaxNumber: tenant?.taxNumber ?? "",
        tenantTaxOffice: tenant?.taxOffice ?? "",
        items: inv.items.map((item) => ({
          name: item.name,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxRate: Number(item.taxRate),
          discountRate: Number(item.discountRate ?? 0),
          lineTotal: Number(item.lineTotal),
          type: item.type,
        })),
      };
    });

    return { invoices: rows };
  } catch (error) {
    Sentry.captureException(error);
    return { error: "Faturalar dışa aktarılamadı." };
  }
}

export interface InvoiceExportRow {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  type: "SALES" | "PURCHASE";
  status: string;
  counterpartyName: string;
  counterpartyTaxNumber: string;
  counterpartyTaxOffice: string;
  counterpartyAddress: string;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  tenantName: string;
  tenantTaxNumber: string;
  tenantTaxOffice: string;
  items: Array<{
    name: string; quantity: number; unitPrice: number;
    taxRate: number; discountRate: number; lineTotal: number; type: string;
  }>;
}
