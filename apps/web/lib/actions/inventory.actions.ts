"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import { auth } from "@/auth";
import * as Sentry from "@sentry/nextjs";
import { inngest } from "@/lib/inngest/client";
import { CreatePartCategoryInput, createPartCategorySchema, CreatePartInput, createPartSchema, UpdatePartCategoryInput, updatePartCategorySchema, UpdatePartInput, updatePartSchema } from "@/lib/validations/inventory";
import { getCached, invalidateCache, CacheKeys, CacheTTL } from "@/lib/cache";
import { publishStockUpdate } from "@/lib/sse";

// Kategori İşlemleri

export async function createPartCategory(data: CreatePartCategoryInput) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { error: "Yetkisiz erişim." };
    }

    const validatedData = createPartCategorySchema.parse(data);

    // Aynı isme sahip kategori kontrolü
    const exists = await prisma.partCategory.findFirst({
      where: {
        tenantId: session.user.tenantId,
        name: { equals: validatedData.name, mode: "insensitive" }
      }
    });

    if (exists) {
      return { error: "Bu isimde bir kategori zaten var." };
    }

    const newCategory = await prisma.partCategory.create({
      data: {
        tenantId: session.user.tenantId,
        name: validatedData.name,
        description: validatedData.description || null,
        isActive: validatedData.isActive,
      },
    });

    revalidatePath("/dashboard/inventory");
    return { success: "Kategori oluşturuldu", categoryId: newCategory.id };
  } catch (error: any) {
    console.error("Kategori kaydı hatası:", error);
    return { error: "Kategori oluşturulamadı." };
  }
}

export async function getPartCategories() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      throw new Error("Yetkisiz erişim");
    }

    const categories = await prisma.partCategory.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { parts: true } }
      }
    });

    return { categories };
  } catch (error: any) {
    console.error("Kategoriler getirilemedi:", error);
    return { error: "Kategori listesi alınamadı." };
  }
}

// Parça (Stok Kartı) İşlemleri

export async function createPart(data: CreatePartInput) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { error: "Yetkisiz erişim." };
    }

    const validatedData = createPartSchema.parse(data);

    // Aynı barkodlu/parça numaralı parça kontrolü
    const exists = await prisma.part.findFirst({
      where: {
        tenantId: session.user.tenantId,
        partNumber: validatedData.partNumber
      }
    });

    if (exists) {
      return { error: "Bu parça veya barkod numarası sistemde zaten kayıtlı." };
    }

    const newPart = await prisma.part.create({
      data: {
        tenantId: session.user.tenantId,
        categoryId: validatedData.categoryId,
        partNumber: validatedData.partNumber,
        name: validatedData.name,
        description: validatedData.description || null,
        brand: validatedData.brand || null,
        unit: validatedData.unit,
        purchasePrice: validatedData.purchasePrice,
        sellingPrice: validatedData.sellingPrice,
        taxRate: validatedData.taxRate,
        minStockLevel: validatedData.minStockLevel,
        currentStock: validatedData.currentStock,
        location: validatedData.location || null,
        supplierName: validatedData.supplierName || null,
        isActive: validatedData.isActive,
      },
    });

    revalidatePath("/dashboard/inventory");
    await invalidateCache(`inventory:parts:${session.user.tenantId}:*`);
    return { success: "Parça / Stok Kartı başarıyla oluşturuldu", partId: newPart.id };
  } catch (error: any) {
    console.error("Parça kaydı hatası:", error);
    return { error: "Parça kaydedilirken bir hata oluştu." };
  }
}

export async function getParts() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      throw new Error("Yetkisiz erişim");
    }

    const tenantId = session.user.tenantId;
    const cacheKey = CacheKeys.inventoryParts(tenantId);

    const serializedParts = await getCached(cacheKey, CacheTTL.inventoryParts, async () => {
      const parts = await prisma.part.findMany({
        where: { tenantId, deletedAt: null },
        include: { category: true },
        orderBy: { createdAt: "desc" },
      });
      return parts.map(p => ({
        ...p,
        purchasePrice: Number(p.purchasePrice.toString()),
        sellingPrice: Number(p.sellingPrice.toString()),
        taxRate: Number(p.taxRate.toString()),
      }));
    });

    return { parts: serializedParts };
  } catch (error: any) {
    console.error("Parçalar getirilemedi:", error);
    return { error: "Stok listesi alınamadı." };
  }
}

// Envanter/Stok Metrikleri ve Dashboard Analitiği
export async function getInventoryDashboard() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

    const tenantId = session.user.tenantId;

    // Tüm Parçalar
    const allParts = await prisma.part.findMany({
      where: { tenantId, deletedAt: null },
      include: { category: true }
    });

    let totalStockValue = 0;
    let totalItems = 0;
    const lowStockItems: any[] = [];
    
    // Toplam değer ve kritik stok tespiti
    allParts.forEach((part) => {
      totalItems += part.currentStock;
      const purchPrice = Number(part.purchasePrice.toString());
      totalStockValue += (part.currentStock * purchPrice);

      if (part.currentStock <= part.minStockLevel) {
        lowStockItems.push({
          ...part,
          purchasePrice: purchPrice,
          sellingPrice: Number(part.sellingPrice.toString()),
          taxRate: Number(part.taxRate.toString()),
        });
      }
    });

    // Kategoriler ve onlara ait stok adetleri (Analiz grafiği/dağılımı için)
    const categories = await prisma.partCategory.findMany({
      where: { tenantId },
      include: { _count: { select: { parts: true } } }
    });

    // En son stok hareketleri (Stock Movement)
    const recentMovementsRows = await prisma.stockMovement.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { part: true }
    });

    const recentMovements = recentMovementsRows.map(m => ({
      partName: m.part.name,
      partNumber: m.part.partNumber,
      type: m.type, // 'IN', 'OUT', 'ADJUST'
      quantity: Number(m.quantity),
      reason: m.reason,
      date: m.createdAt
    }));

    return {
      metrics: {
        totalPartsTypes: allParts.length,
        totalItems,
        totalStockValue,
        lowStockCount: lowStockItems.length,
      },
      lowStockItems,
      allParts: allParts.map(p => ({
         ...p, 
         purchasePrice: Number(p.purchasePrice.toString()), 
         sellingPrice: Number(p.sellingPrice.toString()),
         taxRate: Number(p.taxRate.toString()),
      })),
      categories,
      recentMovements
    };
  } catch (err: any) {
    console.error("Inventory Dashboard Error:", err);
    return { error: "Stok analiz verileri alınırken bir hata oluştu." };
  }
}

export async function updatePart(data: UpdatePartInput) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

    const validatedData = updatePartSchema.parse(data);

    await prisma.part.update({
      where: { id: validatedData.id, tenantId: session.user.tenantId },
      data: {
        categoryId: validatedData.categoryId,
        partNumber: validatedData.partNumber,
        name: validatedData.name,
        description: validatedData.description,
        brand: validatedData.brand,
        unit: validatedData.unit,
        purchasePrice: validatedData.purchasePrice,
        sellingPrice: validatedData.sellingPrice,
        taxRate: validatedData.taxRate,
        minStockLevel: validatedData.minStockLevel,
        currentStock: validatedData.currentStock,
        location: validatedData.location,
        supplierName: validatedData.supplierName,
        isActive: validatedData.isActive,
      }
    });

    revalidatePath("/dashboard/inventory");
    return { success: "Parça başarıyla güncellendi." };
  } catch (err: any) {
    Sentry.captureException(err);
    return { error: "Parça güncellenemedi." };
  }
}

export async function deletePart(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

    await prisma.part.update({
      where: { id, tenantId: session.user.tenantId },
      data: { deletedAt: new Date() }
    });

    revalidatePath("/dashboard/inventory");
    return { success: "Parça başarıyla silindi." };
  } catch (err: any) {
    Sentry.captureException(err);
    return { error: "Parça silinemedi." };
  }
}

export async function updatePartCategory(data: UpdatePartCategoryInput) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

    const val = updatePartCategorySchema.parse(data);

    await prisma.partCategory.update({
      where: { id: val.id, tenantId: session.user.tenantId },
      data: {
        name: val.name,
        description: val.description,
        isActive: val.isActive
      }
    });

    revalidatePath("/dashboard/inventory");
    return { success: "Kategori güncellendi." };
  } catch (err: any) {
    Sentry.captureException(err);
    return { error: "Kategori güncellenemedi." };
  }
}

export async function deletePartCategory(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

    // Check if parts exist
    const partCount = await prisma.part.count({
      where: { categoryId: id, tenantId: session.user.tenantId, deletedAt: null }
    });

    if (partCount > 0) {
      return { error: "Bu kategoriye bağlı aktif parçalar bulunuyor. Silmeden önce parçaları taşıyın." };
    }

    await prisma.partCategory.delete({
      where: { id, tenantId: session.user.tenantId }
    });

    revalidatePath("/dashboard/inventory");
    return { success: "Kategori silindi." };
  } catch (err: any) {
    Sentry.captureException(err);
    return { error: "Kategori silinemedi." };
  }
}

export async function adjustStock(id: string, newQuantity: number, reason: string) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

    const part = await prisma.part.findFirst({
      where: { id, tenantId: session.user.tenantId, deletedAt: null }
    });

    if (!part) return { error: "Parça bulunamadı." };

    const diff = newQuantity - part.currentStock;
    if (diff === 0) return { error: "Stok miktarı değişmedi." };

    const movement = await prisma.$transaction(async (tx) => {
      await tx.part.update({
        where: { id },
        data: { currentStock: newQuantity }
      });

      const created = await tx.stockMovement.create({
        data: {
          tenantId: session.user.tenantId!,
          partId: id,
          type: "ADJUST",
          quantity: diff, // Can be negative or positive
          reason: reason || "Stok sayımı düzeltmesi"
        }
      });

      return created;
    });

    // Inngest event tetikle
    await inngest.send({
      name: "stock/movement.created",
      data: {
        movementId: movement.id,
        tenantId: session.user.tenantId!,
        partId: id,
      },
    });

    // SSE: Stok güncelleme event'i yayınla
    const updatedPart = await prisma.part.findUnique({
      where: { id },
      select: { partNumber: true, name: true, currentStock: true, locationId: true },
    });
    if (updatedPart) {
      publishStockUpdate(session.user.tenantId!, {
        partId: id,
        partNumber: updatedPart.partNumber,
        partName: updatedPart.name,
        newStock: updatedPart.currentStock,
        movementType: "ADJUST",
        locationId: updatedPart.locationId ?? undefined,
      });
    }

    revalidatePath("/dashboard/inventory");
    return { success: "Stok başarıyla güncellendi." };
  } catch (err: any) {
    Sentry.captureException(err);
    return { error: "Stok düzeltilemedi." };
  }
}

export async function getStockAlerts() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

    const parts = await prisma.part.findMany({
      where: { tenantId: session.user.tenantId, deletedAt: null },
      select: { id: true, name: true, partNumber: true, currentStock: true, minStockLevel: true }
    });

    const alerts = parts.filter(p => p.currentStock <= p.minStockLevel);
    return { alerts };
  } catch(err: any) {
    return { error: "Stok uyarıları alınamadı." };
  }
}

/** Düşük stoklu parçalar hakkında SMS bildirimi gönder (Teknisyen/Yöneticiye) **/
export async function sendLowStockAlert() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };
    const tenantId = session.user.tenantId;

    // Kritik stok seviyesindeki parçaları bul
    const lowParts = await prisma.part.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      select: { name: true, partNumber: true, currentStock: true, minStockLevel: true }
    });

    const critical = lowParts.filter(p => p.currentStock <= p.minStockLevel);

    if (critical.length === 0) {
      return { success: "Tüm stok seviyeleri yeterli, uyarı gönderecek parça yok." };
    }

    // Tenant admin'in e-posta adresini ve tenant telefonunu al
    const admin = await prisma.user.findFirst({
      where: { tenantId, role: { in: ["TENANT_ADMIN", "SUPER_ADMIN"] } },
      select: { email: true, name: true, tenant: { select: { phone: true } } }
    });

    if (!admin?.tenant?.phone) {
      return { error: "Yönetici telefon numarası kayıtlı değil." };
    }

    // İlk 5 kritik parçayı SMS'e dahil et
    const partsList = critical.slice(0, 5).map(p =>
      `• ${p.name} (${p.partNumber || "—"}): ${p.currentStock}/${p.minStockLevel}`
    ).join("\n");

    const message = `⚠️ STOK UYARISI\n${critical.length} parça kritik seviyede:\n${partsList}${critical.length > 5 ? `\n...ve ${critical.length - 5} parça daha` : ""}\nLütfen tedarik siparişi oluşturun.`;

    const { sendSms } = await import("@/lib/notifications/sms");
    const result = await sendSms({
      to: admin.tenant.phone,
      body: message,
      tenantId
    });

    if (result.success) {
      return { success: `${critical.length} parça için stok uyarısı SMS gönderildi.` };
    } else {
      return { error: result.error || "SMS gönderilemedi" };
    }
  } catch (error: any) {
    Sentry.captureException(error);
    return { error: "Stok uyarı bildirimi gönderilemedi: " + error.message };
  }
}

// =============================================================================
// 6.1 — Barkod ile Parça Arama
// =============================================================================

export async function findPartByBarcode(barcode: string) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim." };

    if (!barcode?.trim()) return { error: "Barkod boş olamaz." };

    const part = await prisma.part.findFirst({
      where: {
        tenantId: session.user.tenantId,
        deletedAt: null,
        partNumber: { equals: barcode.trim(), mode: "insensitive" },
      },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });

    return {
      success: true,
      data: {
        part: part
          ? {
              ...part,
              purchasePrice: Number(part.purchasePrice.toString()),
              sellingPrice: Number(part.sellingPrice.toString()),
              taxRate: Number(part.taxRate.toString()),
            }
          : null,
      },
    };
  } catch (err: any) {
    Sentry.captureException(err);
    return { error: "Barkod araması başarısız." };
  }
}

// =============================================================================
// 6.2 — Hızlı Stok Girişi (Barkod Tarama Sonrası)
// =============================================================================

export async function quickStockEntry(
  partId: string,
  quantity: number,
  reason?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim." };

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { error: "Miktar pozitif bir tam sayı olmalıdır." };
    }

    const part = await prisma.part.findFirst({
      where: { id: partId, tenantId: session.user.tenantId, deletedAt: null },
    });

    if (!part) return { error: "Parça bulunamadı." };

    const movement = await prisma.$transaction(async (tx) => {
      await tx.part.update({
        where: { id: partId },
        data: { currentStock: { increment: quantity } },
      });

      const created = await tx.stockMovement.create({
        data: {
          tenantId: session.user.tenantId!,
          partId,
          type: "IN",
          quantity,
          reason: reason || "Hızlı Stok Girişi",
        },
      });

      return created;
    });

    // Inngest event tetikle
    await inngest.send({
      name: "stock/movement.created",
      data: {
        movementId: movement.id,
        tenantId: session.user.tenantId!,
        partId,
      },
    });

    // SSE: Stok güncelleme event'i yayınla
    const updatedPart = await prisma.part.findUnique({
      where: { id: partId },
      select: { partNumber: true, name: true, currentStock: true, locationId: true },
    });
    if (updatedPart) {
      publishStockUpdate(session.user.tenantId!, {
        partId,
        partNumber: updatedPart.partNumber,
        partName: updatedPart.name,
        newStock: updatedPart.currentStock,
        movementType: "IN",
        locationId: updatedPart.locationId ?? undefined,
      });
    }

    revalidatePath("/dashboard/inventory");
    return { success: true, data: { movementId: movement.id } };
  } catch (err: any) {
    Sentry.captureException(err);
    return { error: "Stok girişi yapılamadı." };
  }
}

// =============================================================================
// 6.3 — Servis → Depo İadesi
// =============================================================================

export interface ServiceReturnInput {
  partId: string;
  quantity: number;
  serviceOrderId: string;
}

export async function returnPartFromService(data: ServiceReturnInput) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim." };

    const { partId, quantity, serviceOrderId } = data;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { error: "Miktar pozitif bir tam sayı olmalıdır." };
    }

    const part = await prisma.part.findFirst({
      where: { id: partId, tenantId: session.user.tenantId, deletedAt: null },
    });

    if (!part) return { error: "Parça bulunamadı." };

    const movement = await prisma.$transaction(async (tx) => {
      await tx.part.update({
        where: { id: partId },
        data: { currentStock: { increment: quantity } },
      });

      const created = await tx.stockMovement.create({
        data: {
          tenantId: session.user.tenantId!,
          partId,
          type: "IN",
          quantity,
          reason: `Servis İadesi: #${serviceOrderId}`,
          serviceOrderId,
        },
      });

      return created;
    });

    // Inngest event tetikle
    await inngest.send({
      name: "stock/movement.created",
      data: {
        movementId: movement.id,
        tenantId: session.user.tenantId!,
        partId,
      },
    });

    // SSE: Stok güncelleme event'i yayınla
    const updatedPart = await prisma.part.findUnique({
      where: { id: partId },
      select: { partNumber: true, name: true, currentStock: true, locationId: true },
    });
    if (updatedPart) {
      publishStockUpdate(session.user.tenantId!, {
        partId,
        partNumber: updatedPart.partNumber,
        partName: updatedPart.name,
        newStock: updatedPart.currentStock,
        movementType: "IN",
        locationId: updatedPart.locationId ?? undefined,
      });
    }

    revalidatePath("/dashboard/inventory");
    return { success: true, data: { movementId: movement.id } };
  } catch (err: any) {
    Sentry.captureException(err);
    return { error: "Servis iadesi gerçekleştirilemedi." };
  }
}

// =============================================================================
// 6.4 — Tedarikçiye İade
// =============================================================================

export interface SupplierReturnInput {
  partId: string;
  quantity: number;
  supplierId: string;
  supplierName: string;
}

export async function returnPartToSupplier(data: SupplierReturnInput) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim." };

    const { partId, quantity, supplierId, supplierName } = data;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { error: "Miktar pozitif bir tam sayı olmalıdır." };
    }

    const part = await prisma.part.findFirst({
      where: { id: partId, tenantId: session.user.tenantId, deletedAt: null },
    });

    if (!part) return { error: "Parça bulunamadı." };

    // Negatif stok koruması
    if (part.currentStock < quantity) {
      return {
        error: `Yetersiz stok. Mevcut: ${part.currentStock}, İstenen: ${quantity}`,
      };
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, tenantId: session.user.tenantId },
    });

    if (!supplier) return { error: "Tedarikçi bulunamadı." };

    const movement = await prisma.$transaction(async (tx) => {
      await tx.part.update({
        where: { id: partId },
        data: { currentStock: { decrement: quantity } },
      });

      const created = await tx.stockMovement.create({
        data: {
          tenantId: session.user.tenantId!,
          partId,
          type: "OUT",
          quantity,
          reason: `Tedarikçi İadesi: ${supplierName}`,
        },
      });

      // Supplier.balance azalt (iade tutarı = quantity × purchasePrice)
      const returnAmount = Number(part.purchasePrice.toString()) * quantity;
      await tx.supplier.update({
        where: { id: supplierId },
        data: { balance: { decrement: returnAmount } },
      });

      return created;
    });

    // Inngest event tetikle
    await inngest.send({
      name: "stock/movement.created",
      data: {
        movementId: movement.id,
        tenantId: session.user.tenantId!,
        partId,
      },
    });

    // SSE: Stok güncelleme event'i yayınla
    const updatedPart = await prisma.part.findUnique({
      where: { id: partId },
      select: { partNumber: true, name: true, currentStock: true, locationId: true },
    });
    if (updatedPart) {
      publishStockUpdate(session.user.tenantId!, {
        partId,
        partNumber: updatedPart.partNumber,
        partName: updatedPart.name,
        newStock: updatedPart.currentStock,
        movementType: "OUT",
        locationId: updatedPart.locationId ?? undefined,
      });
    }

    revalidatePath("/dashboard/inventory");
    return { success: true, data: { movementId: movement.id } };
  } catch (err: any) {
    Sentry.captureException(err);
    return { error: "Tedarikçi iadesi gerçekleştirilemedi." };
  }
}

// =============================================================================
// 6.5 — Stok Değer Raporu (Kategori Bazlı)
// =============================================================================

export interface StockValueReportFilters {
  categoryId?: string;
  locationId?: string;
}

export async function getStockValueReport(filters?: StockValueReportFilters) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim." };

    const tenantId = session.user.tenantId;

    const parts = await prisma.part.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(filters?.categoryId && { categoryId: filters.categoryId }),
        ...(filters?.locationId && { locationId: filters.locationId }),
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    // Kategori bazlı gruplama
    const categoryMap = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        partCount: number;
        totalStock: number;
        totalValue: number;
        parts: Array<{
          id: string;
          name: string;
          partNumber: string;
          currentStock: number;
          purchasePrice: number;
          stockValue: number;
        }>;
      }
    >();

    let grandTotalValue = 0;
    let grandTotalStock = 0;

    for (const part of parts) {
      const purchasePrice = Number(part.purchasePrice.toString());
      const stockValue = part.currentStock * purchasePrice;

      grandTotalValue += stockValue;
      grandTotalStock += part.currentStock;

      const catId = part.category.id;
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          categoryId: catId,
          categoryName: part.category.name,
          partCount: 0,
          totalStock: 0,
          totalValue: 0,
          parts: [],
        });
      }

      const cat = categoryMap.get(catId)!;
      cat.partCount += 1;
      cat.totalStock += part.currentStock;
      cat.totalValue += stockValue;
      cat.parts.push({
        id: part.id,
        name: part.name,
        partNumber: part.partNumber,
        currentStock: part.currentStock,
        purchasePrice,
        stockValue,
      });
    }

    return {
      success: true,
      data: {
        categories: Array.from(categoryMap.values()).sort(
          (a, b) => b.totalValue - a.totalValue
        ),
        summary: {
          totalCategories: categoryMap.size,
          totalPartTypes: parts.length,
          grandTotalStock,
          grandTotalValue,
        },
      },
    };
  } catch (err: any) {
    Sentry.captureException(err);
    return { error: "Stok değer raporu alınamadı." };
  }
}

// =============================================================================
// 6.6 — Stok Hareket Geçmişi Raporu
// =============================================================================

export interface MovementReportFilters {
  startDate?: Date;
  endDate?: Date;
  partId?: string;
  locationId?: string;
  type?: "IN" | "OUT" | "ADJUST";
  page?: number;
  pageSize?: number;
}

export async function getStockMovementReport(filters: MovementReportFilters) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim." };

    const tenantId = session.user.tenantId;
    const page = filters.page ?? 1;
    const pageSize = Math.min(filters.pageSize ?? 50, 200);
    const skip = (page - 1) * pageSize;

    const where = {
      tenantId,
      ...(filters.partId && { partId: filters.partId }),
      ...(filters.locationId && { locationId: filters.locationId }),
      ...(filters.type && { type: filters.type }),
      ...(filters.startDate || filters.endDate
        ? {
            createdAt: {
              ...(filters.startDate && { gte: filters.startDate }),
              ...(filters.endDate && { lte: filters.endDate }),
            },
          }
        : {}),
    };

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          part: {
            select: {
              id: true,
              name: true,
              partNumber: true,
              unit: true,
            },
          },
          location: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return {
      success: true,
      data: {
        movements: movements.map((m) => ({
          id: m.id,
          type: m.type,
          quantity: Number(m.quantity.toString()),
          reason: m.reason,
          createdAt: m.createdAt,
          part: m.part,
          location: m.location,
        })),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    };
  } catch (err: any) {
    Sentry.captureException(err);
    return { error: "Hareket geçmişi raporu alınamadı." };
  }
}

// =============================================================================
// 6.7 — En Çok Kullanılan Parçalar
// =============================================================================

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export async function getTopUsedParts(dateRange: DateRange, limit = 20) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim." };

    const tenantId = session.user.tenantId;
    const safeLimit = Math.min(Math.max(limit, 1), 100);

    // OUT hareketlerini partId bazında grupla ve topla
    const movements = await prisma.stockMovement.groupBy({
      by: ["partId"],
      where: {
        tenantId,
        type: "OUT",
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: safeLimit,
    });

    if (movements.length === 0) {
      return { success: true, data: { parts: [] } };
    }

    const partIds = movements.map((m) => m.partId);
    const parts = await prisma.part.findMany({
      where: { id: { in: partIds }, tenantId, deletedAt: null },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    const partMap = new Map(parts.map((p) => [p.id, p]));

    const result = movements
      .map((m) => {
        const part = partMap.get(m.partId);
        if (!part) return null;
        return {
          partId: m.partId,
          name: part.name,
          partNumber: part.partNumber,
          category: part.category,
          currentStock: part.currentStock,
          purchasePrice: Number(part.purchasePrice.toString()),
          sellingPrice: Number(part.sellingPrice.toString()),
          totalUsedQuantity: Number((m._sum.quantity ?? 0).toString()),
          movementCount: m._count.id,
        };
      })
      .filter(Boolean);

    return { success: true, data: { parts: result } };
  } catch (err: any) {
    Sentry.captureException(err);
    return { error: "En çok kullanılan parçalar raporu alınamadı." };
  }
}

// =============================================================================
// 6.8 — Kritik Stok Raporu
// =============================================================================

export async function getCriticalStockReport() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim." };

    const tenantId = session.user.tenantId;

    const parts = await prisma.part.findMany({
      where: {
        tenantId,
        deletedAt: null,
        // currentStock <= minStockLevel — Prisma raw filter
      },
      include: {
        category: { select: { id: true, name: true } },
        supplier: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            phone: true,
            email: true,
          },
        },
        branch: { select: { id: true, name: true } },
      },
      orderBy: [{ currentStock: "asc" }, { name: "asc" }],
    });

    // currentStock <= minStockLevel filtresi (Prisma'da doğrudan alan karşılaştırması desteklenmediği için JS'de filtrele)
    const criticalParts = parts.filter(
      (p) => p.currentStock <= p.minStockLevel
    );

    return {
      success: true,
      data: {
        parts: criticalParts.map((p) => ({
          id: p.id,
          name: p.name,
          partNumber: p.partNumber,
          currentStock: p.currentStock,
          minStockLevel: p.minStockLevel,
          deficit: p.minStockLevel - p.currentStock,
          purchasePrice: Number(p.purchasePrice.toString()),
          category: p.category,
          supplier: p.supplier,
          location: p.branch,
        })),
        summary: {
          totalCritical: criticalParts.length,
          outOfStock: criticalParts.filter((p) => p.currentStock === 0).length,
          belowMinimum: criticalParts.filter((p) => p.currentStock > 0).length,
        },
      },
    };
  } catch (err: any) {
    Sentry.captureException(err);
    return { error: "Kritik stok raporu alınamadı." };
  }
}
