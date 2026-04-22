"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import { auth } from "@/auth";
import { invalidateCache, CacheKeys } from "@/lib/cache";
import { publishSSEEvent } from "@/lib/sse";
import { sendPushToTenant } from "@/lib/push";
import { 
  CreateServiceOrderInput, 
  createServiceOrderSchema,
  UpdateOrderStatusInput,
  updateOrderStatusSchema,
  AddServiceItemInput,
  addServiceItemSchema
} from "@/lib/validations/services";

// ----------------------------------------------------------------------------
// 1) İŞ EMRİ OLUŞTURMA & LİSTELEME
// ----------------------------------------------------------------------------

export async function createServiceOrder(data: CreateServiceOrderInput) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { error: "Yetkisiz erişim." };
    }

    const validatedData = createServiceOrderSchema.parse(data);

    const newOrder = await prisma.serviceOrder.create({
      data: {
        tenantId: session.user.tenantId,
        customerId: validatedData.customerId,
        vehicleId: validatedData.vehicleId,
        complaintDescription: validatedData.complaintDescription,
        inspectionNotes: validatedData.inspectionNotes || null,
        internalNotes: validatedData.internalNotes || null,
        assignedMechanicId: validatedData.assignedMechanicId || null,
        estimatedCost: validatedData.estimatedCost || null,
      },
    });

    revalidatePath("/dashboard/services");
    return { success: "Servis İş Emri başarıyla oluşturuldu", serviceOrderId: newOrder.id };
  } catch (error: any) {
    Sentry.captureException(error);
    console.error("İş Emri kaydı hatası:", error);
    return { error: "İş Emri kaydedilirken bir hata oluştu." };
  }
}

export async function deleteServiceOrder(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

    await prisma.serviceOrder.update({
      where: { id, tenantId: session.user.tenantId },
      data: { deletedAt: new Date() }
    });

    revalidatePath("/dashboard/services");
    return { success: "İş Emri başarıyla silindi." };
  } catch (err) {
    Sentry.captureException(err);
    console.error("İş emri silinemedi:", err);
    return { error: "Silme işlemi sırasında hata oluştu." };
  }
}

export async function getServiceOrders() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error("Yetkisiz erişim");

    const orders = await prisma.serviceOrder.findMany({
      where: {
        tenantId: session.user.tenantId,
        deletedAt: null,
      },
      include: {
        customer: { select: { id: true, type: true, firstName: true, lastName: true, companyName: true, phone: true } },
        vehicle: { select: { id: true, plate: true, brand: true, model: true } },
        assignedMechanic: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimals for Next.js Client
    const serializedOrders = orders.map(o => ({
      ...o,
      subTotal: Number(o.subTotal.toString()),
      discountAmount: Number(o.discountAmount.toString()),
      taxAmount: Number(o.taxAmount.toString()),
      totalAmount: Number(o.totalAmount.toString()),
      estimatedCost: o.estimatedCost ? Number(o.estimatedCost.toString()) : null,
      customerName: o.customer.type === "CORPORATE" ? o.customer.companyName : `${o.customer.firstName} ${o.customer.lastName}`,
    }));

    return { orders: serializedOrders };
  } catch (error: any) {
    Sentry.captureException(error);
    console.error("Servis işlemleri getirilemedi:", error);
    return { error: "İş Emirleri yüklenemedi." };
  }
}

/**
 * Consolidated dashboard data for the Services Kanban page.
 * Follows the same pattern as getVehicleDashboard().
 */
export async function getServiceDashboard() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

    const tenantId = session.user.tenantId;

    const [orders, allCustomers, allVehicles, dbMechs] = await Promise.all([
      prisma.serviceOrder.findMany({
        where: { tenantId, deletedAt: null },
        include: {
          customer: { select: { id: true, type: true, firstName: true, lastName: true, companyName: true, phone: true } },
          vehicle: { select: { id: true, plate: true, brand: true, model: true } },
          assignedMechanic: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { items: true } }
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true, type: true, firstName: true, lastName: true, companyName: true },
      }),
      prisma.vehicle.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true, plate: true, customerId: true },
      }),
      prisma.mechanic.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true, firstName: true, lastName: true },
      }),
    ]);

    // Serialize orders
    const serializedOrders = orders.map(o => ({
      ...o,
      subTotal: Number(o.subTotal.toString()),
      discountAmount: Number(o.discountAmount.toString()),
      taxAmount: Number(o.taxAmount.toString()),
      totalAmount: Number(o.totalAmount.toString()),
      estimatedCost: o.estimatedCost ? Number(o.estimatedCost.toString()) : null,
      customerName: o.customer.type === "CORPORATE"
        ? o.customer.companyName
        : `${o.customer.firstName} ${o.customer.lastName}`,
    }));

    // Map lookup lists
    const customers = allCustomers.map(c => ({
      id: c.id,
      name: c.type === "INDIVIDUAL"
        ? `${c.firstName} ${c.lastName}`
        : (c.companyName || "Bilinmiyor"),
    }));

    const vehicles = allVehicles.map(v => ({
      id: v.id,
      plate: v.plate,
      customerId: v.customerId,
    }));

    const mechanics = dbMechs.map(m => ({
      id: m.id,
      name: `${m.firstName} ${m.lastName}`,
    }));

    return { orders: serializedOrders, customers, vehicles, mechanics };
  } catch (error: any) {
    Sentry.captureException(error);
    console.error("Servis Dashboard verileri yüklenemedi:", error);
    return { error: "Servis verileri yüklenirken bir sorun oluştu." };
  }
}

export async function getServiceOrderById(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error("Yetkisiz erişim");

    const order = await prisma.serviceOrder.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        customer: true,
        vehicle: true,
        assignedMechanic: true,
        items: {
          include: {
            part: true,
            mechanic: true
          },
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!order) return { error: "İş emri bulunamadı." };

    // Deep serialization
    const mappedItems = order.items.map(i => ({
      ...i,
      quantity: Number(i.quantity.toString()),
      unitPrice: Number(i.unitPrice.toString()),
      taxRate: Number(i.taxRate.toString()),
      discount: Number(i.discount.toString()),
      subTotal: Number(i.subTotal.toString()),
      taxAmount: Number(i.taxAmount.toString()),
      totalPrice: Number(i.totalPrice.toString()),
    }));

    const serializedOrder = {
      ...order,
      subTotal: Number(order.subTotal.toString()),
      discountAmount: Number(order.discountAmount.toString()),
      taxAmount: Number(order.taxAmount.toString()),
      totalAmount: Number(order.totalAmount.toString()),
      estimatedCost: order.estimatedCost ? Number(order.estimatedCost.toString()) : null,
      items: mappedItems
    };

    return { order: serializedOrder };
  } catch(error) {
    Sentry.captureException(error);
    console.error("Detay hatası:", error);
    return { error: "İş emri detayları yüklenemedi." };
  }
}

// ----------------------------------------------------------------------------
// 2) DURUM VE KALEM YÖNETİMİ
// ----------------------------------------------------------------------------

export async function updateOrderStatus(data: UpdateOrderStatusInput) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };
    
    // Authorization check
    const existing = await prisma.serviceOrder.findFirst({
      where: { id: data.orderId, tenantId: session.user.tenantId }
    });
    if(!existing) return { error: "Emir bulunamadı" };

    const val = updateOrderStatusSchema.parse(data);

    await prisma.$transaction(async (tx) => {
      const orderToUpdate = await tx.serviceOrder.findUnique({
        where: { id: val.orderId },
        include: {
          items: { where: { itemType: "PART" } }
        }
      });
      if (!orderToUpdate) throw new Error("Emir bulunamadı");

      // DURUM 1: COMPLETED → CANCELLED (Geri alma / İade mantığı)
      if (orderToUpdate.status === "COMPLETED" && val.status === "CANCELLED") {
        // 1a. Aktif faturayı iptal et ve müşteri borcunu geri al
        const invoice = await tx.invoice.findFirst({
          where: { serviceOrderId: val.orderId, status: { not: "CANCELLED" } }
        });

        if (invoice) {
          await tx.customer.update({
            where: { id: orderToUpdate.customerId },
            data: { balance: { decrement: invoice.totalAmount } }
          });
          await tx.invoice.update({
            where: { id: invoice.id },
            data: { status: "CANCELLED" }
          });
        }

        // 1b. PART kalemlerinin stoklarını iade et
        for (const item of orderToUpdate.items) {
          if (!item.partId) continue;

          await tx.part.update({
            where: { id: item.partId },
            data: { currentStock: { increment: Number(item.quantity) } }
          });

          await tx.stockMovement.create({
            data: {
              tenantId: session.user.tenantId,
              partId: item.partId,
              quantity: Number(item.quantity),
              type: "IN",
              reason: `İş Emri #${orderToUpdate.orderNumber} iptal edildi - ${item.name} iade`,
              serviceOrderId: val.orderId,
              serviceItemId: item.id,
            }
          });
        }
      }

      // DURUM 2: Herhangi bir statü → COMPLETED (Fatura / Borçlandırma)
      if (val.status === "COMPLETED" && orderToUpdate.status !== "COMPLETED") {
        const existingInvoice = await tx.invoice.findFirst({
          where: { serviceOrderId: val.orderId, status: { not: "CANCELLED" } }
        });

        if (!existingInvoice && Number(orderToUpdate.totalAmount) > 0) {
          // Tüm servis kalemlerini fatura satırına dönüştür
          const allItems = await tx.serviceItem.findMany({
            where: { serviceOrderId: val.orderId }
          });

          const newInvoice = await tx.invoice.create({
            data: {
              tenantId: session.user.tenantId,
              customerId: orderToUpdate.customerId,
              serviceOrderId: orderToUpdate.id,
              invoiceNumber: `INV-${Date.now()}`,
              type: "SALES",
              status: "SENT",
              issueDate: new Date(),
              subTotal: orderToUpdate.subTotal,
              taxAmount: orderToUpdate.taxAmount,
              discountAmount: orderToUpdate.discountAmount,
              totalAmount: orderToUpdate.totalAmount,
            }
          });

          // InvoiceItem satırları oluştur (Paraşüt sync için gerekli)
          if (allItems.length > 0) {
            await tx.invoiceItem.createMany({
              data: allItems.map((si, idx) => ({
                tenantId: session.user.tenantId,
                invoiceId: newInvoice.id,
                type: si.itemType === "PART" ? "PART" : si.itemType === "LABOR" ? "LABOR" : "SERVICE",
                name: si.name,
                description: si.description || null,
                quantity: Number(si.quantity),
                unitPrice: Number(si.unitPrice),
                taxRate: Number(si.taxRate),
                discountRate: Number(si.discount) > 0
                  ? (Number(si.discount) / (Number(si.quantity) * Number(si.unitPrice))) * 100
                  : 0,
                lineTotal: Number(si.totalPrice),
                serviceItemId: si.id,
                sortOrder: idx,
              }))
            });
          }

          await tx.customer.update({
            where: { id: orderToUpdate.customerId },
            data: { balance: { increment: orderToUpdate.totalAmount } }
          });
        }
      }

      // DURUM 3: WAITING_APPROVAL → CANCELLED (Onay reddedildi - stok zaten çıkmış, değişmez)
      // Servis kalemleri eklendiyse stoklar addServiceItem'da zaten düşülmüştü.
      // WAITING_APPROVAL'da fatura yoktur, bu yüzden finansal geri alma gerekmez.

      // Ana güncelleme
      await tx.serviceOrder.update({
        where: { id: val.orderId },
        data: {
          status: val.status,
          actualDeliveryDate: val.status === "COMPLETED" ? new Date() : orderToUpdate.actualDeliveryDate
        }
      });
    });

    // WAITING_APPROVAL durumuna geçişte onay token'ı üret
    if (val.status === "WAITING_APPROVAL") {
      const { generateApprovalToken } = await import("@/lib/actions/approval.actions");
      const tokenResult = await generateApprovalToken(val.orderId);

      // Müşteriye onay bildirimi gönder
      try {
        const orderWithCustomer = await prisma.serviceOrder.findUnique({
          where: { id: val.orderId },
          include: {
            customer: { select: { phone: true, email: true, firstName: true, lastName: true, companyName: true, type: true } },
            vehicle: { select: { plate: true } },
          },
        });
        if (orderWithCustomer && tokenResult.token) {
          const { getApprovalRequestTemplate } = await import("@/lib/notifications/templates");
          const { sendSms } = await import("@/lib/notifications/sms");
          const { sendEmail } = await import("@/lib/notifications/email");
          const approvalUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/onay/${tokenResult.token}`;
          const customerName = orderWithCustomer.customer.type === "CORPORATE"
            ? orderWithCustomer.customer.companyName ?? "Müşteri"
            : `${orderWithCustomer.customer.firstName ?? ""} ${orderWithCustomer.customer.lastName ?? ""}`.trim();
          const tmpl = getApprovalRequestTemplate({
            customerName,
            approvalUrl,
            totalAmount: Number(orderWithCustomer.totalAmount),
            vehiclePlate: orderWithCustomer.vehicle.plate,
          });
          if (orderWithCustomer.customer.phone) {
            await sendSms({ to: orderWithCustomer.customer.phone, body: tmpl.sms, tenantId: orderWithCustomer.tenantId, customerId: orderWithCustomer.customerId });
          }
          if (orderWithCustomer.customer.email) {
            await sendEmail({ to: orderWithCustomer.customer.email, subject: "Servis Onayı Gerekiyor", html: tmpl.emailHtml, tenantId: orderWithCustomer.tenantId, customerId: orderWithCustomer.customerId });
          }
        }
      } catch (notifErr) {
        console.error("Onay bildirimi gönderilemedi:", notifErr);
      }
    } else {
      // Diğer durum değişikliklerinde genel bildirim gönder
      try {
        const orderWithCustomer = await prisma.serviceOrder.findUnique({
          where: { id: val.orderId },
          include: {
            customer: { select: { phone: true, email: true, firstName: true, lastName: true, companyName: true, type: true } },
            vehicle: { select: { plate: true } },
          },
        });
        if (orderWithCustomer) {
          const { getServiceStatusTemplate } = await import("@/lib/notifications/templates");
          const { sendSms } = await import("@/lib/notifications/sms");
          const customerName = orderWithCustomer.customer.type === "CORPORATE"
            ? orderWithCustomer.customer.companyName ?? "Müşteri"
            : `${orderWithCustomer.customer.firstName ?? ""} ${orderWithCustomer.customer.lastName ?? ""}`.trim();
          const tmpl = getServiceStatusTemplate({
            customerName,
            status: val.status,
            orderNumber: orderWithCustomer.orderNumber,
            vehiclePlate: orderWithCustomer.vehicle.plate,
          });
          if (orderWithCustomer.customer.phone) {
            await sendSms({ to: orderWithCustomer.customer.phone, body: tmpl.sms, tenantId: orderWithCustomer.tenantId, customerId: orderWithCustomer.customerId });
          }
        }
      } catch (notifErr) {
        console.error("Durum bildirimi gönderilemedi:", notifErr);
      }
    }

    revalidatePath(`/dashboard/services`);
    revalidatePath(`/dashboard/services/${val.orderId}`);
    await invalidateCache(CacheKeys.dashboardKpi(session.user.tenantId));

    // SSE yayını — bağlı tüm dashboard client'larına anlık bildirim
    publishSSEEvent({
      type: "SERVICE_ORDER_UPDATED",
      payload: { id: val.orderId, status: val.status },
      tenantId: session.user.tenantId,
    });

    // Push bildirim — tenant yöneticilerine
    sendPushToTenant(session.user.tenantId, {
      title: "Servis Durumu Güncellendi",
      body: `İş emri #${val.orderId.slice(-6)} → ${val.status}`,
      url: `/dashboard/services/${val.orderId}`,
    }).catch(() => {}); // fire-and-forget

    return { success: "Statü başarıyla güncellendi" };
  } catch(err) {
    Sentry.captureException(err);
    return { error: "Güncelleme başarısız" };
  }
}

export async function addServiceItem(data: AddServiceItemInput) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

    const val = addServiceItemSchema.parse(data);
    const tenantId = session.user.tenantId;

    const order = await prisma.serviceOrder.findFirst({
      where: { id: val.serviceOrderId, tenantId }
    });
    if (!order) return { error: "İlgili iş emri bulunamadı." };
    if (order.status === "COMPLETED" || order.status === "CANCELLED") {
      return { error: "Tamamlanmış veya iptal edilmiş iş emrine kalem eklenemez." };
    }

    const subTotal = (val.quantity * val.unitPrice) - val.discount;
    if (subTotal < 0) return { error: "Satır ara toplamı negatif olamaz" };

    const taxAmount = (subTotal * val.taxRate) / 100;
    const totalPrice = subTotal + taxAmount;

    // PART türü için stok kontrolü
    if (val.itemType === "PART" && val.partId) {
      const part = await prisma.part.findFirst({
        where: { id: val.partId, tenantId }
      });
      if (!part) return { error: "Parça bulunamadı." };
      if (part.currentStock < val.quantity) {
        return { error: `Yetersiz stok. Mevcut: ${part.currentStock} ${part.unit}, İstenen: ${val.quantity}` };
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Yeni kalemi ekle
      const newItem = await tx.serviceItem.create({
        data: {
          tenantId,
          serviceOrderId: val.serviceOrderId,
          itemType: val.itemType as any,
          name: val.name,
          description: val.description || null,
          partId: val.partId || null,
          mechanicId: val.mechanicId || null,
          quantity: val.quantity,
          unitPrice: val.unitPrice,
          taxRate: val.taxRate,
          discount: val.discount,
          subTotal,
          taxAmount,
          totalPrice
        }
      });

      // 2. PART türüyse stok çıkış hareketi oluştur
      if (val.itemType === "PART" && val.partId) {
        await tx.part.update({
          where: { id: val.partId },
          data: { currentStock: { decrement: val.quantity } }
        });

        await tx.stockMovement.create({
          data: {
            tenantId,
            partId: val.partId,
            quantity: -val.quantity,
            type: "OUT",
            reason: `İş Emri #${order.orderNumber} - ${val.name}`,
            serviceOrderId: val.serviceOrderId,
            serviceItemId: newItem.id,
          }
        });
      }

      // 3. İş emri toplamlarını güncelle
      const agg = await tx.serviceItem.aggregate({
        where: { serviceOrderId: val.serviceOrderId },
        _sum: { subTotal: true, taxAmount: true, totalPrice: true, discount: true }
      });

      await tx.serviceOrder.update({
        where: { id: val.serviceOrderId },
        data: {
          subTotal: agg._sum.subTotal || 0,
          taxAmount: agg._sum.taxAmount || 0,
          totalAmount: agg._sum.totalPrice || 0,
          discountAmount: agg._sum.discount || 0
        }
      });
    });

    revalidatePath(`/dashboard/services/${val.serviceOrderId}`);
    return { success: "Servis kalemi başarıyla eklendi." };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Kalem ekleme hatası:", error);
    return { error: "Satır eklenirken beklenmeyen bir hata oluştu." };
  }
}

export async function removeServiceItem(serviceItemId: string) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

    const tenantId = session.user.tenantId;

    const item = await prisma.serviceItem.findFirst({
      where: { id: serviceItemId, tenantId },
      include: { serviceOrder: true }
    });
    if (!item) return { error: "Servis kalemi bulunamadı." };

    const order = item.serviceOrder;
    if (order.status === "COMPLETED" || order.status === "CANCELLED") {
      return { error: "Tamamlanmış veya iptal edilmiş iş emrinden kalem silinemez." };
    }

    await prisma.$transaction(async (tx) => {
      // 1. PART türüyse stok iade hareketi oluştur
      if (item.itemType === "PART" && item.partId) {
        await tx.part.update({
          where: { id: item.partId },
          data: { currentStock: { increment: Number(item.quantity) } }
        });

        await tx.stockMovement.create({
          data: {
            tenantId,
            partId: item.partId,
            quantity: Number(item.quantity),
            type: "IN",
            reason: `İş Emri #${order.orderNumber} - Kalem silindi: ${item.name}`,
            serviceOrderId: item.serviceOrderId,
            serviceItemId: item.id,
          }
        });
      }

      // 2. Kalemi sil
      await tx.serviceItem.delete({ where: { id: serviceItemId } });

      // 3. İş emri toplamlarını güncelle
      const agg = await tx.serviceItem.aggregate({
        where: { serviceOrderId: item.serviceOrderId },
        _sum: { subTotal: true, taxAmount: true, totalPrice: true, discount: true }
      });

      await tx.serviceOrder.update({
        where: { id: item.serviceOrderId },
        data: {
          subTotal: agg._sum.subTotal || 0,
          taxAmount: agg._sum.taxAmount || 0,
          totalAmount: agg._sum.totalPrice || 0,
          discountAmount: agg._sum.discount || 0
        }
      });
    });

    revalidatePath(`/dashboard/services/${item.serviceOrderId}`);
    return { success: "Servis kalemi silindi." };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Kalem silme hatası:", error);
    return { error: "Kalem silinirken bir hata oluştu." };
  }
}
