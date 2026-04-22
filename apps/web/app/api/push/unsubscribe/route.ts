import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const { endpoint } = await req.json() as { endpoint: string };

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint gerekli" }, { status: 400 });
    }

    await prisma.pushSubscription.deleteMany({
      where: { userId: session.user.id, endpoint },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PUSH] Unsubscribe hatası:", err);
    return NextResponse.json({ error: "Subscription silinemedi" }, { status: 500 });
  }
}
