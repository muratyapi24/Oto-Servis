"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import { auth } from "@/auth";

interface PurchaseItem {
  partId: string;
  quantity: number;
  purchasePrice: number;
  taxRate: number;
}

export async function createPurchaseInvoice(data: {
  supplierId: string;
  invoiceNumber: string;
  issueDate: Date;
  items: PurchaseItem[];
  notes?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

    const tenantId = session.user.tenantId;

    // İşlem başlat (Transaction)
    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      let totalTax = 0;
      let subTotal = 0;

      // 1. Faturayı oluştur (DRAFT olarak başla, sonra SENT/PAID yapılabilir)
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          supplierId: data.supplierId,
          invoiceNumber: data.invoiceNumber,
          issueDate: data.issueDate,
          type: "PURCHASE",
          status: "SENT", // Alım faturası girildiği an borç işlenir
          notes: data.notes,
          // Geçici değerler, aşağıda güncellenecek
          subTotal: 0,
          taxAmount: 0,
          totalAmount: 0,
        },
      });

      // 2. Her bir kalem için işlemleri yap
      for (const item of data.items) {
        const lineSubTotal = item.quantity * item.purchasePrice;
        const lineTax = (lineSubTotal * item.taxRate) / 100;
        const lineTotal = lineSubTotal + lineTax;

        subTotal += lineSubTotal;
        totalTax += lineTax;
        totalAmount += lineTotal;

        // a. Parçanın stok miktarını ve alış fiyatını güncelle
        await tx.part.update({
          where: { id: item.partId, tenantId },
          data: {
            currentStock: { increment: item.quantity },
            purchasePrice: item.purchasePrice, // Son alış fiyatı
          },
        });

        // b. Stok Hareketi kaydı oluştur
        await tx.stockMovement.create({
          data: {
            tenantId,
            partId: item.partId,
            quantity: item.quantity,
            type: "IN",
            reason: `Alım Faturası: ${data.invoiceNumber}`,
            invoiceId: invoice.id,
          },
        });
      }

      // 3. Fatura toplamlarını güncelle
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          subTotal,
          taxAmount: totalTax,
          totalAmount,
        },
      });

      // 4. Tedarikçi bakiyesini güncelle (Borç artışı)
      await tx.supplier.update({
        where: { id: data.supplierId, tenantId },
        data: {
          balance: { increment: totalAmount },
        },
      });

      return JSON.parse(JSON.stringify(updatedInvoice));
    });

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/finance");
    revalidatePath("/dashboard/suppliers");

    return { success: "Stok girişi başarıyla yapıldı", invoice: result };
  } catch (err) {
    console.error("Stok girişi hatası:", err);
    return { error: "İşlem sırasında bir hata oluştu" };
  }
}

export async function getPurchaseInvoices() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz" };

    const invoicesResult = await prisma.invoice.findMany({
      where: {
        tenantId: session.user.tenantId,
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
