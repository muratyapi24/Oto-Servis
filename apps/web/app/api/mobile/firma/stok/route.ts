import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFirmaStokData } from "@/lib/actions/mobile.actions";
import { prisma } from "@repo/database";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const barcode = searchParams.get("barcode");
  const partId = searchParams.get("partId");

  // Barkod araması
  if (barcode) {
    const part = await prisma.part.findFirst({
      where: {
        tenantId: session.user.tenantId,
        partNumber: { equals: barcode, mode: "insensitive" },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        partNumber: true,
        currentStock: true,
        sellingPrice: true,
        unit: true,
      },
    });

    if (!part) {
      return NextResponse.json({ part: null });
    }

    return NextResponse.json({
      part: {
        ...part,
        sellingPrice: Number(part.sellingPrice),
      },
    });
  }

  // Parça ID araması
  if (partId) {
    const part = await prisma.part.findUnique({
      where: { id: partId, tenantId: session.user.tenantId, deletedAt: null },
      select: {
        id: true,
        name: true,
        partNumber: true,
        currentStock: true,
        minStockLevel: true,
        sellingPrice: true,
        purchasePrice: true,
        unit: true,
      },
    });

    if (!part) {
      return NextResponse.json({ error: "Parça bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({
      part: {
        ...part,
        sellingPrice: Number(part.sellingPrice),
        purchasePrice: Number(part.purchasePrice),
      },
    });
  }

  // Genel stok listesi
  const result = await getFirmaStokData();
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.data);
}
