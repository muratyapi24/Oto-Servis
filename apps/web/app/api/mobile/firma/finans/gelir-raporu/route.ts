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
    const monthParam = searchParams.get("month"); // YYYY-MM

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const parts = monthParam.split("-");
      const year = parseInt(parts[0] || "0", 10);
      const month = parseInt(parts[1] || "0", 10);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const tenantId = session.user.tenantId;

    // Tamamlanan servis emirlerindeki kalemleri çek
    const items = await prisma.serviceItem.findMany({
      where: {
        tenantId,
        serviceOrder: {
          status: "COMPLETED",
          actualDeliveryDate: { gte: startDate, lte: endDate },
        },
      },
      select: {
        itemType: true,
        totalPrice: true,
      },
    });

    let labor = 0;
    let parts = 0;
    let other = 0;

    items.forEach((item) => {
      const amount = Number(item.totalPrice);
      if (item.itemType === "LABOR") labor += amount;
      else if (item.itemType === "PART") parts += amount;
      else other += amount;
    });

    const total = labor + parts + other;

    return NextResponse.json({
      month: monthParam ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      total,
      breakdown: { labor, parts, other },
    });
  } catch (err) {
    console.error("Gelir raporu API hatası:", err);
    return NextResponse.json({ error: "Gelir raporu yüklenemedi." }, { status: 500 });
  }
}
