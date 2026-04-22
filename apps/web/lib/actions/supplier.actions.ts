"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import { auth } from "@/auth";
import { SupplierInput, supplierSchema } from "../validations/suppliers";

export async function getSuppliers() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

    const suppliersResult = await prisma.supplier.findMany({
      where: {
        tenantId: session.user.tenantId,
        deletedAt: null,
      },
      orderBy: {
        name: "asc",
      },
    });

    const suppliers = JSON.parse(JSON.stringify(suppliersResult));

    return { suppliers };
  } catch (err) {
    console.error("Tedarikçiler getirilemedi:", err);
    return { error: "Tedarikçiler listelenemedi" };
  }
}

export async function createSupplier(data: SupplierInput) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

    const val = supplierSchema.parse(data);

    const supplier = await prisma.supplier.create({
      data: {
        ...val,
        tenantId: session.user.tenantId,
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
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz" };

    const val = supplierSchema.parse(data);

    await prisma.supplier.update({
      where: { id, tenantId: session.user.tenantId },
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
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz" };

    await prisma.supplier.update({
      where: { id, tenantId: session.user.tenantId },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/dashboard/suppliers");
    return { success: "Tedarikçi silindi" };
  } catch (err) {
    return { error: "Silme işlemi başarısız" };
  }
}
