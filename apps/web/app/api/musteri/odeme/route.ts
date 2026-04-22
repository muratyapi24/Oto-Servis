import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import { z } from "zod";

const odemeSchema = z.object({
  invoiceId: z.string().uuid("Geçerli bir fatura ID'si gereklidir"),
  paymentMethod: z.enum(["CASH", "CREDIT_CARD", "BANK_TRANSFER"]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await req.json();
    const validated = odemeSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error?.errors?.[0]?.message || "Ge�ersiz veri" },
        { status: 400 }
      );
    }

    const { invoiceId, paymentMethod } = validated.data;

    // Faturayı bul ve tenant izolasyonu uygula
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId, tenantId: session.user.tenantId ?? undefined, deletedAt: null },
      select: {
        id: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
        customerId: true,
        serviceOrderId: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Fatura bulunamadı." }, { status: 404 });
    }

    if (invoice.status === "PAID") {
      return NextResponse.json({ error: "Bu fatura zaten ödenmiş." }, { status: 422 });
    }

    const remaining = Number(invoice.totalAmount) - Number(invoice.paidAmount);
    if (remaining <= 0) {
      return NextResponse.json({ error: "Ödenecek tutar kalmamış." }, { status: 422 });
    }

    // Ödeme kaydı oluştur
    const payment = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          tenantId: session.user.tenantId!,
          customerId: invoice.customerId,
          invoiceId: invoice.id,
          serviceOrderId: invoice.serviceOrderId,
          amount: remaining,
          paymentMethod,
          paymentType: "INCOMING",
        },
      });

      // Fatura ödeme durumunu güncelle
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: { increment: remaining },
          status: "PAID",
        },
      });

      return newPayment;
    });

    return NextResponse.json(
      {
        success: true,
        paymentId: payment.id,
        amount: Number(payment.amount),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Ödeme API hatası:", err);
    return NextResponse.json({ error: "Ödeme işlemi başarısız." }, { status: 500 });
  }
}
