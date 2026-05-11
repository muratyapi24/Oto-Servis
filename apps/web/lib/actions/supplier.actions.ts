"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import { guardTenantRole } from "@/lib/guards";
import { SupplierInput, supplierSchema } from "../validations/suppliers";

export async function getSuppliers() {
  const g = await guardTenantRole(["TENANT_ADMIN", "RECEPTIONIST"]);
  if ("error" in g) return g as never;
  const { tenantId } = g;
  try {
    const suppliersResult = await prisma.supplier.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      include: {
        invoices: {
          where: { type: "PURCHASE", status: { not: "CANCELLED" } },
          select: { totalAmount: true }
        },
        payments: {
          select: { amount: true, paymentType: true }
        }
      },
      orderBy: {
        name: "asc",
      },
    });

    const suppliersWithDynamicBalance = suppliersResult.map(s => {
      const totalPurchases = s.invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
      const totalPaymentsOut = s.payments.filter(p => p.paymentType === "OUTGOING").reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const totalPaymentsIn = s.payments.filter(p => p.paymentType === "INCOMING").reduce((sum, p) => sum + Number(p.amount || 0), 0);
      
      const { invoices, payments, ...rest } = s;
      return {
        ...rest,
        balance: totalPurchases - totalPaymentsOut + totalPaymentsIn,
      };
    });

    const suppliers = JSON.parse(JSON.stringify(suppliersWithDynamicBalance));

    return { suppliers };
  } catch (err) {
    console.error("Tedarikçiler getirilemedi:", err);
    return { error: "Tedarikçiler listelenemedi" };
  }
}

export async function createSupplier(data: SupplierInput) {
  const g = await guardTenantRole(["TENANT_ADMIN"]);
  if ("error" in g) return g as never;
  const { tenantId } = g;
  try {
    const val = supplierSchema.parse(data);

    const supplier = await prisma.supplier.create({
      data: {
        ...val,
        tenantId,
      },
    });

    const plainSupplier = JSON.parse(JSON.stringify(supplier));

    revalidatePath("/dashboard/suppliers");
    return { success: "Tedarikçi başarıyla eklendi", supplier: plainSupplier };
  } catch (err) {
    console.error("Tedarikçi eklenemedi:", err);
    return { error: "İşlem başarısız oldu" };
  }
}

export async function updateSupplier(id: string, data: SupplierInput) {
  const g = await guardTenantRole(["TENANT_ADMIN"]);
  if ("error" in g) return g as never;
  const { tenantId } = g;
  try {
    const val = supplierSchema.parse(data);

    await prisma.supplier.update({
      where: { id, tenantId },
      data: val,
    });

    revalidatePath("/dashboard/suppliers");
    return { success: "Tedarikçi güncellendi" };
  } catch (err) {
    console.error("Güncelleme hatası:", err);
    return { error: "Güncelleme başarısız" };
  }
}

export async function deleteSupplier(id: string) {
  const g = await guardTenantRole(["TENANT_ADMIN"]);
  if ("error" in g) return g as never;
  const { tenantId } = g;
  try {
    await prisma.supplier.update({
      where: { id, tenantId },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/dashboard/suppliers");
    return { success: "Tedarikçi silindi" };
  } catch (err) {
    return { error: "Silme işlemi başarısız" };
  }
}
