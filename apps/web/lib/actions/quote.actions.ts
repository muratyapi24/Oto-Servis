"use server";

import { prisma } from "@repo/database";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  createQuoteSchema, addQuoteItemSchema, updateQuoteStatusSchema,
  type CreateQuoteInput, type AddQuoteItemInput, type UpdateQuoteStatusInput,
} from "@/lib/validations/quotes";

function serializeQuote(q: any) {
  return {
    ...q,
    subTotal: Number(q.subTotal),
    discountAmount: Number(q.discountAmount),
    taxAmount: Number(q.taxAmount),
    totalAmount: Number(q.totalAmount),
    items: (q.items ?? []).map((item: any) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      taxRate: Number(item.taxRate),
      discount: Number(item.discount),
      subTotal: Number(item.subTotal),
      taxAmount: Number(item.taxAmount),
      totalPrice: Number(item.totalPrice),
    })),
  };
}

export async function getQuotes(): Promise<{ quotes?: any[]; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erisim" };
    const tenantId = session.user.tenantId;

    const quotes = await prisma.quote.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        customer: { select: { id: true, type: true, firstName: true, lastName: true, companyName: true } },
        vehicle: { select: { id: true, plate: true, brand: true, model: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const serialized = quotes.map((q) => {
      const isExpired = q.validUntil && q.validUntil < now && q.status === "SENT";
      return serializeQuote({ ...q, status: isExpired ? "EXPIRED" : q.status });
    });

    return { quotes: serialized };
  } catch (err: any) {
    console.error("getQuotes error:", err);
    return { error: "Teklifler alinamadi." };
  }
}

export async function getQuoteById(id: string): Promise<{ quote?: any; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erisim" };
    const tenantId = session.user.tenantId;

    const quote = await prisma.quote.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        customer: { select: { id: true, type: true, firstName: true, lastName: true, companyName: true, phone: true } },
        vehicle: { select: { id: true, plate: true, brand: true, model: true } },
        items: { include: { part: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
      },
    });

    if (!quote) return { error: "Teklif bulunamadi" };

    const now = new Date();
    const isExpired = quote.validUntil && quote.validUntil < now && quote.status === "SENT";
    const finalStatus = isExpired ? "EXPIRED" : quote.status;

    return { quote: serializeQuote({ ...quote, status: finalStatus }) };
  } catch (err: any) {
    console.error("getQuoteById error:", err);
    return { error: "Teklif bilgileri alinamadi." };
  }
}

export async function createQuote(data: CreateQuoteInput): Promise<{ success?: string; quoteId?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erisim" };
    const tenantId = session.user.tenantId;
    const parsed = createQuoteSchema.safeParse(data);
    if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Gecersiz veri" };

    const quote = await prisma.quote.create({
      data: {
        tenantId,
        customerId: parsed.data.customerId,
        vehicleId: parsed.data.vehicleId || null,
        validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
        notes: parsed.data.notes,
        status: "DRAFT",
      },
    });

    revalidatePath("/dashboard/quotes");
    return { success: "Teklif olusturuldu", quoteId: quote.id };
  } catch (err: any) {
    console.error("createQuote error:", err?.message ?? err);
    const msg = err?.message ?? "";
    if (msg.includes("Foreign key constraint") || msg.includes("foreign key")) {
      return { error: "Seçilen müşteri veya araç bu hesaba ait değil. Lütfen tekrar seçin." };
    }
    return { error: `Teklif oluşturulamadı: ${msg || "Bilinmeyen hata"}` };
  }
}

export async function addQuoteItem(data: AddQuoteItemInput): Promise<{ success?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erisim" };
    const tenantId = session.user.tenantId;
    const parsed = addQuoteItemSchema.safeParse(data);
    if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Gecersiz veri" };

    const { quoteId, itemType, name, partId, quantity, unitPrice, taxRate, discount } = parsed.data;

    const quote = await prisma.quote.findFirst({ where: { id: quoteId, tenantId, deletedAt: null } });
    if (!quote) return { error: "Teklif bulunamadi" };

    const subTotal = quantity * unitPrice - discount;
    const taxAmount = subTotal * taxRate / 100;
    const totalPrice = subTotal + taxAmount;

    await prisma.$transaction(async (tx) => {
      await tx.quoteItem.create({
        data: {
          quoteId, itemType: itemType as any, name,
          partId: partId || null,
          quantity, unitPrice, taxRate, discount,
          subTotal, taxAmount, totalPrice,
        },
      });

      const allItems = await tx.quoteItem.findMany({ where: { quoteId } });
      const newSubTotal = allItems.reduce((s, i) => s + Number(i.subTotal), 0);
      const newTaxAmount = allItems.reduce((s, i) => s + Number(i.taxAmount), 0);
      const newTotal = allItems.reduce((s, i) => s + Number(i.totalPrice), 0);

      await tx.quote.update({
        where: { id: quoteId },
        data: { subTotal: newSubTotal, taxAmount: newTaxAmount, totalAmount: newTotal },
      });
    });

    revalidatePath(`/dashboard/quotes/${quoteId}`);
    return { success: "Kalem eklendi" };
  } catch (err: any) {
    console.error("addQuoteItem error:", err);
    return { error: "Kalem eklenemedi." };
  }
}

export async function updateQuoteStatus(data: UpdateQuoteStatusInput): Promise<{ success?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erisim" };
    const tenantId = session.user.tenantId;
    const parsed = updateQuoteStatusSchema.safeParse(data);
    if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Gecersiz veri" };

    const quote = await prisma.quote.findFirst({ where: { id: parsed.data.quoteId, tenantId, deletedAt: null } });
    if (!quote) return { error: "Teklif bulunamadi" };

    const now = new Date();
    if (quote.validUntil && quote.validUntil < now && parsed.data.status !== "EXPIRED") {
      return { error: "Bu teklif suresi dolmus" };
    }

    await prisma.quote.update({
      where: { id: parsed.data.quoteId },
      data: {
        status: parsed.data.status as any,
        rejectionReason: parsed.data.rejectionReason ?? null,
      },
    });

    revalidatePath("/dashboard/quotes");
    return { success: "Teklif durumu guncellendi" };
  } catch (err: any) {
    console.error("updateQuoteStatus error:", err);
    return { error: "Durum guncellenemedi." };
  }
}

export async function convertQuoteToServiceOrder(quoteId: string): Promise<{ success?: string; serviceOrderId?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erisim" };
    const tenantId = session.user.tenantId;

    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, tenantId, deletedAt: null },
      include: { items: true },
    });

    if (!quote) return { error: "Teklif bulunamadi" };
    if (quote.status === "ACCEPTED") return { error: "Bu teklif zaten servis emrine donusturulmus" };
    if (!quote.vehicleId) return { error: "Teklif bir araca bagli degil" };

    const now = new Date();
    if (quote.validUntil && quote.validUntil < now) return { error: "Bu teklif suresi dolmus" };

    const serviceOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.serviceOrder.create({
        data: {
          tenantId,
          customerId: quote.customerId,
          vehicleId: quote.vehicleId!,
          complaintDescription: `Teklif #${quote.quoteNumber} uzerinden olusturuldu`,
          status: "PENDING",
          subTotal: quote.subTotal,
          discountAmount: quote.discountAmount,
          taxAmount: quote.taxAmount,
          totalAmount: quote.totalAmount,
        },
      });

      for (const item of quote.items) {
        await tx.serviceItem.create({
          data: {
            tenantId,
            serviceOrderId: order.id,
            itemType: item.itemType,
            name: item.name,
            partId: item.partId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            discount: item.discount,
            subTotal: item.subTotal,
            taxAmount: item.taxAmount,
            totalPrice: item.totalPrice,
          },
        });
      }

      await tx.quote.update({ where: { id: quoteId }, data: { status: "ACCEPTED" } });
      return order;
    });

    revalidatePath("/dashboard/quotes");
    revalidatePath("/dashboard/services");
    return { success: "Servis emri olusturuldu", serviceOrderId: serviceOrder.id };
  } catch (err: any) {
    console.error("convertQuoteToServiceOrder error:", err);
    return { error: "Servis emrine donusturulemedi." };
  }
}

/** Teklifi SMS ile müşteriye gönder */
export async function sendQuoteViaSms(quoteId: string): Promise<{ success?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };
    const tenantId = session.user.tenantId;

    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, tenantId, deletedAt: null },
      include: {
        customer: { select: { phone: true, firstName: true, lastName: true, companyName: true, type: true } },
        vehicle: { select: { plate: true, brand: true, model: true } },
      },
    });

    if (!quote) return { error: "Teklif bulunamadı" };
    if (!quote.customer?.phone) return { error: "Müşterinin telefon numarası kayıtlı değil" };

    const customerName = quote.customer.type === "CORPORATE"
      ? quote.customer.companyName
      : `${quote.customer.firstName} ${quote.customer.lastName}`;

    const vehicleInfo = quote.vehicle
      ? `${quote.vehicle.plate} (${quote.vehicle.brand} ${quote.vehicle.model})`
      : "";

    const total = Number(quote.totalAmount).toLocaleString("tr-TR", { minimumFractionDigits: 2 });
    const validUntil = quote.validUntil
      ? new Date(quote.validUntil).toLocaleDateString("tr-TR")
      : "";

    const message = `Sayın ${customerName}, ${vehicleInfo ? `${vehicleInfo} aracınız için ` : ""}servis teklifimiz hazırlanmıştır. Toplam: ₺${total} (KDV dahil).${validUntil ? ` Geçerlilik: ${validUntil}.` : ""} Detaylar için bizi arayabilirsiniz. İyi günler dileriz.`;

    const { sendSms } = await import("@/lib/notifications/sms");
    const result = await sendSms({
      to: quote.customer.phone,
      body: message,
      tenantId,
      customerId: quote.customerId
    });

    if (result.success) {
      // Statüsünü SENT yap (eğer hala DRAFT ise)
      if (quote.status === "DRAFT") {
        await prisma.quote.update({
          where: { id: quoteId },
          data: { status: "SENT" }
        });
        revalidatePath("/dashboard/quotes");
      }
      return { success: `Teklif ${customerName} müşterisine SMS olarak gönderildi.` };
    } else {
      return { error: result.error || "SMS gönderilemedi" };
    }
  } catch (error: any) {
    console.error("sendQuoteViaSms error:", error);
    return { error: "Teklif SMS olarak gönderilemedi: " + error.message };
  }
}

/** Teklifi Sil (Soft Delete) */
export async function deleteQuote(quoteId: string): Promise<{ success?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

    await prisma.quote.update({
      where: { id: quoteId, tenantId: session.user.tenantId },
      data: { deletedAt: new Date() }
    });

    revalidatePath("/dashboard/quotes");
    return { success: "Teklif silindi." };
  } catch (error: any) {
    console.error("deleteQuote error:", error);
    return { error: "Teklif silinemedi." };
  }
}

/** Kalem item silme */
export async function deleteQuoteItem(itemId: string, quoteId: string): Promise<{ success?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };
    const tenantId = session.user.tenantId;

    await prisma.$transaction(async (tx) => {
      await tx.quoteItem.delete({ where: { id: itemId } });

      const allItems = await tx.quoteItem.findMany({ where: { quoteId } });
      const newSubTotal = allItems.reduce((s, i) => s + Number(i.subTotal), 0);
      const newTaxAmount = allItems.reduce((s, i) => s + Number(i.taxAmount), 0);
      const newTotal = allItems.reduce((s, i) => s + Number(i.totalPrice), 0);

      await tx.quote.update({
        where: { id: quoteId },
        data: { subTotal: newSubTotal, taxAmount: newTaxAmount, totalAmount: newTotal },
      });
    });

    revalidatePath(`/dashboard/quotes/${quoteId}`);
    return { success: "Kalem silindi" };
  } catch (error: any) {
    console.error("deleteQuoteItem error:", error);
    return { error: "Kalem silinemedi." };
  }
}
