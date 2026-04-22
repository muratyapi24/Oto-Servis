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
    const period = searchParams.get("period") === "week" ? "week" : "month";

    const now = new Date();
    const startDate =
      period === "week"
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        : new Date(now.getFullYear(), now.getMonth(), 1);

    const tenantId = session.user.tenantId;
    const where = { tenantId, createdAt: { gte: startDate } };

    const [total, statusGroups, ratingAgg] = await Promise.all([
      prisma.serviceOrder.count({ where }),
      prisma.serviceOrder.groupBy({
        by: ["status"],
        where,
        _count: { id: true },
      }),
      prisma.serviceRating.aggregate({
        where: { tenantId, createdAt: { gte: startDate } },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    return NextResponse.json({
      period,
      total,
      distribution: statusGroups.map((g) => ({
        status: g.status,
        count: g._count.id,
      })),
      avgRating: ratingAgg._avg.rating ?? 0,
      ratingCount: ratingAgg._count.rating,
    });
  } catch (err) {
    console.error("Servis raporu API hatası:", err);
    return NextResponse.json({ error: "Servis raporu yüklenemedi." }, { status: 500 });
  }
}
