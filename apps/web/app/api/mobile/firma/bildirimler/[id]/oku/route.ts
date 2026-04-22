import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { id } = await params;

    const notification = await prisma.systemNotification.findUnique({
      where: { id, tenantId: session.user.tenantId },
      select: { id: true },
    });

    if (!notification) {
      return NextResponse.json({ error: "Bildirim bulunamadı." }, { status: 404 });
    }

    await prisma.systemNotification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Bildirim okundu hatası:", err);
    return NextResponse.json({ error: "Güncelleme başarısız." }, { status: 500 });
  }
}
