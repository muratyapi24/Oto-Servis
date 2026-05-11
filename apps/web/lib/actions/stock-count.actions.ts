"use server";

import { guardTenant } from "@/lib/guards";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import * as Sentry from "@sentry/nextjs";
import {
  createStockCountSchema,
  updateStockCountItemSchema,
  type CreateStockCountInput,
} from "@/lib/validations/stock-count";
import { inngest } from "@/lib/inngest/client";

// ---------------------------------------------------------------------------
// Tip Tanımları
// ---------------------------------------------------------------------------

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export interface StockCountFilters {
  status?: string;
  locationId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// 4.2 createStockCount — Yeni sayım oturumu başlat
// ---------------------------------------------------------------------------
export async function createStockCount(
  data: CreateStockCountInput
): Promise<ActionResult<{ countId: string }>> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId, session } = g;

    const validatedData = createStockCountSchema.parse(data);

    // Aynı lokasyonda açık (DRAFT veya IN_PROGRESS) sayım var mı kontrol et
    const existingCount = await prisma.stockCount.findFirst({
      where: {
        tenantId,
        locationId: validatedData.locationId ?? null,
        status: { in: ["DRAFT", "IN_PROGRESS"] },
      },
    });

    if (existingCount) {
      return {
        success: false,
        error:
          "Bu lokasyonda zaten açık bir stok sayımı bulunmaktadır. Lütfen önce mevcut sayımı tamamlayın veya iptal edin.",
      };
    }

    // Lokasyon tenant'a ait mi kontrol et
    if (validatedData.locationId) {
      const location = await prisma.location.findFirst({
        where: { id: validatedData.locationId, tenantId },
      });
      if (!location) {
        return { success: false, error: "Lokasyon bulunamadı." };
      }
    }

    // Lokasyon ve kategori filtrelerine göre aktif parçaları bul
    const partWhere: any = {
      tenantId,
      isActive: true,
      deletedAt: null,
    };

    if (validatedData.locationId) {
      partWhere.locationId = validatedData.locationId;
    }

    if (validatedData.categoryIds && validatedData.categoryIds.length > 0) {
      partWhere.categoryId = { in: validatedData.categoryIds };
    }

    const parts = await prisma.part.findMany({
      where: partWhere,
      select: { id: true, currentStock: true },
    });

    if (parts.length === 0) {
      return {
        success: false,
        error:
          "Seçilen filtrelerle eşleşen aktif parça bulunamadı. Lütfen filtrelerinizi genişletin.",
      };
    }

    // Sayım ve kalemlerini transaction içinde oluştur
    const stockCount = await prisma.$transaction(async (tx) => {
      const count = await tx.stockCount.create({
        data: {
          tenantId,
          locationId: validatedData.locationId ?? null,
          status: "DRAFT",
          notes: validatedData.notes ?? null,
          createdById: session.user.id ?? null,
          items: {
            create: parts.map((part) => ({
              partId: part.id,
              systemQuantity: part.currentStock, // Anlık snapshot
              actualQuantity: null,
              difference: null,
            })),
          },
        },
      });

      // AuditLog kaydı
      await tx.auditLog.create({
        data: {
          level: "INFO",
          module: "STOCK-COUNT",
          message: `Stok sayımı başlatıldı — ${parts.length} parça, Lokasyon: ${validatedData.locationId ?? "Tümü"}`,
          tenantId,
          userId: session.user.id ?? null,
        },
      });

      return count;
    });

    revalidatePath("/dashboard/inventory/stock-counts");
    return { success: true, data: { countId: stockCount.id } };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Stok sayımı oluşturma hatası:", error);
    return { success: false, error: "Stok sayımı oluşturulamadı." };
  }
}

// ---------------------------------------------------------------------------
// 4.3 updateStockCountItem — Fiili miktar güncelle, difference hesapla
// ---------------------------------------------------------------------------
export async function updateStockCountItem(
  countId: string,
  partId: string,
  actualQuantity: number
): Promise<ActionResult> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


    // Validasyon
    const validatedData = updateStockCountItemSchema.parse({ actualQuantity });

    // Sayımın tenant'a ait ve düzenlenebilir durumda olduğunu doğrula
    const stockCount = await prisma.stockCount.findFirst({
      where: { id: countId, tenantId },
    });

    if (!stockCount) {
      return { success: false, error: "Stok sayımı bulunamadı." };
    }

    if (stockCount.status === "COMPLETED") {
      return {
        success: false,
        error: "Tamamlanmış sayım kalemleri güncellenemez.",
      };
    }

    // Sayım kalemini bul
    const countItem = await prisma.stockCountItem.findFirst({
      where: { stockCountId: countId, partId },
    });

    if (!countItem) {
      return { success: false, error: "Sayım kalemi bulunamadı." };
    }

    // difference = actualQuantity - systemQuantity
    const difference = validatedData.actualQuantity - countItem.systemQuantity;

    await prisma.$transaction(async (tx) => {
      await tx.stockCountItem.update({
        where: { id: countItem.id },
        data: {
          actualQuantity: validatedData.actualQuantity,
          difference,
        },
      });

      // Sayım durumunu IN_PROGRESS'e güncelle (ilk güncelleme ise)
      if (stockCount.status === "DRAFT") {
        await tx.stockCount.update({
          where: { id: countId },
          data: { status: "IN_PROGRESS" },
        });
      }
    });

    revalidatePath(`/dashboard/inventory/stock-counts/${countId}`);
    return { success: true };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Sayım kalemi güncelleme hatası:", error);
    return { success: false, error: "Sayım kalemi güncellenemedi." };
  }
}

// ---------------------------------------------------------------------------
// 4.4 approveStockCount — DRAFT/IN_PROGRESS → COMPLETED
// ---------------------------------------------------------------------------
export async function approveStockCount(
  countId: string
): Promise<ActionResult<{ adjustments: number }>> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId, session } = g;


    // Sayımı ve kalemlerini getir
    const stockCount = await prisma.stockCount.findFirst({
      where: { id: countId, tenantId },
      include: {
        items: {
          include: {
            part: { select: { id: true, name: true, partNumber: true, currentStock: true } },
          },
        },
        location: { select: { id: true, name: true } },
      },
    });

    if (!stockCount) {
      return { success: false, error: "Stok sayımı bulunamadı." };
    }

    if (stockCount.status === "COMPLETED") {
      return {
        success: false,
        error: "Bu sayım zaten tamamlanmış.",
      };
    }

    // Fiili miktar girilmemiş kalem var mı kontrol et
    const unfilledItems = stockCount.items.filter(
      (item) => item.actualQuantity === null || item.actualQuantity === undefined
    );

    if (unfilledItems.length > 0) {
      return {
        success: false,
        error: `${unfilledItems.length} kalem için fiili miktar girilmemiş. Lütfen tüm kalemleri doldurun veya eksik kalemleri 0 olarak işaretleyin.`,
      };
    }

    // Fark olan kalemleri belirle
    const itemsWithDifference = stockCount.items.filter(
      (item) => item.difference !== null && item.difference !== 0
    );

    const createdMovementIds: string[] = [];

    // Transaction içinde tüm işlemleri gerçekleştir
    await prisma.$transaction(async (tx) => {
      // Fark olan her parça için ADJUST StockMovement oluştur ve currentStock güncelle
      for (const item of itemsWithDifference) {
        const actualQty = item.actualQuantity!;
        const diff = item.difference!;

        // Part.currentStock = actualQuantity olarak güncelle
        await tx.part.update({
          where: { id: item.partId },
          data: { currentStock: actualQty },
        });

        // ADJUST StockMovement oluştur
        const movement = await tx.stockMovement.create({
          data: {
            tenantId,
            partId: item.partId,
            quantity: Math.abs(diff), // Mutlak değer
            type: "ADJUST",
            reason: `Stok Sayımı Düzeltmesi — Fark: ${diff > 0 ? "+" : ""}${diff}`,
            stockCountId: countId,
            locationId: stockCount.locationId ?? null,
          },
        });

        createdMovementIds.push(movement.id);
      }

      // Sayımı COMPLETED olarak işaretle
      await tx.stockCount.update({
        where: { id: countId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      // AuditLog kaydı
      await tx.auditLog.create({
        data: {
          level: "INFO",
          module: "STOCK-COUNT",
          message: `Stok sayımı onaylandı — ${itemsWithDifference.length} düzeltme yapıldı, Lokasyon: ${stockCount.location?.name ?? "Tümü"}`,
          tenantId,
          userId: session.user.id ?? null,
        },
      });
    });

    // Her StockMovement için Inngest event tetikle (transaction dışında)
    for (const movementId of createdMovementIds) {
      await inngest.send({
        name: "stock/movement.created",
        data: {
          movementId,
          tenantId,
          stockCountId: countId,
        },
      });
    }

    revalidatePath("/dashboard/inventory/stock-counts");
    revalidatePath(`/dashboard/inventory/stock-counts/${countId}`);
    revalidatePath("/dashboard/inventory");

    return {
      success: true,
      data: { adjustments: itemsWithDifference.length },
    };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Stok sayımı onaylama hatası:", error);
    return { success: false, error: "Stok sayımı onaylanamadı." };
  }
}

// ---------------------------------------------------------------------------
// 4.5 getStockCounts — Filtreli sayım listesi
// ---------------------------------------------------------------------------
export async function getStockCounts(
  filters?: StockCountFilters
): Promise<ActionResult<{ counts: any[]; total: number }>> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = {
      tenantId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.locationId) {
      where.locationId = filters.locationId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const [counts, total] = await Promise.all([
      prisma.stockCount.findMany({
        where,
        include: {
          location: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.stockCount.count({ where }),
    ]);

    return {
      success: true,
      data: {
        counts: JSON.parse(JSON.stringify(counts)),
        total,
      },
    };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Stok sayımı listesi hatası:", error);
    return { success: false, error: "Stok sayımları listelenemedi." };
  }
}

// ---------------------------------------------------------------------------
// 4.6 getStockCountDetail — Sayım detayı + fark raporu
// ---------------------------------------------------------------------------
export async function getStockCountDetail(
  countId: string
): Promise<ActionResult<{ count: any; summary: any }>> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


    const count = await prisma.stockCount.findFirst({
      where: { id: countId, tenantId },
      include: {
        location: { select: { id: true, name: true } },
        items: {
          include: {
            part: {
              select: {
                id: true,
                name: true,
                partNumber: true,
                unit: true,
                purchasePrice: true,
                category: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        stockMovements: {
          include: {
            part: { select: { id: true, name: true, partNumber: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!count) {
      return { success: false, error: "Stok sayımı bulunamadı." };
    }

    // Fark raporu özeti hesapla
    const totalItems = count.items.length;
    const countedItems = count.items.filter(
      (item) => item.actualQuantity !== null
    ).length;
    const itemsWithDifference = count.items.filter(
      (item) => item.difference !== null && item.difference !== 0
    );
    const itemsWithPositiveDiff = itemsWithDifference.filter(
      (item) => (item.difference ?? 0) > 0
    );
    const itemsWithNegativeDiff = itemsWithDifference.filter(
      (item) => (item.difference ?? 0) < 0
    );

    // Toplam fark değeri (satın alma fiyatı üzerinden)
    let totalDifferenceValue = 0;
    for (const item of itemsWithDifference) {
      const purchasePrice = Number(item.part.purchasePrice ?? 0);
      totalDifferenceValue += (item.difference ?? 0) * purchasePrice;
    }

    const summary = {
      totalItems,
      countedItems,
      uncountedItems: totalItems - countedItems,
      itemsWithDifference: itemsWithDifference.length,
      itemsWithPositiveDiff: itemsWithPositiveDiff.length,
      itemsWithNegativeDiff: itemsWithNegativeDiff.length,
      totalDifferenceValue: Math.round(totalDifferenceValue * 100) / 100,
      completionPercentage:
        totalItems > 0 ? Math.round((countedItems / totalItems) * 100) : 0,
    };

    return {
      success: true,
      data: {
        count: JSON.parse(JSON.stringify(count)),
        summary,
      },
    };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Stok sayımı detay hatası:", error);
    return { success: false, error: "Stok sayımı detayı alınamadı." };
  }
}
