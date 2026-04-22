import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.tenantId) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { endpoint, keys } = body as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Geçersiz subscription verisi" }, { status: 400 });
    }

    // Upsert — aynı endpoint varsa güncelle
    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: session.user.id,
          endpoint,
        },
      },
      update: { p256dh: keys.p256dh, auth: keys.auth },
      create: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PUSH] Subscribe hatası:", err);
    return NextResponse.json({ error: "Subscription kaydedilemedi" }, { status: 500 });
  }
}
