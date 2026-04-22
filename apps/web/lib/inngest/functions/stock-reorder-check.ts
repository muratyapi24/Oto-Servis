import { inngest } from "../client";
import { prisma } from "@repo/database";
import { Redis } from "@upstash/redis";

// Upstash Redis client — debounce için doğrudan oluştur
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const REORDER_DEBOUNCE_TTL = 86400; // 24 saat (saniye)

export const stockReorderCheckFunction = inngest.createFunction(
  {
    id: "stock-reorder-check",
    name: "Stok Yeniden Sipariş Kontrolü",
    retries: 3,
    triggers: [{ event: "stock/movement.created" }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { tenantId, partId } = event.data as {
      tenantId: string;
      partId?: string;
      movementId?: string;
    };

    if (!partId) {
      return { skipped: true, reason: "partId eksik" };
    }

    // 1. Parçayı ve tedarikçi bilgisini çek
    const part = await step.run("fetch-part", async () => {
      return prisma.part.findFirst({
        where: {
          id: partId,
          tenantId,
          deletedAt: null,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          partNumber: true,
          currentStock: true,
          minStockLevel: true,
          tenantId: true,
          supplierId: true,
          purchasePrice: true,
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    if (!part) {
      return { skipped: true, reason: "Parça bulunamadı" };
    }

    // 2. Stok seviyesi kontrolü: minStockLevel > 0 ve currentStock <= minStockLevel
    if (part.minStockLevel <= 0 || part.currentStock > part.minStockLevel) {
      return {
        skipped: true,
        reason: "Stok seviyesi kritik değil veya minStockLevel tanımlı değil",
        currentStock: part.currentStock,
        minStockLevel: part.minStockLevel,
      };
    }

    // 3. Redis debounce kontrolü — 24 saat içinde uyarı gönderildi mi?
    const debounceKey = `reorder:alert:${tenantId}:${partId}`;

    const alreadyAlerted = await step.run("check-debounce", async () => {
      try {
        const existing = await redis.get(debounceKey);
        return existing !== null;
      } catch {
        // Redis erişim hatası — debounce'u atla, bildirimi gönder
        return false;
      }
    });

    if (alreadyAlerted) {
      return {
        skipped: true,
        reason: "24 saat içinde zaten uyarı gönderildi (debounce)",
        partId,
        tenantId,
      };
    }

    // 4. TENANT_ADMIN ve ACCOUNTANT rollerine sahip kullanıcıları bul
    const targetUsers = await step.run("fetch-target-users", async () => {
      return prisma.user.findMany({
        where: {
          tenantId,
          role: { in: ["TENANT_ADMIN", "ACCOUNTANT"] },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
    });

    // 5. Bildirim oluştur + Redis debounce anahtarını set et
    const notificationBody = `"${part.name}" (${part.partNumber}) parçasının stok seviyesi kritik: Mevcut ${part.currentStock} adet, minimum seviye ${part.minStockLevel} adet. Lütfen sipariş veriniz.`;

    const notificationsCreated = await step.run(
      "create-notifications-and-set-debounce",
      async () => {
        const notificationData = (
          targetUsers as Array<{
            id: string;
            name: string | null;
            email: string | null;
            role: string;
          }>
        ).map((user) => ({
          tenantId,
          type: "IN_APP" as const,
          channel: "IN_APP",
          recipient: user.email ?? user.id,
          subject: `⚠️ Kritik Stok Uyarısı: ${part.name}`,
          body: notificationBody,
          status: "PENDING" as const,
          metadata: {
            partId: part.id,
            partNumber: part.partNumber,
            currentStock: part.currentStock,
            minStockLevel: part.minStockLevel,
            userId: user.id,
            userRole: user.role,
          },
        }));

        if (notificationData.length > 0) {
          await prisma.notification.createMany({
            data: notificationData,
          });
        }

        // Redis debounce anahtarını set et (TTL: 24 saat)
        try {
          await redis.setex(debounceKey, REORDER_DEBOUNCE_TTL, "1");
        } catch {
          // Redis yazma hatası — kritik değil, devam et
        }

        return notificationData.length;
      }
    );

    // 6. Tedarikçi bağlıysa taslak PurchaseOrder önerisi oluştur
    let purchaseOrderId: string | null = null;

    if (part.supplierId) {
      purchaseOrderId = await step.run("create-draft-purchase-order", async () => {
        const neededQuantity = part.minStockLevel - part.currentStock;

        // PO numarası oluştur
        const poCount = await prisma.purchaseOrder.count({
          where: { tenantId },
        });
        const poNumber = `PO-AUTO-${new Date().getFullYear()}-${String(poCount + 1).padStart(4, "0")}`;

        const purchaseOrder = await prisma.purchaseOrder.create({
          data: {
            tenantId,
            poNumber,
            supplierId: part.supplierId!,
            status: "DRAFT",
            notes: `Otomatik oluşturuldu: "${part.name}" parçası kritik stok seviyesine düştü. Mevcut: ${part.currentStock}, Min: ${part.minStockLevel}`,
            subTotal: Number(part.purchasePrice) * neededQuantity,
            taxAmount: Number(part.purchasePrice) * neededQuantity * 0.2,
            totalAmount: Number(part.purchasePrice) * neededQuantity * 1.2,
            items: {
              create: {
                partId: part.id,
                quantity: neededQuantity,
                unitPrice: part.purchasePrice,
                taxRate: 20,
                receivedQuantity: 0,
              },
            },
          },
          select: { id: true },
        });

        return purchaseOrder.id;
      });
    }

    return {
      success: true,
      partId: part.id,
      partName: part.name,
      tenantId,
      currentStock: part.currentStock,
      minStockLevel: part.minStockLevel,
      notificationsCreated,
      purchaseOrderCreated: purchaseOrderId !== null,
      purchaseOrderId,
    };
  }
);

/**
 * Hata durumunda AuditLog kaydı oluşturan yardımcı fonksiyon.
 * Inngest retry mekanizması devreye girmeden önce hata loglanır.
 */
export async function logReorderCheckError(
  error: unknown,
  tenantId: string,
  partId: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        level: "ERROR",
        module: "STOCK-REORDER",
        message: `Stok reorder kontrolü başarısız: partId=${partId}, tenantId=${tenantId}. Hata: ${
          error instanceof Error ? error.message : String(error)
        }`,
        tenantId,
        traceId: `reorder-${partId}-${Date.now()}`,
      },
    });
  } catch {
    // AuditLog yazma hatası — sessizce geç
  }
}
