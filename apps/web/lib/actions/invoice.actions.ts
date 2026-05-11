"use server";

import { guardTenant } from "@/lib/guards";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import * as Sentry from "@sentry/nextjs";
import {
  createInvoiceSchema,
  type CreateInvoiceInput,
} from "@/lib/validations/invoice";
import { inngest } from "@/lib/inngest/client";
import {
  calculateLineTotal,
  calculateInvoiceTotals,
  generateInvoiceNumber,
  generateDraftInvoiceNumber,
} from "@/lib/invoice-utils";
import { getSignedUrl } from "@/lib/storage";

// ---------------------------------------------------------------------------
// Tipler
// ---------------------------------------------------------------------------

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export interface InvoiceFilters {
  status?: string;
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// 2.2 createInvoice — Fatura oluştur (InvoiceItem'larla birlikte)
// ---------------------------------------------------------------------------
export async function createInvoice(
  data: CreateInvoiceInput
): Promise<ActionResult<{ invoiceId: string }>> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId, session } = g;

    const validatedData = createInvoiceSchema.parse(data);

    const invoice = await prisma.$transaction(async (tx) => {
      // Geçici taslak numarası ata
      const draftNumber = generateDraftInvoiceNumber();

      // Toplamları hesapla
      const totals = calculateInvoiceTotals(
        validatedData.items.map((item) => ({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountRate: item.discountRate ?? 0,
          taxRate: item.taxRate ?? 20,
        }))
      );

      // Muhasebe denklik doğrulaması
      const expectedTotal = totals.subTotal + totals.taxAmount;
      if (Math.abs(expectedTotal - totals.totalAmount) > 0.01) {
        throw new Error("ACCOUNTING_INTEGRITY_ERROR");
      }

      // Invoice oluştur
      const newInvoice = await tx.invoice.create({
        data: {
          tenantId,
          invoiceNumber: draftNumber,
          status: "DRAFT",
          customerId: validatedData.customerId ?? null,
          serviceOrderId: validatedData.serviceOrderId ?? null,
          dueDate: validatedData.dueDate ?? null,
          notes: validatedData.notes ?? null,
          subTotal: totals.subTotal,
          taxAmount: totals.taxAmount,
          discountAmount: totals.discountAmount,
          totalAmount: totals.totalAmount,
        },
      });

      // InvoiceItem'ları oluştur
      if (validatedData.items.length > 0) {
        await tx.invoiceItem.createMany({
          data: validatedData.items.map((item, index) => ({
            tenantId,
            invoiceId: newInvoice.id,
            type: item.type,
            name: item.name,
            description: item.description ?? null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate ?? 20,
            discountRate: item.discountRate ?? 0,
            lineTotal: calculateLineTotal(
              item.quantity,
              item.unitPrice,
              item.discountRate ?? 0,
              item.taxRate ?? 20
            ),
            sortOrder: item.sortOrder ?? index,
          })),
        });
      }

      // AuditLog kaydı
      await tx.auditLog.create({
        data: {
          level: "INFO",
          module: "INVOICE",
          message: `Fatura oluşturuldu: ${draftNumber}`,
          tenantId,
          userId: session.user.id ?? null,
        },
      });

      return newInvoice;
    });

    revalidatePath("/dashboard/finances/invoices");
    return { success: true, data: { invoiceId: invoice.id } };
  } catch (error: unknown) {
    Sentry.captureException(error);
    console.error("Fatura oluşturma hatası:", error);
    if (error instanceof Error && (error instanceof Error ? error.message : String(error)) === "ACCOUNTING_INTEGRITY_ERROR") {
      return { success: false, error: "Muhasebe denklik hatası: Toplam tutarlar uyuşmuyor." };
    }
    return { success: false, error: "Fatura oluşturulamadı." };
  }
}

// ---------------------------------------------------------------------------
// 2.3 updateInvoice — Fatura güncelle (sadece DRAFT)
// ---------------------------------------------------------------------------
export async function updateInvoice(
  invoiceId: string,
  data: Partial<CreateInvoiceInput>
): Promise<ActionResult> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId, session } = g;


    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId, deletedAt: null },
      include: { items: true },
    });

    if (!invoice) {
      return { success: false, error: "Fatura bulunamadı." };
    }

    if (invoice.status !== "DRAFT") {
      return {
        success: false,
        error: "Sadece TASLAK durumundaki faturalar güncellenebilir.",
      };
    }

    await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};

      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.customerId !== undefined) updateData.customerId = data.customerId;

      // Kalemler değişirse toplamları yeniden hesapla
      if (data.items !== undefined) {
        // Mevcut kalemleri sil
        await tx.invoiceItem.deleteMany({ where: { invoiceId } });

        // Yeni kalemleri oluştur
        const totals = calculateInvoiceTotals(
          data.items.map((item) => ({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountRate: item.discountRate ?? 0,
            taxRate: item.taxRate ?? 20,
          }))
        );

        if (data.items.length > 0) {
          await tx.invoiceItem.createMany({
            data: data.items.map((item, index) => ({
              tenantId,
              invoiceId,
              type: item.type,
              name: item.name,
              description: item.description ?? null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate ?? 20,
              discountRate: item.discountRate ?? 0,
              lineTotal: calculateLineTotal(
                item.quantity,
                item.unitPrice,
                item.discountRate ?? 0,
                item.taxRate ?? 20
              ),
              sortOrder: item.sortOrder ?? index,
            })),
          });
        }

        updateData.subTotal = totals.subTotal;
        updateData.taxAmount = totals.taxAmount;
        updateData.discountAmount = totals.discountAmount;
        updateData.totalAmount = totals.totalAmount;
      }

      await tx.invoice.update({
        where: { id: invoiceId },
        data: updateData,
      });

      await tx.auditLog.create({
        data: {
          level: "INFO",
          module: "INVOICE",
          message: `Fatura güncellendi: ${invoice.invoiceNumber}`,
          tenantId,
          userId: session.user.id ?? null,
        },
      });
    });

    revalidatePath("/dashboard/finances/invoices");
    revalidatePath(`/dashboard/finances/invoices/${invoiceId}`);
    return { success: true };
  } catch (error: unknown) {
    Sentry.captureException(error);
    console.error("Fatura güncelleme hatası:", error);
    return { success: false, error: "Fatura güncellenemedi." };
  }
}

// ---------------------------------------------------------------------------
// 2.4 addInvoiceItem — Fatura kalemi ekle
// ---------------------------------------------------------------------------
export async function addInvoiceItem(
  invoiceId: string,
  data: {
    type: "LABOR" | "PART" | "SERVICE";
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    discountRate?: number;
    sortOrder?: number;
  }
): Promise<ActionResult<{ itemId: string }>> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId, deletedAt: null },
      include: { items: true },
    });

    if (!invoice) {
      return { success: false, error: "Fatura bulunamadı." };
    }

    if (invoice.status === "PAID") {
      return {
        success: false,
        error: "PAID_INVOICE_IMMUTABLE: Ödenmiş faturaya kalem eklenemez.",
      };
    }

    const taxRate = data.taxRate ?? 20;
    const discountRate = data.discountRate ?? 0;
    const lineTotal = calculateLineTotal(
      data.quantity,
      data.unitPrice,
      discountRate,
      taxRate
    );

    const item = await prisma.$transaction(async (tx) => {
      const newItem = await tx.invoiceItem.create({
        data: {
          tenantId,
          invoiceId,
          type: data.type,
          name: data.name,
          description: data.description ?? null,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          taxRate,
          discountRate,
          lineTotal,
          sortOrder: data.sortOrder ?? invoice.items.length,
        },
      });

      // Fatura toplamlarını güncelle
      const allItems = await tx.invoiceItem.findMany({ where: { invoiceId } });
      const totals = calculateInvoiceTotals(
        allItems.map((i) => ({
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          discountRate: Number(i.discountRate),
          taxRate: Number(i.taxRate),
        }))
      );

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          subTotal: totals.subTotal,
          taxAmount: totals.taxAmount,
          discountAmount: totals.discountAmount,
          totalAmount: totals.totalAmount,
        },
      });

      return newItem;
    });

    revalidatePath(`/dashboard/finances/invoices/${invoiceId}`);
    return { success: true, data: { itemId: item.id } };
  } catch (error: unknown) {
    Sentry.captureException(error);
    console.error("Fatura kalemi ekleme hatası:", error);
    return { success: false, error: "Fatura kalemi eklenemedi." };
  }
}

// ---------------------------------------------------------------------------
// 2.4 updateInvoiceItem — Fatura kalemi güncelle
// ---------------------------------------------------------------------------
export async function updateInvoiceItem(
  itemId: string,
  data: {
    type?: "LABOR" | "PART" | "SERVICE";
    name?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
    taxRate?: number;
    discountRate?: number;
    sortOrder?: number;
  }
): Promise<ActionResult> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


    const item = await prisma.invoiceItem.findFirst({
      where: { id: itemId, tenantId },
      include: { invoice: true },
    });

    if (!item) {
      return { success: false, error: "Fatura kalemi bulunamadı." };
    }

    if (item.invoice.status === "PAID") {
      return {
        success: false,
        error: "PAID_INVOICE_IMMUTABLE: Ödenmiş fatura kalemi güncellenemez.",
      };
    }

    const quantity = data.quantity ?? Number(item.quantity);
    const unitPrice = data.unitPrice ?? Number(item.unitPrice);
    const taxRate = data.taxRate ?? Number(item.taxRate);
    const discountRate = data.discountRate ?? Number(item.discountRate);
    const lineTotal = calculateLineTotal(quantity, unitPrice, discountRate, taxRate);

    await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.update({
        where: { id: itemId },
        data: {
          ...(data.type !== undefined && { type: data.type }),
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          quantity,
          unitPrice,
          taxRate,
          discountRate,
          lineTotal,
          ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        },
      });

      // Fatura toplamlarını güncelle
      const allItems = await tx.invoiceItem.findMany({
        where: { invoiceId: item.invoiceId },
      });
      const totals = calculateInvoiceTotals(
        allItems.map((i) => ({
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          discountRate: Number(i.discountRate),
          taxRate: Number(i.taxRate),
        }))
      );

      await tx.invoice.update({
        where: { id: item.invoiceId },
        data: {
          subTotal: totals.subTotal,
          taxAmount: totals.taxAmount,
          discountAmount: totals.discountAmount,
          totalAmount: totals.totalAmount,
        },
      });
    });

    revalidatePath(`/dashboard/finances/invoices/${item.invoiceId}`);
    return { success: true };
  } catch (error: unknown) {
    Sentry.captureException(error);
    console.error("Fatura kalemi güncelleme hatası:", error);
    return { success: false, error: "Fatura kalemi güncellenemedi." };
  }
}

// ---------------------------------------------------------------------------
// 2.4 deleteInvoiceItem — Fatura kalemi sil (PAID faturada reddedilir)
// ---------------------------------------------------------------------------
export async function deleteInvoiceItem(itemId: string): Promise<ActionResult> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


    const item = await prisma.invoiceItem.findFirst({
      where: { id: itemId, tenantId },
      include: { invoice: true },
    });

    if (!item) {
      return { success: false, error: "Fatura kalemi bulunamadı." };
    }

    if (item.invoice.status === "PAID") {
      return {
        success: false,
        error: "PAID_INVOICE_IMMUTABLE: Ödenmiş faturadan kalem silinemez.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.delete({ where: { id: itemId } });

      // Fatura toplamlarını güncelle
      const remainingItems = await tx.invoiceItem.findMany({
        where: { invoiceId: item.invoiceId },
      });
      const totals = calculateInvoiceTotals(
        remainingItems.map((i) => ({
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          discountRate: Number(i.discountRate),
          taxRate: Number(i.taxRate),
        }))
      );

      await tx.invoice.update({
        where: { id: item.invoiceId },
        data: {
          subTotal: totals.subTotal,
          taxAmount: totals.taxAmount,
          discountAmount: totals.discountAmount,
          totalAmount: totals.totalAmount,
        },
      });
    });

    revalidatePath(`/dashboard/finances/invoices/${item.invoiceId}`);
    return { success: true };
  } catch (error: unknown) {
    Sentry.captureException(error);
    console.error("Fatura kalemi silme hatası:", error);
    return { success: false, error: "Fatura kalemi silinemedi." };
  }
}

// ---------------------------------------------------------------------------
// 2.5 reorderInvoiceItems — Kalem sıralamasını güncelle
// ---------------------------------------------------------------------------
export async function reorderInvoiceItems(
  invoiceId: string,
  itemIds: string[]
): Promise<ActionResult> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId, deletedAt: null },
    });

    if (!invoice) {
      return { success: false, error: "Fatura bulunamadı." };
    }

    await prisma.$transaction(async (tx) => {
      // Her itemId için sortOrder = index olarak güncelle
      for (let i = 0; i < itemIds.length; i++) {
        await tx.invoiceItem.updateMany({
          where: { id: itemIds[i], invoiceId, tenantId },
          data: { sortOrder: i },
        });
      }
    });

    revalidatePath(`/dashboard/finances/invoices/${invoiceId}`);
    return { success: true };
  } catch (error: unknown) {
    Sentry.captureException(error);
    console.error("Kalem sıralama hatası:", error);
    return { success: false, error: "Kalem sıralaması güncellenemedi." };
  }
}

// ---------------------------------------------------------------------------
// 2.6 createInvoiceFromServiceOrder — İş emrinden fatura oluştur
// ---------------------------------------------------------------------------
export async function createInvoiceFromServiceOrder(
  serviceOrderId: string
): Promise<ActionResult<{ invoiceId: string }>> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId, session } = g;


    // ServiceOrder'ı ServiceItem'larla birlikte getir
    const serviceOrder = await prisma.serviceOrder.findFirst({
      where: { id: serviceOrderId, tenantId, deletedAt: null },
      include: { items: true },
    });

    if (!serviceOrder) {
      return { success: false, error: "İş emri bulunamadı." };
    }

    // ServiceItemType → InvoiceItemType mapping
    const typeMapping: Record<string, "LABOR" | "PART" | "SERVICE"> = {
      PART: "PART",
      LABOR: "LABOR",
      OTHER: "SERVICE",
    };

    const invoice = await prisma.$transaction(async (tx) => {
      const draftNumber = generateDraftInvoiceNumber();

      // Toplamları hesapla
      const totals = calculateInvoiceTotals(
        serviceOrder.items.map((item) => ({
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discountRate: 0, // ServiceItem'da discountRate yok, 0 kullan
          taxRate: Number(item.taxRate),
        }))
      );

      // Invoice oluştur
      const newInvoice = await tx.invoice.create({
        data: {
          tenantId,
          invoiceNumber: draftNumber,
          status: "DRAFT",
          customerId: serviceOrder.customerId,
          serviceOrderId,
          subTotal: totals.subTotal,
          taxAmount: totals.taxAmount,
          discountAmount: totals.discountAmount,
          totalAmount: totals.totalAmount,
        },
      });

      // Her ServiceItem için InvoiceItem kopyala
      if (serviceOrder.items.length > 0) {
        await tx.invoiceItem.createMany({
          data: serviceOrder.items.map((item, index) => ({
            tenantId,
            invoiceId: newInvoice.id,
            type: typeMapping[item.itemType] ?? "SERVICE",
            name: item.name,
            description: item.description ?? null,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            taxRate: Number(item.taxRate),
            discountRate: 0,
            lineTotal: calculateLineTotal(
              Number(item.quantity),
              Number(item.unitPrice),
              0,
              Number(item.taxRate)
            ),
            sortOrder: index,
            serviceItemId: item.id,
          })),
        });
      }

      // AuditLog kaydı
      await tx.auditLog.create({
        data: {
          level: "INFO",
          module: "INVOICE",
          message: `İş emrinden fatura oluşturuldu: ${draftNumber} (İş Emri: ${serviceOrderId})`,
          tenantId,
          userId: session.user.id ?? null,
        },
      });

      return newInvoice;
    });

    revalidatePath("/dashboard/finances/invoices");
    return { success: true, data: { invoiceId: invoice.id } };
  } catch (error: unknown) {
    Sentry.captureException(error);
    console.error("İş emrinden fatura oluşturma hatası:", error);
    return { success: false, error: "İş emrinden fatura oluşturulamadı." };
  }
}

// ---------------------------------------------------------------------------
// 2.7 getInvoices — Filtreli fatura listesi
// ---------------------------------------------------------------------------
export async function getInvoices(
  filters?: InvoiceFilters
): Promise<ActionResult<{ invoices: unknown[]; total: number }>> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      tenantId,
      deletedAt: null,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (filters.dateFrom) dateFilter.gte = filters.dateFrom;
      if (filters.dateTo) dateFilter.lte = filters.dateTo;
      where.issueDate = dateFilter;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
          },
          customer: {
            select: { id: true, firstName: true, lastName: true, companyName: true, phone: true },
          },
          _count: { select: { payments: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      success: true,
      data: {
        invoices: JSON.parse(JSON.stringify(invoices)),
        total,
      },
    };
  } catch (error: unknown) {
    Sentry.captureException(error);
    console.error("Fatura listesi hatası:", error);
    return { success: false, error: "Faturalar listelenemedi." };
  }
}

// ---------------------------------------------------------------------------
// 2.7 getInvoiceById — Fatura detayı
// ---------------------------------------------------------------------------
export async function getInvoiceById(
  invoiceId: string
): Promise<ActionResult<{ invoice: unknown }>> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId, deletedAt: null },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
        parasutSyncLogs: {
          orderBy: { attemptedAt: "desc" },
          take: 10,
        },
        customer: true,
        serviceOrder: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
      },
    });

    if (!invoice) {
      return { success: false, error: "Fatura bulunamadı." };
    }

    return {
      success: true,
      data: { invoice: JSON.parse(JSON.stringify(invoice)) },
    };
  } catch (error: unknown) {
    Sentry.captureException(error);
    console.error("Fatura detay hatası:", error);
    return { success: false, error: "Fatura detayı alınamadı." };
  }
}

// ---------------------------------------------------------------------------
// 2.8 + 2.9 updateInvoiceStatus — Fatura durumunu değiştir
// ---------------------------------------------------------------------------
export async function updateInvoiceStatus(
  invoiceId: string,
  status: "SENT" | "PAID" | "CANCELLED"
): Promise<ActionResult> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId, session } = g;


    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId, deletedAt: null },
      include: { items: true },
    });

    if (!invoice) {
      return { success: false, error: "Fatura bulunamadı." };
    }

    // PAID/CANCELLED faturada tutar değişikliği engeli
    if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
      return {
        success: false,
        error: "INVOICE_LOCKED: Ödenmiş veya iptal edilmiş fatura durumu değiştirilemez.",
      };
    }

    // Muhasebe denklik doğrulaması
    const subTotal = Number(invoice.subTotal);
    const taxAmount = Number(invoice.taxAmount);
    const discountAmount = Number(invoice.discountAmount);
    const totalAmount = Number(invoice.totalAmount);
    const expectedTotal = subTotal + taxAmount;

    if (Math.abs(expectedTotal - totalAmount) > 0.01) {
      return {
        success: false,
        error: "ACCOUNTING_INTEGRITY_ERROR: Fatura tutarları uyuşmuyor.",
      };
    }

    // PAID durumuna geçişte paidAmount kontrolü
    if (status === "PAID") {
      const paidAmount = Number(invoice.paidAmount);
      if (paidAmount < totalAmount) {
        return {
          success: false,
          error: `Fatura tam ödenmemiş. Ödenen: ${paidAmount}, Toplam: ${totalAmount}`,
        };
      }
    }

    const updateData: Record<string, unknown> = { status };

    if (status === "SENT") {
      const { getNextInvoiceNumber } = await import('@/lib/sequence-utils');
      
      const newInvoiceNumber = await prisma.$transaction(async (tx) => {
        return await getNextInvoiceNumber(tenantId, tx);
      });

      updateData.invoiceNumber = newInvoiceNumber;
    }

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: updateData,
      });

      // AuditLog kaydı
      await tx.auditLog.create({
        data: {
          level: "INFO",
          module: "INVOICE",
          message: `Fatura durumu güncellendi: ${invoice.invoiceNumber} → ${status}`,
          tenantId,
          userId: session.user.id ?? null,
        },
      });
    });

    // Inngest event tetikle
    await inngest.send({
      name: "invoice/status-changed",
      data: {
        invoiceId,
        tenantId,
        status,
      },
    });

    revalidatePath("/dashboard/finances/invoices");
    revalidatePath(`/dashboard/finances/invoices/${invoiceId}`);
    return { success: true };
  } catch (error: unknown) {
    Sentry.captureException(error);
    console.error("Fatura durum güncelleme hatası:", error);
    return { success: false, error: "Fatura durumu güncellenemedi." };
  }
}

// ---------------------------------------------------------------------------
// getInvoicePdfUrl — PDF URL al (yoksa Inngest job tetikle)
// ---------------------------------------------------------------------------
export async function getInvoicePdfUrl(
  invoiceId: string
): Promise<ActionResult<{ url: string }>> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId, deletedAt: null },
    });

    if (!invoice) {
      return { success: false, error: "Fatura bulunamadı." };
    }

    if (invoice.pdfUrl) {
      // S3 key'den presigned URL üret (1 saat geçerli)
      try {
        const signedUrl = await getSignedUrl(invoice.pdfUrl, 3600);
        return { success: true, data: { url: signedUrl } };
      } catch {
        // Presigned URL üretilemezse key'i doğrudan döndür
        return { success: true, data: { url: invoice.pdfUrl } };
      }
    }

    // PDF yoksa Inngest job tetikle
    await inngest.send({
      name: "invoice/status-changed",
      data: {
        invoiceId,
        tenantId,
        status: invoice.status,
        generatePdf: true,
      },
    });

    return {
      success: false,
      error: "PDF oluşturuluyor, lütfen kısa süre sonra tekrar deneyin.",
    };
  } catch (error: unknown) {
    Sentry.captureException(error);
    console.error("PDF URL hatası:", error);
    return { success: false, error: "PDF URL alınamadı." };
  }
}
