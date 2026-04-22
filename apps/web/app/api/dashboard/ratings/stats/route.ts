import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const where = {
      tenantId: session.user.tenantId,
      createdAt: { gte: thirtyDaysAgo },
    };

    const [aggResult, distResult] = await Promise.all([
      prisma.serviceRating.aggregate({
        where,
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.serviceRating.groupBy({
        by: ["rating"],
        where,
        _count: { rating: true },
      }),
    ]);

    // 1-5 dağılımını tam olarak doldur
    const distribution: Record<string, number> = {
      "1": 0, "2": 0, "3": 0, "4": 0, "5": 0,
    };
    distResult.forEach((d) => {
      distribution[String(d.rating)] = d._count.rating;
    });

    return NextResponse.json({
      average: aggResult._avg.rating ?? 0,
      total: aggResult._count.rating,
      distribution,
      period: "last30days",
    });
  } catch (err) {
    console.error("Ratings stats API hatası:", err);
    return NextResponse.json({ error: "İstatistikler yüklenemedi." }, { status: 500 });
  }
}
