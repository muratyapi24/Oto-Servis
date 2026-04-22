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
    const partName = searchParams.get("partName") ?? "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {
      tenantId: session.user.tenantId,
      ...(partName && {
        part: { name: { contains: partName, mode: "insensitive" } },
      }),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate + "T23:59:59") }),
            },
          }
        : {}),
    };

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: { part: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    const serialized = movements.map((m) => ({
      id: m.id,
      partName: m.part.name,
      type: m.type,
      quantity: Number(m.quantity),
      reason: m.reason,
      date: m.createdAt.toISOString(),
    }));

    return NextResponse.json({ movements: serialized, total, page, limit });
  } catch (err) {
    console.error("Stok hareketleri API hatası:", err);
    return NextResponse.json({ error: "Stok hareketleri yüklenemedi." }, { status: 500 });
  }
}
