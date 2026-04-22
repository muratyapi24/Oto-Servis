import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

    // Müşteri kaydını bul — customerId session'da yoksa tenantId üzerinden ara
    const customer = await prisma.customer.findFirst({
      where: {
        tenantId: session.user.tenantId ?? undefined,
        // Gerçek uygulamada session.user.customerId kullanılır
      },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json({ payments: [], total: 0, page, limit });
    }

    const where = { customerId: customer.id, paymentType: "INCOMING" as const };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { paymentDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          amount: true,
          paymentMethod: true,
          paymentDate: true,
          serviceOrderId: true,
          notes: true,
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      payments: payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod,
        paymentDate: p.paymentDate.toISOString(),
        serviceOrderId: p.serviceOrderId,
        notes: p.notes,
      })),
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error("Müşteri ödemeler API hatası:", err);
    return NextResponse.json({ error: "Ödemeler yüklenemedi." }, { status: 500 });
  }
}
