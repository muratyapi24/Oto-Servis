import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    // Müşteriye ait bildirimleri çek
    const notifications = await prisma.systemNotification.findMany({
      where: {
        tenantId: session.user.tenantId ?? undefined,
        // Müşteri bildirimleri — customerId veya genel bildirimler
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        link: n.link,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("Müşteri bildirimler API hatası:", err);
    return NextResponse.json({ error: "Bildirimler yüklenemedi." }, { status: 500 });
  }
}

export async function PATCH(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    await prisma.systemNotification.updateMany({
      where: { tenantId: session.user.tenantId, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Müşteri bildirimler toplu okundu hatası:", err);
    return NextResponse.json({ error: "Güncelleme başarısız." }, { status: 500 });
  }
}
