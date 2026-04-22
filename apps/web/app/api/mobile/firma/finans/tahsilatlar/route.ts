import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

    const where = {
      tenantId: session.user.tenantId,
      paymentType: "INCOMING" as const,
    };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              companyName: true,
              type: true,
            },
          },
        },
        orderBy: { paymentDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    const serialized = payments.map((p) => ({
      id: p.id,
      customerId: p.customerId,
      customerName:
        p.customer?.type === "CORPORATE"
          ? (p.customer.companyName ?? "—")
          : `${p.customer?.firstName ?? ""} ${p.customer?.lastName ?? ""}`.trim() || "—",
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod,
      paymentDate: p.paymentDate.toISOString(),
      serviceOrderId: p.serviceOrderId,
      notes: p.notes,
    }));

    return NextResponse.json({ payments: serialized, total, page, limit });
  } catch (err) {
    console.error("Tahsilatlar API hatası:", err);
    return NextResponse.json({ error: "Tahsilatlar yüklenemedi." }, { status: 500 });
  }
}
