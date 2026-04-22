"use server";

import * as Sentry from "@sentry/nextjs";
import { prisma } from "@repo/database";
import { auth } from "@/auth";

/** Tüm Faturaları Listele (Filtreleme dahil) */
export async function getAllInvoices(filters?: {
  status?: string;
  type?: string;
  search?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };
    const tenantId = session.user.tenantId;

    const where: any = { tenantId, deletedAt: null };

    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status;
    }
    if (filters?.type && filters.type !== "ALL") {
      where.type = filters.type;
    }
    if (filters?.search) {
      where.OR = [
        { invoiceNumber: { contains: filters.search, mode: "insensitive" } },
        { notes: { contains: filters.search, mode: "insensitive" } },
        { customer: { firstName: { contains: filters.search, mode: "insensitive" } } },
        { customer: { lastName: { contains: filters.search, mode: "insensitive" } } },
        { customer: { companyName: { contains: filters.search, mode: "insensitive" } } }
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { id: true, type: true, firstName: true, lastName: true, companyName: true } },
        supplier: { select: { id: true, name: true } }
      },
      orderBy: { issueDate: "desc" },
      take: 200
    });

    const serialized = invoices.map(inv => ({
      ...inv,
      subTotal: Number(inv.subTotal),
      taxAmount: Number(inv.taxAmount),
      discountAmount: Number(inv.discountAmount),
      totalAmount: Number(inv.totalAmount),
      paidAmount: Number(inv.paidAmount),
      customerName: inv.customer?.type === "CORPORATE"
        ? inv.customer?.companyName
        : `${inv.customer?.firstName || ""} ${inv.customer?.lastName || ""}`.trim(),
      supplierName: inv.supplier?.name || null
    }));

    return { invoices: serialized };
  } catch (error: any) {
    Sentry.captureException(error);
    return { error: "Faturalar alınamadı: " + error.message };
  }
}
