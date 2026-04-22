import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    // Yalnızca TENANT_ADMIN silebilir
    if (session.user.role !== "TENANT_ADMIN") {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok." },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Tenant izolasyonu — farklı tenant'a ait kayıt 404 döner
    const rating = await prisma.serviceRating.findUnique({
      where: { id, tenantId: session.user.tenantId },
      select: { id: true },
    });

    if (!rating) {
      return NextResponse.json({ error: "Değerlendirme bulunamadı." }, { status: 404 });
    }

    await prisma.serviceRating.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Rating silme hatası:", err);
    return NextResponse.json({ error: "Silme işlemi başarısız." }, { status: 500 });
  }
}
