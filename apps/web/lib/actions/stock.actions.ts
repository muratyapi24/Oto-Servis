"use server";

import { guardTenant } from "@/lib/guards";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";

interface PurchaseItem {
  partId: string;
  quantity: number;
  purchasePrice: number;
  taxRate: number;
}

/** Yeni parça bilgisi — fatura satırında inline oluşturulacak */
interface NewPartItem {
  isNew: true;
  categoryId: string;
  partNumber: string;
  name: string;
  brand?: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  taxRate: number;
  quantity: number;
  location?: string;
  minStockLevel?: number;
}

/** Mevcut parça referansı */
interface ExistingPartItem {
  isNew?: false;
  partId: string;
  quantity: number;
  purchasePrice: number;
  taxRate: number;
}

type PurchaseLineItem = NewPartItem | ExistingPartItem;

export async function createPurchaseInvoice(data: {
  supplierId: string;
  invoiceNumber: string;
  issueDate: Date;
  items: PurchaseLineItem[];
  notes?: string;
}) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    // İşlem başlat (Transaction)
    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      let totalTax = 0;
      let subTotal = 0;

      // 1. Faturayı oluştur
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          supplierId: data.supplierId,
          invoiceNumber: data.invoiceNumber,
          issueDate: data.issueDate,
          type: "PURCHASE",
          status: "SENT",
          notes: data.notes,
          subTotal: 0,
          taxAmount: 0,
          totalAmount: 0,
        },
      });

      // 2. Tedarikçi adını al (yeni parçalar için supplierName)
      const supplier = await tx.supplier.findUnique({
        where: { id: data.supplierId },
        select: { name: true },
      });

      // 3. Her bir kalem için işlemleri yap
      for (const item of data.items) {
        const lineSubTotal = item.quantity * item.purchasePrice;
        const lineTax = (lineSubTotal * item.taxRate) / 100;
        const lineTotal = lineSubTotal + lineTax;

        subTotal += lineSubTotal;
        totalTax += lineTax;
        totalAmount += lineTotal;

        let partId: string;

        if (item.isNew) {
          // ── YENİ PARÇA: Stok kartı oluştur ──
          const newItem = item as NewPartItem;

          // Aynı partNumber veya name kontrolü
          const exists = await tx.part.findFirst({
            where: {
              tenantId,
              OR: [
                { partNumber: newItem.partNumber },
                { name: newItem.name }
              ]
            },
          });
          if (exists) {
            throw new Error(`"${newItem.partNumber}" barkodlu veya "${newItem.name}" isimli parça sistemde zaten kayıtlı.`);
          }

          const newPart = await tx.part.create({
            data: {
              tenantId,
              categoryId: newItem.categoryId,
              partNumber: newItem.partNumber,
              name: newItem.name,
              brand: newItem.brand || null,
              unit: newItem.unit,
              purchasePrice: newItem.purchasePrice,
              sellingPrice: newItem.sellingPrice,
              taxRate: newItem.taxRate,
              currentStock: newItem.quantity,
              minStockLevel: newItem.minStockLevel || 5,
              location: newItem.location || null,
              supplierName: supplier?.name || null,
              isActive: true,
            },
          });
          partId = newPart.id;
        } else {
          // ── MEVCUT PARÇA: Stok güncelle ──
          const existingItem = item as ExistingPartItem;
          partId = existingItem.partId;

          await tx.part.update({
            where: { id: partId, tenantId },
            data: {
              currentStock: { increment: item.quantity },
              purchasePrice: item.purchasePrice,
            },
          });
        }

        // Stok Hareketi kaydı
        await tx.stockMovement.create({
          data: {
            tenantId,
            partId,
            quantity: item.quantity,
            type: "IN",
            reason: `Alım Faturası: ${data.invoiceNumber}`,
            invoiceId: invoice.id,
          },
        });
      }

      // 4. Fatura toplamlarını güncelle
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          subTotal,
          taxAmount: totalTax,
          totalAmount,
        },
      });

      // 5. Tedarikçi bakiyesini güncelle
      await tx.supplier.update({
        where: { id: data.supplierId, tenantId },
        data: {
          balance: { increment: totalAmount },
        },
      });

      return JSON.parse(JSON.stringify(updatedInvoice));
    });

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/finances");
    revalidatePath("/dashboard/suppliers");

    return { success: "Stok girişi başarıyla yapıldı", invoice: result };
  } catch (err: any) {
    console.error("Stok girişi hatası:", err);
    return { error: err?.message || "İşlem sırasında bir hata oluştu" };
  }
}

export async function getPurchaseInvoices() {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const invoicesResult = await prisma.invoice.findMany({
      where: {
        tenantId: tenantId,
        type: "PURCHASE",
      },
      include: {
        supplier: true,
      },
      orderBy: {
        issueDate: "desc",
      },
    });

    const invoices = JSON.parse(JSON.stringify(invoicesResult));

    return { invoices };
  } catch (err) {
    return { error: "Faturalar getirilemedi" };
  }
}
