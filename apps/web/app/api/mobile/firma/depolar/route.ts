import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }
  const tenantId = session.user.tenantId;

  const locations = await prisma.location.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: "asc" },
  });

  // Count parts per location
  const partCounts = await prisma.part.groupBy({
    by: ["locationId"],
    where: { tenantId, locationId: { not: null } },
    _count: { id: true },
  });
  const countMap = new Map(partCounts.map((r) => [r.locationId, r._count.id]));

  return NextResponse.json({
    locations: locations.map((loc) => ({
      ...loc,
      partCount: countMap.get(loc.id) ?? 0,
    })),
  });
}
