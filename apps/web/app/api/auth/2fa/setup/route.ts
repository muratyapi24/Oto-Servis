import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import { generateSecret, generateOtpAuthUri, generateQRCode, generateBackupCodes } from "@/lib/totp";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const secret = generateSecret();
  const otpAuthUri = generateOtpAuthUri(secret, session.user.email);
  const qrCodeDataUrl = await generateQRCode(otpAuthUri);
  const { plain: backupCodes, hashed: hashedBackupCodes } = generateBackupCodes();

  // Secret'ı geçici olarak kaydet (henüz hasTwoFactor=true yapmıyoruz)
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorSecret: secret,
      twoFactorBackupCodes: hashedBackupCodes,
    },
  });

  return NextResponse.json({
    qrCode: qrCodeDataUrl,
    secret,
    backupCodes, // Kullanıcıya bir kez gösterilir
  });
}
