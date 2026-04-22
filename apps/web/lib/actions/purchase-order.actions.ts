"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import { auth } from "@/auth";
import { Resend } from "resend";
import * as Sentry from "@sentry/nextjs";
import {
  createPurchaseOrderSchema,
  receiveItemsSchema,
  type CreatePurchaseOrderInput,
  type ReceiveItemsInput,
} from "@/lib/validations/purchase-order";
import { inngest } from "@/lib/inngest/client";

// ActionResult tipi
type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

const getResend = () => new Resend(process.env.RESEND_API_KEY);

// ---------------------------------------------------------------------------
// Yardımcı: Tenant bazında yıllık sıralı PO numarası üret
// Örn: PO-2024-0001
// ---------------------------------------------------------------------------
async function generatePoNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
  const yearEnd = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const count = await prisma.purchaseOrder.count({
    where: {
      tenantId,
      createdAt: {
        gte: yearStart,
        lt: yearEnd,
      },
    },
  });

  return `PO-${year}-${String(count + 1).padStart(4, "0")}`;
}

// ---------------------------------------------------------------------------
// 3.2 createPurchaseOrder — PO oluştur
// ---------------------------------------------------------------------------
export async function createPurchaseOrder(
  data: CreatePurchaseOrderInput
): Promise<ActionResult<{ poId: string; poNumber: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;
    const validatedData = createPurchaseOrderSchema.parse(data);

    // Tedarikçi tenant'a ait mi kontrol et
    const supplier = await prisma.supplier.findFirst({
      where: { id: validatedData.supplierId, tenantId, deletedAt: null },
    });
    if (!supplier) {
      return { success: false, error: "Tedarikçi bulunamadı." };
    }

    // Parçaların tenant'a ait olduğunu doğrula
    const partIds = validatedData.items.map((i) => i.partId);
    const parts = await prisma.part.findMany({
      where: { id: { in: partIds }, tenantId, deletedAt: null },
    });
    if (parts.length !== partIds.length) {
      return { success: false, error: "Bir veya daha fazla parça bulunamadı." };
    }

    const poNumber = await generatePoNumber(tenantId);

    // Toplam hesapla
    let subTotal = 0;
    let taxAmount = 0;
    for (const item of validatedData.items) {
      const lineSubTotal = item.quantity * item.unitPrice;
      const lineTax = (lineSubTotal * item.taxRate) / 100;
      subTotal += lineSubTotal;
      taxAmount += lineTax;
    }
    const totalAmount = subTotal + taxAmount;

    const purchaseOrder = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          tenantId,
          poNumber,
          supplierId: validatedData.supplierId,
          status: "DRAFT",
          expectedDate: validatedData.expectedDate ?? null,
          notes: validatedData.notes ?? null,
          subTotal,
          taxAmount,
          totalAmount,
          createdById: session.user.id ?? null,
          items: {
            create: validatedData.items.map((item) => ({
              partId: item.partId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate,
              receivedQuantity: 0,
            })),
          },
        },
      });

      // AuditLog kaydı
      await tx.auditLog.create({
        data: {
          level: "INFO",
          module: "PURCHASE-ORDER",
          message: `Satın alma siparişi oluşturuldu: ${poNumber}`,
          tenantId,
          userId: session.user.id ?? null,
        },
      });

      return po;
    });

    revalidatePath("/dashboard/inventory/purchase-orders");
    return {
      success: true,
      data: { poId: purchaseOrder.id, poNumber: purchaseOrder.poNumber },
    };
  } catch (error: any) {
    Sentry.captureException(error);
    console.error("PO oluşturma hatası:", error);
    return { success: false, error: "Satın alma siparişi oluşturulamadı." };
  }
}

// ---------------------------------------------------------------------------
// 3.3 sendPurchaseOrder — DRAFT → SENT, tedarikçiye e-posta gönder
// ---------------------------------------------------------------------------
export async function sendPurchaseOrder(
  poId: string
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;

    const po = await prisma.purchaseOrder.findFirst({
      where: { id: poId, tenantId, deletedAt: null },
      include: {
        supplier: true,
        items: {
          include: { part: true },
        },
      },
    });

    if (!po) {
      return { success: false, error: "Satın alma siparişi bulunamadı." };
    }

    if (po.status !== "DRAFT") {
      return {
        success: false,
        error: `Sipariş gönderilemez. Mevcut durum: ${po.status}`,
      };
    }

    // Tedarikçi e-posta adresi varsa gönder
    if (po.supplier.email) {
      const itemsHtml = po.items
        .map(
          (item) => `
          <tr>
            <td style="padding:8px;border:1px solid #ddd;">${item.part.name}</td>
            <td style="padding:8px;border:1px solid #ddd;">${item.part.partNumber}</td>
            <td style="padding:8px;border:1px solid #ddd;">${Number(item.quantity)}</td>
            <td style="padding:8px;border:1px solid #ddd;">${Number(item.unitPrice).toFixed(2)} ₺</td>
            <td style="padding:8px;border:1px solid #ddd;">%${Number(item.taxRate)}</td>
          </tr>`
        )
        .join("");

      const emailHtml = `
        <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
          <h2 style="color:#1a56db;">Satın Alma Siparişi: ${po.poNumber}</h2>
          <p>Sayın ${po.supplier.name},</p>
          <p>Aşağıdaki ürünler için sipariş talebimizi iletiyoruz.</p>
          ${po.expectedDate ? `<p><strong>Beklenen Teslim Tarihi:</strong> ${new Date(po.expectedDate).toLocaleDateString("tr-TR")}</p>` : ""}
          ${po.notes ? `<p><strong>Notlar:</strong> ${po.notes}</p>` : ""}
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Parça Adı</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Parça No</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Miktar</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Birim Fiyat</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">KDV</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="margin-top:16px;text-align:right;">
            <p><strong>Ara Toplam:</strong> ${Number(po.subTotal).toFixed(2)} ₺</p>
            <p><strong>KDV:</strong> ${Number(po.taxAmount).toFixed(2)} ₺</p>
            <p style="font-size:1.1em;"><strong>Genel Toplam:</strong> ${Number(po.totalAmount).toFixed(2)} ₺</p>
          </div>
          <hr style="margin-top:24px;" />
          <p style="color:#6b7280;font-size:0.85em;">Bu e-posta MS Oto Servis platformu tarafından otomatik olarak gönderilmiştir.</p>
        </div>
      `;

      await getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "noreply@msotoservis.com",
        to: po.supplier.email,
        subject: `Satın Alma Siparişi: ${po.poNumber}`,
        html: emailHtml,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          level: "INFO",
          module: "PURCHASE-ORDER",
          message: `Satın alma siparişi tedarikçiye gönderildi: ${po.poNumber}`,
          tenantId,
          userId: session.user.id ?? null,
        },
      });
    });

    revalidatePath("/dashboard/inventory/purchase-orders");
    revalidatePath(`/dashboard/inventory/purchase-orders/${poId}`);
    return { success: true };
  } catch (error: any) {
    Sentry.captureException(error);
    console.error("PO gönderme hatası:", error);
    return { success: false, error: "Sipariş gönderilemedi." };
  }
}

// ---------------------------------------------------------------------------
// 3.4 receivePurchaseOrder — kısmi/tam teslim alım
// ---------------------------------------------------------------------------
export async function receivePurchaseOrder(
  poId: string,
  receiveData: ReceiveItemsInput
): Promise<ActionResult<{ status: string; receivedCount: number }>> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;
    const validatedData = receiveItemsSchema.parse(receiveData);

    const po = await prisma.purchaseOrder.findFirst({
      where: { id: poId, tenantId, deletedAt: null },
      include: {
        items: { include: { part: true } },
        supplier: true,
      },
    });

    if (!po) {
      return { success: false, error: "Satın alma siparişi bulunamadı." };
    }

    if (po.status === "RECEIVED" || po.status === "CANCELLED") {
      return {
        success: false,
        error: `Bu sipariş için teslim alım yapılamaz. Mevcut durum: ${po.status}`,
      };
    }

    // Teslim alınan kalemleri doğrula
    const itemMap = new Map(po.items.map((i) => [i.id, i]));
    for (const receiveItem of validatedData.items) {
      const poItem = itemMap.get(receiveItem.itemId);
      if (!poItem) {
        return {
          success: false,
          error: `Sipariş kalemi bulunamadı: ${receiveItem.itemId}`,
        };
      }
      const remaining =
        Number(poItem.quantity) - Number(poItem.receivedQuantity);
      if (receiveItem.receivedQuantity > remaining) {
        return {
          success: false,
          error: `${poItem.part.name} için teslim miktarı (${receiveItem.receivedQuantity}) kalan miktarı (${remaining}) aşıyor.`,
        };
      }
    }

    let receivedCount = 0;
    let totalReceivedAmount = 0;

    const result = await prisma.$transaction(async (tx) => {
      const stockMovements: string[] = [];

      for (const receiveItem of validatedData.items) {
        if (receiveItem.receivedQuantity <= 0) continue;

        const poItem = itemMap.get(receiveItem.itemId)!;
        receivedCount++;

        // Part.currentStock artır
        await tx.part.update({
          where: { id: poItem.partId },
          data: {
            currentStock: { increment: receiveItem.receivedQuantity },
          },
        });

        // PurchaseOrderItem.receivedQuantity güncelle
        await tx.purchaseOrderItem.update({
          where: { id: receiveItem.itemId },
          data: {
            receivedQuantity: {
              increment: receiveItem.receivedQuantity,
            },
          },
        });

        // StockMovement oluştur
        const movement = await tx.stockMovement.create({
          data: {
            tenantId,
            partId: poItem.partId,
            quantity: receiveItem.receivedQuantity,
            type: "IN",
            reason: `Satın Alma Siparişi: ${po.poNumber}`,
            purchaseOrderId: poId,
          },
        });
        stockMovements.push(movement.id);

        // Teslim alınan tutar hesapla (KDV dahil)
        const lineSubTotal =
          receiveItem.receivedQuantity * Number(poItem.unitPrice);
        const lineTax = (lineSubTotal * Number(poItem.taxRate)) / 100;
        totalReceivedAmount += lineSubTotal + lineTax;
      }

      // Güncel item durumlarını al
      const updatedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: poId },
      });

      // Durum belirle: tüm kalemler tam teslim alındı mı?
      const allReceived = updatedItems.every(
        (item) => Number(item.receivedQuantity) >= Number(item.quantity)
      );
      const anyReceived = updatedItems.some(
        (item) => Number(item.receivedQuantity) > 0
      );

      let newStatus: "SENT" | "PARTIALLY_RECEIVED" | "RECEIVED" = po.status as "SENT";
      if (allReceived) {
        newStatus = "RECEIVED";
      } else if (anyReceived) {
        newStatus = "PARTIALLY_RECEIVED";
      }

      // PO durumunu güncelle
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: {
          status: newStatus,
          receivedAt: allReceived ? new Date() : undefined,
        },
      });

      // Supplier.balance artır (teslim alınan tutar kadar)
      if (totalReceivedAmount > 0) {
        await tx.supplier.update({
          where: { id: po.supplierId },
          data: {
            balance: { increment: totalReceivedAmount },
          },
        });
      }

      // AuditLog kaydı
      await tx.auditLog.create({
        data: {
          level: "INFO",
          module: "PURCHASE-ORDER",
          message: `Teslim alım yapıldı: ${po.poNumber} — Durum: ${newStatus}`,
          tenantId,
          userId: session.user.id ?? null,
        },
      });

      return { newStatus, stockMovements };
    });

    // Her StockMovement için Inngest event tetikle
    for (const movementId of result.stockMovements) {
      await inngest.send({
        name: "stock/movement.created",
        data: {
          movementId,
          tenantId,
          purchaseOrderId: poId,
        },
      });
    }

    revalidatePath("/dashboard/inventory/purchase-orders");
    revalidatePath(`/dashboard/inventory/purchase-orders/${poId}`);
    revalidatePath("/dashboard/inventory");

    return {
      success: true,
      data: { status: result.newStatus, receivedCount },
    };
  } catch (error: any) {
    Sentry.captureException(error);
    console.error("Teslim alım hatası:", error);
    return { success: false, error: "Teslim alım işlemi gerçekleştirilemedi." };
  }
}

// ---------------------------------------------------------------------------
// 3.5 cancelPurchaseOrder — CANCELLED durumuna geç
// ---------------------------------------------------------------------------
export async function cancelPurchaseOrder(
  poId: string,
  reason?: string
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;

    const po = await prisma.purchaseOrder.findFirst({
      where: { id: poId, tenantId, deletedAt: null },
    });

    if (!po) {
      return { success: false, error: "Satın alma siparişi bulunamadı." };
    }

    if (po.status === "RECEIVED" || po.status === "CANCELLED") {
      return {
        success: false,
        error: `Bu sipariş iptal edilemez. Mevcut durum: ${po.status}`,
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: "CANCELLED" },
      });

      await tx.auditLog.create({
        data: {
          level: "WARN",
          module: "PURCHASE-ORDER",
          message: `Satın alma siparişi iptal edildi: ${po.poNumber}${reason ? ` — Neden: ${reason}` : ""}`,
          tenantId,
          userId: session.user.id ?? null,
        },
      });
    });

    revalidatePath("/dashboard/inventory/purchase-orders");
    revalidatePath(`/dashboard/inventory/purchase-orders/${poId}`);
    return { success: true };
  } catch (error: any) {
    Sentry.captureException(error);
    console.error("PO iptal hatası:", error);
    return { success: false, error: "Sipariş iptal edilemedi." };
  }
}

// ---------------------------------------------------------------------------
// 3.6 getPurchaseOrders — filtreli liste
// ---------------------------------------------------------------------------
export interface POFilters {
  status?: string;
  supplierId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

export async function getPurchaseOrders(
  filters?: POFilters
): Promise<ActionResult<{ orders: any[]; total: number }>> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: {
            select: { id: true, name: true, email: true, phone: true },
          },
          items: {
            include: {
              part: {
                select: { id: true, name: true, partNumber: true, unit: true },
              },
            },
          },
          _count: { select: { items: true, stockMovements: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return {
      success: true,
      data: {
        orders: JSON.parse(JSON.stringify(orders)),
        total,
      },
    };
  } catch (error: any) {
    Sentry.captureException(error);
    console.error("PO listesi hatası:", error);
    return { success: false, error: "Satın alma siparişleri listelenemedi." };
  }
}

// ---------------------------------------------------------------------------
// 3.7 getPurchaseOrderById — detay + kalemler + stok hareketleri
// ---------------------------------------------------------------------------
export async function getPurchaseOrderById(
  poId: string
): Promise<ActionResult<{ order: any }>> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;

    const order = await prisma.purchaseOrder.findFirst({
      where: { id: poId, tenantId, deletedAt: null },
      include: {
        supplier: true,
        items: {
          include: {
            part: {
              include: {
                category: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        stockMovements: {
          include: {
            part: {
              select: { id: true, name: true, partNumber: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Satın alma siparişi bulunamadı." };
    }

    return {
      success: true,
      data: { order: JSON.parse(JSON.stringify(order)) },
    };
  } catch (error: any) {
    Sentry.captureException(error);
    console.error("PO detay hatası:", error);
    return { success: false, error: "Sipariş detayı alınamadı." };
  }
}
