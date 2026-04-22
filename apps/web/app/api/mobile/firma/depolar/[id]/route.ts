import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }
  const tenantId = session.user.tenantId;

  const location = await prisma.location.findFirst({
    where: { id, tenantId },
  });
  if (!location) {
    return NextResponse.json({ error: "Depo bulunamadı" }, { status: 404 });
  }

  const parts = await prisma.part.findMany({
    where: { tenantId, locationId: id, deletedAt: null },
    include: { category: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    location,
    parts: parts.map((p) => ({
      ...p,
      purchasePrice: Number(p.purchasePrice),
      sellingPrice: Number(p.sellingPrice),
    })),
  });
}
