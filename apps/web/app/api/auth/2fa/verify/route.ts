import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import { verifyToken } from "@/lib/totp";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const { token } = await req.json() as { token: string };

  if (!token || token.length !== 6) {
    return NextResponse.json({ error: "Geçersiz token formatı" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorSecret: true },
  });

  if (!user?.twoFactorSecret) {
    return NextResponse.json({ error: "2FA kurulmamış" }, { status: 400 });
  }

  const isValid = verifyToken(token, user.twoFactorSecret);

  if (!isValid) {
    return NextResponse.json({ error: "Geçersiz veya süresi dolmuş kod" }, { status: 400 });
  }

  // 2FA'yı aktif et
  await prisma.user.update({
    where: { id: session.user.id },
    data: { hasTwoFactor: true },
  });

  return NextResponse.json({ success: true });
}
