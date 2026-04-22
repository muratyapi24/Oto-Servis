import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import { z } from "zod";

const taksitSchema = z.object({
  invoiceId: z.string().uuid("Geçerli bir fatura ID'si gereklidir"),
  installments: z.number().int().refine(
    (n) => [2, 3, 6, 12].includes(n),
    "Geçerli taksit sayısı: 2, 3, 6 veya 12"
  ),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await req.json();
    const validated = taksitSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error?.errors?.[0]?.message || "Ge�ersiz veri" },
        { status: 400 }
      );
    }

    const { invoiceId, installments } = validated.data;

    // Faturayı doğrula
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
    const monthlyAmount = remaining / installments;

    // İlk taksit ödemesini kaydet
    const firstPayment = await prisma.payment.create({
      data: {
        tenantId: session.user.tenantId!,
        customerId: invoice.customerId,
        invoiceId: invoice.id,
        serviceOrderId: invoice.serviceOrderId,
        amount: monthlyAmount,
        paymentMethod: "CREDIT_CARD",
        paymentType: "INCOMING",
        notes: `Taksitli ödeme — ${installments} taksit (1/${installments})`,
      },
    });

    // Fatura ödenen tutarını güncelle
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { paidAmount: { increment: monthlyAmount } },
    });

    return NextResponse.json(
      {
        success: true,
        installments,
        monthlyAmount,
        totalAmount: remaining,
        firstPaymentId: firstPayment.id,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Taksit planı API hatası:", err);
    return NextResponse.json({ error: "Taksit planı oluşturulamadı." }, { status: 500 });
  }
}
