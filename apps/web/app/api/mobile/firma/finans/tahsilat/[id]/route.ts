import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id, tenantId: session.user.tenantId },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            type: true,
            phone: true,
          },
        },
        serviceOrder: {
          select: { orderNumber: true, id: true },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Tahsilat bulunamadı." }, { status: 404 });
    }

    const customerName =
      payment.customer?.type === "CORPORATE"
        ? (payment.customer.companyName ?? "—")
        : `${payment.customer?.firstName ?? ""} ${payment.customer?.lastName ?? ""}`.trim() || "—";

    return NextResponse.json({
      payment: {
        id: payment.id,
        customerName,
        customerPhone: payment.customer?.phone ?? null,
        amount: Number(payment.amount),
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate.toISOString(),
        notes: payment.notes,
        serviceOrderId: payment.serviceOrderId,
        serviceOrderNumber: payment.serviceOrder?.orderNumber ?? null,
      },
    });
  } catch (err) {
    console.error("Tahsilat detay API hatası:", err);
    return NextResponse.json({ error: "Tahsilat yüklenemedi." }, { status: 500 });
  }
}
