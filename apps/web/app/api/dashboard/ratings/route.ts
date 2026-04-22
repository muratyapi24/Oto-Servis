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
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));

    const where = { tenantId: session.user.tenantId };

    const [ratings, total] = await Promise.all([
      prisma.serviceRating.findMany({
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
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.serviceRating.count({ where }),
    ]);

    const serialized = ratings.map((r) => ({
      id: r.id,
      serviceOrderId: r.serviceOrderId,
      customerId: r.customerId,
      customerName:
        r.customer.type === "CORPORATE"
          ? (r.customer.companyName ?? "—")
          : `${r.customer.firstName ?? ""} ${r.customer.lastName ?? ""}`.trim() || "—",
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ ratings: serialized, total, page, limit });
  } catch (err) {
    console.error("Ratings API hatası:", err);
    return NextResponse.json({ error: "Değerlendirmeler yüklenemedi." }, { status: 500 });
  }
}
