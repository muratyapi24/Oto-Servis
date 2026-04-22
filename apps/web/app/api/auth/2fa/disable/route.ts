import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const { password } = await req.json() as { password: string };

  if (!password) {
    return NextResponse.json({ error: "Şifre gerekli" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true, hasTwoFactor: true },
  });

  if (!user?.password) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) {
    return NextResponse.json({ error: "Şifre hatalı" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      hasTwoFactor: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
    },
  });

  return NextResponse.json({ success: true });
}
