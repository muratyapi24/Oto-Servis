import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    // Hizmetler = aktif parçalar (işçilik tipi) veya özel hizmet kategorisi
    // Mevcut şemada ayrı bir Service modeli yok; Part modelindeki işçilik kayıtlarını kullanıyoruz
    const parts = await prisma.part.findMany({
      where: {
        tenantId: session.user.tenantId,
        isActive: true,
        deletedAt: null,
        category: { name: { contains: "işçilik", mode: "insensitive" } },
      },
      include: { category: { select: { name: true } } },
      orderBy: { name: "asc" },
      take: 50,
    });

    // Eğer işçilik kategorisi yoksa tüm aktif parçaları döndür
    const allParts = parts.length > 0 ? parts : await prisma.part.findMany({
      where: {
        tenantId: session.user.tenantId,
        isActive: true,
        deletedAt: null,
      },
      include: { category: { select: { name: true } } },
      orderBy: { name: "asc" },
      take: 50,
    });

    return NextResponse.json({
      services: allParts.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.sellingPrice),
        category: p.category?.name ?? null,
        unit: p.unit,
      })),
    });
  } catch (err) {
    console.error("Hizmetler API hatası:", err);
    return NextResponse.json({ error: "Hizmetler yüklenemedi." }, { status: 500 });
  }
}
