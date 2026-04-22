"use server";

import { prisma } from "@repo/database";
import { auth } from "@/auth";

/**
 * Müşterinin aktif servis emirleriyle ilişkili mesajları getirir
 * (Stitch "Mesajlaşma" sayfası için)
 */
export async function getMusteriMesajlari() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Oturum bulunamadı.", conversations: [] };
    }

    const customer = await prisma.customer.findFirst({
      where: { tenantId: (session.user as any).tenantId || undefined },
      orderBy: { createdAt: 'desc' }
    });

    if (!customer) {
      return { error: "Müşteri profili bulunamadı.", conversations: [] };
    }

    // Müşterinin aktif servis emirlerini bul
    const activeOrders = await prisma.serviceOrder.findMany({
      where: {
        customerId: customer.id,
        status: { in: ["PENDING", "IN_PROGRESS", "WAITING_APPROVAL"] }
      },
      include: {
        assignedMechanic: true,
        vehicle: { select: { plate: true, brand: true, model: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Her servis emri için mesajları getir
    const conversations = await Promise.all(
      activeOrders.map(async (order) => {
        const messages = await prisma.message.findMany({
          where: { serviceOrderId: order.id },
          orderBy: { createdAt: 'asc' }
        });

        const unreadCount = messages.filter(
          m => !m.isRead && m.senderType !== "CUSTOMER"
        ).length;

        return {
          serviceOrder: order,
          mechanic: order.assignedMechanic,
          vehicle: order.vehicle,
          messages,
          unreadCount,
          lastMessage: messages[messages.length - 1] || null
        };
      })
    );

    return { success: true, customer, conversations };
  } catch (error) {
    console.error("Mesajlar veri çekme hatası:", error);
    return { error: "Mesajlar yüklenirken hata oluştu.", conversations: [] };
  }
}

/**
 * Belirli bir servis emri konuşmasının mesajlarını getirir
 */
export async function getConversationMessages(serviceOrderId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Oturum bulunamadı." };
    }

    const messages = await prisma.message.findMany({
      where: { serviceOrderId },
      orderBy: { createdAt: 'asc' }
    });

    // Okunmamış mesajları okundu işaretle
    await prisma.message.updateMany({
      where: {
        serviceOrderId,
        senderType: { not: "CUSTOMER" },
        isRead: false
      },
      data: { isRead: true }
    });

    const order = await prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
      include: {
        assignedMechanic: true,
        vehicle: { select: { plate: true, brand: true, model: true } }
      }
    });

    return { success: true, messages, order };
  } catch (error) {
    console.error("Mesaj detay hatası:", error);
    return { error: "Mesajlar yüklenirken hata oluştu." };
  }
}

/**
 * Yeni mesaj gönderir
 */
export async function sendMusteriMesaj(serviceOrderId: string, content: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Oturum bulunamadı." };
    }

    const customer = await prisma.customer.findFirst({
      where: { tenantId: (session.user as any).tenantId || undefined },
      orderBy: { createdAt: 'desc' }
    });

    if (!customer) {
      return { error: "Müşteri profili bulunamadı." };
    }

    const order = await prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
      select: { tenantId: true }
    });

    if (!order) {
      return { error: "Servis kaydı bulunamadı." };
    }

    const message = await prisma.message.create({
      data: {
        tenantId: order.tenantId,
        serviceOrderId,
        customerId: customer.id,
        senderType: "CUSTOMER",
        senderName: `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Müşteri",
        content,
        messageType: "TEXT",
        isRead: false
      }
    });

    return { success: true, message };
  } catch (error) {
    console.error("Mesaj gönderme hatası:", error);
    return { error: "Mesaj gönderilemedi." };
  }
}
