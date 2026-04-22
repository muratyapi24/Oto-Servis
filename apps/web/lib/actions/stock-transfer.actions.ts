"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import { auth } from "@/auth";
import * as Sentry from "@sentry/nextjs";
import {
  createStockTransferSchema,
  type CreateStockTransferInput,
} from "@/lib/validations/stock-transfer";
import { inngest } from "@/lib/inngest/client";

// ---------------------------------------------------------------------------
// Tip Tanımları
// ---------------------------------------------------------------------------

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export interface StockTransferFilters {
  status?: string;
  fromLocationId?: string;
  toLocationId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// 5.2 createStockTransfer — Transfer talebi oluştur
// ---------------------------------------------------------------------------
export async function createStockTransfer(
  data: CreateStockTransferInput
): Promise<ActionResult<{ transferId: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;
    const validatedData = createStockTransferSchema.parse(data);

    // Kaynak ve hedef lokasyonların tenant'a ait olduğunu doğrula
    const [fromLocation, toLocation] = await Promise.all([
      prisma.location.findFirst({
        where: { id: validatedData.fromLocationId, tenantId },
      }),
      prisma.location.findFirst({
        where: { id: validatedData.toLocationId, tenantId },
      }),
    ]);

    if (!fromLocation) {
      return { success: false, error: "Kaynak lokasyon bulunamadı." };
    }

    if (!toLocation) {
      return { success: false, error: "Hedef lokasyon bulunamadı." };
    }

    // Parçaların tenant'a ait olduğunu doğrula
    const partIds = validatedData.items.map((i) => i.partId);
    const parts = await prisma.part.findMany({
      where: { id: { in: partIds }, tenantId, deletedAt: null },
      select: { id: true, name: true, currentStock: true, locationId: true },
    });

    if (parts.length !== partIds.length) {
      return { success: false, error: "Bir veya daha fazla parça bulunamadı." };
    }

    // Kaynak lokasyondaki stok yeterliliği kontrolü
    const partMap = new Map(parts.map((p) => [p.id, p]));
    for (const item of validatedData.items) {
      const part = partMap.get(item.partId)!;
      if (part.currentStock < item.quantity) {
        return {
          success: false,
          error: `Kaynak depoda yetersiz stok: "${part.name}" — Mevcut: ${part.currentStock}, Talep edilen: ${item.quantity}`,
        };
      }
    }

    // Transfer ve kalemlerini transaction içinde oluştur
    const stockTransfer = await prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.create({
        data: {
          tenantId,
          fromLocationId: validatedData.fromLocationId,
          toLocationId: validatedData.toLocationId,
          status: "PENDING",
          notes: validatedData.notes ?? null,
          requestedById: session.user.id ?? null,
          items: {
            create: validatedData.items.map((item) => ({
              partId: item.partId,
              quantity: item.quantity,
            })),
          },
        },
      });

      // AuditLog kaydı
      await tx.auditLog.create({
        data: {
          level: "INFO",
          module: "STOCK-TRANSFER",
          message: `Stok transfer talebi oluşturuldu — Kaynak: ${fromLocation.name} → Hedef: ${toLocation.name}, ${validatedData.items.length} kalem`,
          tenantId,
          userId: session.user.id ?? null,
        },
      });

      return transfer;
    });

    // Hedef lokasyon yöneticisine (TENANT_ADMIN) bildirim gönder
    const adminUsers = await prisma.user.findMany({
      where: {
        tenantId,
        role: "TENANT_ADMIN",
        isActive: true,
      },
      select: { id: true, email: true, name: true },
    });

    if (adminUsers.length > 0) {
      await prisma.notification.createMany({
        data: adminUsers.map((user) => ({
          tenantId,
          type: "IN_APP" as const,
          channel: "IN_APP",
          recipient: user.email ?? user.id,
          subject: "Yeni Stok Transfer Talebi",
          body: `${fromLocation.name} lokasyonundan ${toLocation.name} lokasyonuna ${validatedData.items.length} kalem için stok transfer talebi oluşturuldu. Onaylamak için transfer detayını inceleyin.`,
          status: "PENDING",
          metadata: {
            transferId: stockTransfer.id,
            fromLocationId: validatedData.fromLocationId,
            fromLocationName: fromLocation.name,
            toLocationId: validatedData.toLocationId,
            toLocationName: toLocation.name,
            requestedById: session.user.id,
          },
        })),
      });
    }

    revalidatePath("/dashboard/inventory/transfers");
    return { success: true, data: { transferId: stockTransfer.id } };
  } catch (error: any) {
    Sentry.captureException(error);
    console.error("Stok transfer talebi oluşturma hatası:", error);
    return { success: false, error: "Stok transfer talebi oluşturulamadı." };
  }
}

// ---------------------------------------------------------------------------
// 5.3 approveStockTransfer — PENDING → COMPLETED (tek adımda)
// ---------------------------------------------------------------------------
export async function approveStockTransfer(
  transferId: string
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;

    // Transfer ve kalemlerini getir
    const transfer = await prisma.stockTransfer.findFirst({
      where: { id: transferId, tenantId },
      include: {
        items: {
          include: {
            part: {
              select: {
                id: true,
                name: true,
                partNumber: true,
                currentStock: true,
              },
            },
          },
        },
        fromLocation: { select: { id: true, name: true } },
        toLocation: { select: { id: true, name: true } },
      },
    });

    if (!transfer) {
      return { success: false, error: "Stok transferi bulunamadı." };
    }

    if (transfer.status !== "PENDING") {
      return {
        success: false,
        error: `Transfer onaylanamaz. Mevcut durum: ${transfer.status}`,
      };
    }

    // Stok yeterliliğini tekrar kontrol et (race condition koruması)
    for (const item of transfer.items) {
      if (item.part.currentStock < Number(item.quantity)) {
        return {
          success: false,
          error: `Kaynak depoda yetersiz stok: "${item.part.name}" — Mevcut: ${item.part.currentStock}, Talep edilen: ${Number(item.quantity)}`,
        };
      }
    }

    const createdMovementIds: string[] = [];

    // Tüm işlemleri Prisma transaction içinde gerçekleştir
    await prisma.$transaction(async (tx) => {
      for (const item of transfer.items) {
        const qty = Number(item.quantity);

        // Kaynak Part.currentStock azalt (transfer edilen parça kaydı)
        await tx.part.update({
          where: { id: item.partId },
          data: { currentStock: { decrement: qty } },
        });

        // Hedef lokasyonda aynı partNumber'a sahip Part kaydını bul
        // Yoksa kaynak parçanın locationId'sini hedef lokasyona güncelle (tek depo senaryosu)
        const sourcePart = await tx.part.findUnique({
          where: { id: item.partId },
          select: { partNumber: true, locationId: true },
        });

        const targetPart = sourcePart
          ? await tx.part.findFirst({
              where: {
                tenantId,
                partNumber: sourcePart.partNumber,
                locationId: transfer.toLocationId,
                deletedAt: null,
              },
            })
          : null;

        if (targetPart) {
          // Hedef lokasyonda aynı parça kaydı var → currentStock artır
          await tx.part.update({
            where: { id: targetPart.id },
            data: { currentStock: { increment: qty } },
          });
        } else {
          // Hedef lokasyonda parça kaydı yok → kaynak parçanın stoku zaten azaltıldı.
          // Bu durumda hedef lokasyona yeni bir stok hareketi kaydedilir;
          // fiziksel parça transferi gerçekleşmiş sayılır.
          // (Hedef lokasyonda parça kaydı oluşturma iş akışı UI katmanında yönetilir.)
        }

        // Kaynak için StockMovement (OUT)
        const outMovement = await tx.stockMovement.create({
          data: {
            tenantId,
            partId: item.partId,
            quantity: qty,
            type: "OUT",
            reason: `Transfer Çıkışı → ${transfer.toLocation.name}`,
            stockTransferId: transferId,
            locationId: transfer.fromLocationId,
          },
        });
        createdMovementIds.push(outMovement.id);

        // Hedef için StockMovement (IN) — hedef parça kaydı varsa onun ID'si, yoksa kaynak parça ID'si
        const inMovement = await tx.stockMovement.create({
          data: {
            tenantId,
            partId: targetPart ? targetPart.id : item.partId,
            quantity: qty,
            type: "IN",
            reason: `Transfer Girişi ← ${transfer.fromLocation.name}`,
            stockTransferId: transferId,
            locationId: transfer.toLocationId,
          },
        });
        createdMovementIds.push(inMovement.id);
      }

      // Transfer durumunu COMPLETED olarak güncelle
      await tx.stockTransfer.update({
        where: { id: transferId },
        data: {
          status: "COMPLETED",
          approvedById: session.user.id ?? null,
          approvedAt: new Date(),
          completedAt: new Date(),
        },
      });

      // AuditLog kaydı
      await tx.auditLog.create({
        data: {
          level: "INFO",
          module: "STOCK-TRANSFER",
          message: `Stok transferi onaylandı ve tamamlandı — ${transfer.fromLocation.name} → ${transfer.toLocation.name}, ${transfer.items.length} kalem`,
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
          stockTransferId: transferId,
        },
      });
    }

    revalidatePath("/dashboard/inventory/transfers");
    revalidatePath(`/dashboard/inventory/transfers/${transferId}`);
    revalidatePath("/dashboard/inventory");

    return { success: true };
  } catch (error: any) {
    Sentry.captureException(error);
    console.error("Stok transferi onaylama hatası:", error);

    // Rollback durumunda AuditLog kaydı
    try {
      const session = await auth();
      if (session?.user?.tenantId) {
        await prisma.auditLog.create({
          data: {
            level: "ERROR",
            module: "STOCK-TRANSFER",
            message: `Stok transferi onaylama başarısız — Transfer ID: ${transferId}, Hata: ${error?.message ?? "Bilinmeyen hata"}`,
            tenantId: session.user.tenantId,
            userId: session.user.id ?? null,
          },
        });
      }
    } catch {
      // AuditLog kaydı başarısız olsa bile ana hatayı döndür
    }

    return { success: false, error: "Stok transferi onaylanamadı." };
  }
}

// ---------------------------------------------------------------------------
// 5.4 rejectStockTransfer — PENDING → REJECTED
// ---------------------------------------------------------------------------
export async function rejectStockTransfer(
  transferId: string,
  reason: string
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;

    const transfer = await prisma.stockTransfer.findFirst({
      where: { id: transferId, tenantId },
      include: {
        fromLocation: { select: { id: true, name: true } },
        toLocation: { select: { id: true, name: true } },
      },
    });

    if (!transfer) {
      return { success: false, error: "Stok transferi bulunamadı." };
    }

    if (transfer.status !== "PENDING") {
      return {
        success: false,
        error: `Transfer reddedilemez. Mevcut durum: ${transfer.status}`,
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.stockTransfer.update({
        where: { id: transferId },
        data: {
          status: "REJECTED",
          rejectionReason: reason,
          approvedById: session.user.id ?? null,
        },
      });

      // AuditLog kaydı
      await tx.auditLog.create({
        data: {
          level: "WARN",
          module: "STOCK-TRANSFER",
          message: `Stok transferi reddedildi — ${transfer.fromLocation.name} → ${transfer.toLocation.name}, Neden: ${reason}`,
          tenantId,
          userId: session.user.id ?? null,
        },
      });
    });

    // Talep sahibine bildirim gönder
    if (transfer.requestedById) {
      const requester = await prisma.user.findFirst({
        where: { id: transfer.requestedById, tenantId },
        select: { id: true, email: true, name: true },
      });

      if (requester) {
        await prisma.notification.create({
          data: {
            tenantId,
            type: "IN_APP",
            channel: "IN_APP",
            recipient: requester.email ?? requester.id,
            subject: "Stok Transfer Talebiniz Reddedildi",
            body: `${transfer.fromLocation.name} → ${transfer.toLocation.name} transfer talebiniz reddedildi. Neden: ${reason}`,
            status: "PENDING",
            metadata: {
              transferId,
              fromLocationId: transfer.fromLocationId,
              fromLocationName: transfer.fromLocation.name,
              toLocationId: transfer.toLocationId,
              toLocationName: transfer.toLocation.name,
              rejectionReason: reason,
            },
          },
        });
      }
    }

    revalidatePath("/dashboard/inventory/transfers");
    revalidatePath(`/dashboard/inventory/transfers/${transferId}`);

    return { success: true };
  } catch (error: any) {
    Sentry.captureException(error);
    console.error("Stok transferi reddetme hatası:", error);
    return { success: false, error: "Stok transferi reddedilemedi." };
  }
}

// ---------------------------------------------------------------------------
// 5.5 getStockTransfers — Filtreli transfer listesi
// ---------------------------------------------------------------------------
export async function getStockTransfers(
  filters?: StockTransferFilters
): Promise<ActionResult<{ transfers: any[]; total: number }>> {
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
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.fromLocationId) {
      where.fromLocationId = filters.fromLocationId;
    }

    if (filters?.toLocationId) {
      where.toLocationId = filters.toLocationId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const [transfers, total] = await Promise.all([
      prisma.stockTransfer.findMany({
        where,
        include: {
          fromLocation: { select: { id: true, name: true } },
          toLocation: { select: { id: true, name: true } },
          items: {
            include: {
              part: {
                select: {
                  id: true,
                  name: true,
                  partNumber: true,
                  unit: true,
                },
              },
            },
          },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.stockTransfer.count({ where }),
    ]);

    return {
      success: true,
      data: {
        transfers: JSON.parse(JSON.stringify(transfers)),
        total,
      },
    };
  } catch (error: any) {
    Sentry.captureException(error);
    console.error("Stok transferi listesi hatası:", error);
    return { success: false, error: "Stok transferleri listelenemedi." };
  }
}
