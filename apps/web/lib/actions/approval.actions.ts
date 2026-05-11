"use server";

import { prisma } from "@repo/database";
import { randomBytes } from "crypto";

export async function generateApprovalToken(serviceOrderId: string): Promise<{ token?: string; error?: string }> {
  try {
    const token = randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 saat

    await prisma.serviceOrder.update({
      where: { id: serviceOrderId },
      data: { approvalToken: token, approvalTokenExpiry: expiry },
    });

    return { token };
  } catch (err) {
    console.error("generateApprovalToken hatası:", err);
    return { error: "Token üretilemedi." };
  }
}

export async function validateApprovalToken(token: string): Promise<{
  serviceOrder?: {
    id: string;
    orderNumber: number;
    status: string;
    complaintDescription: string;
    estimatedCost: number | null;
    totalAmount: number;
    vehicle: { plate: string; brand: string; model: string };
    customer: { firstName: string | null; lastName: string | null; companyName: string | null; type: string };
    items: { name: string; itemType: string; quantity: number; unitPrice: number; totalPrice: number }[];
  };
  error?: string;
}> {
  try {
    const order = await prisma.serviceOrder.findFirst({
      where: { approvalToken: token },
      include: {
        vehicle: { select: { plate: true, brand: true, model: true } },
        customer: { select: { firstName: true, lastName: true, companyName: true, type: true } },
        items: { select: { name: true, itemType: true, quantity: true, unitPrice: true, totalPrice: true } },
      },
    });

    if (!order) return { error: "Onay linki geçersiz veya süresi dolmuş" };

    if (order.approvalTokenExpiry && order.approvalTokenExpiry < new Date()) {
      return { error: "Onay linkinin süresi dolmuş. Lütfen servis ile iletişime geçin." };
    }

    return {
      serviceOrder: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        complaintDescription: order.complaintDescription,
        estimatedCost: order.estimatedCost ? Number(order.estimatedCost) : null,
        totalAmount: Number(order.totalAmount),
        vehicle: order.vehicle,
        customer: order.customer,
        items: order.items.map((i) => ({
          name: i.name,
          itemType: i.itemType,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.totalPrice),
        })),
      },
    };
  } catch (err) {
    console.error("validateApprovalToken hatası:", err);
    return { error: "Token doğrulanamadı." };
  }
}

export async function approveServiceOrder(token: string): Promise<{ success?: string; error?: string }> {
  try {
    const order = await prisma.serviceOrder.findFirst({ where: { approvalToken: token } });
    if (!order) return { error: "Geçersiz token" };
    if (order.approvalTokenExpiry && order.approvalTokenExpiry < new Date()) return { error: "Token süresi dolmuş" };
    if (order.status !== "WAITING_APPROVAL") return { error: "Bu servis emri zaten işleme alınmış" };

    await prisma.$transaction(async (tx) => {
      await tx.serviceOrder.update({
        where: { id: order.id },
        data: { status: "IN_PROGRESS", approvalToken: null, approvalTokenExpiry: null },
      });
      await tx.auditLog.create({
        data: {
          level: "INFO",
          module: "APPROVAL",
          message: `Servis emri #${order.orderNumber} müşteri tarafından onaylandı`,
          tenantId: order.tenantId,
        },
      });
    });

    return { success: "Servis emri onaylandı. Ekibimiz çalışmaya başlayacak." };
  } catch (err) {
    console.error("approveServiceOrder hatası:", err);
    return { error: "Onay işlemi gerçekleştirilemedi." };
  }
}

export async function rejectServiceOrder(token: string, reason: string): Promise<{ success?: string; error?: string }> {
  try {
    const order = await prisma.serviceOrder.findFirst({ where: { approvalToken: token } });
    if (!order) return { error: "Geçersiz token" };
    if (order.approvalTokenExpiry && order.approvalTokenExpiry < new Date()) return { error: "Token süresi dolmuş" };
    if (order.status !== "WAITING_APPROVAL") return { error: "Bu servis emri zaten işleme alınmış" };

    await prisma.$transaction(async (tx) => {
      await tx.serviceOrder.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          internalNotes: `Müşteri tarafından reddedildi. Neden: ${reason}`,
          approvalToken: null,
          approvalTokenExpiry: null,
        },
      });
      await tx.auditLog.create({
        data: {
          level: "INFO",
          module: "APPROVAL",
          message: `Servis emri #${order.orderNumber} müşteri tarafından reddedildi. Neden: ${reason}`,
          tenantId: order.tenantId,
        },
      });
    });

    return { success: "Servis emri reddedildi. Servis ekibimiz bilgilendirildi." };
  } catch (err) {
    console.error("rejectServiceOrder hatası:", err);
    return { error: "Red işlemi gerçekleştirilemedi." };
  }
}
