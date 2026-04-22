import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            type: true,
          },
        },
        serviceOrder: { select: { orderNumber: true, id: true } },
        invoice: { select: { invoiceNumber: true } },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Makbuz bulunamadı." }, { status: 404 });
    }

    // Müşteri sahipliği kontrolü — tenantId üzerinden doğrula
    if (payment.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: "Erişim reddedildi." }, { status: 403 });
    }

    const customerName =
      payment.customer?.type === "CORPORATE"
        ? (payment.customer.companyName ?? "—")
        : `${payment.customer?.firstName ?? ""} ${payment.customer?.lastName ?? ""}`.trim() || "—";

    const METHOD_LABELS: Record<string, string> = {
      CASH: "Nakit",
      CREDIT_CARD: "Kredi / Banka Kartı",
      BANK_TRANSFER: "Havale / EFT",
    };

    return NextResponse.json({
      payment: {
        id: payment.id,
        customerName,
        amount: Number(payment.amount),
        paymentMethod: payment.paymentMethod,
        paymentMethodLabel: METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod,
        paymentDate: payment.paymentDate.toISOString(),
        serviceOrderId: payment.serviceOrderId,
        serviceOrderNumber: payment.serviceOrder?.orderNumber ?? null,
        invoiceNumber: payment.invoice?.invoiceNumber ?? null,
      },
    });
  } catch (err) {
    console.error("Makbuz API hatası:", err);
    return NextResponse.json({ error: "Makbuz yüklenemedi." }, { status: 500 });
  }
}
