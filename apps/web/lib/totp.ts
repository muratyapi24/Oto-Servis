/**
 * TOTP (Time-based One-Time Password) yardımcı modülü
 * Google Authenticator uyumlu — otplib kullanır
 */

// @ts-ignore
const otplib = require("otplib");
const authenticator = otplib.authenticator || (otplib.default && otplib.default.authenticator) || otplib;
import { randomBytes, createHash } from "crypto";

// TOTP penceresi: ±1 (30 saniyelik tolerans)
authenticator.options = { window: 1 };

/**
 * Yeni TOTP secret üret
 */
export function generateSecret(): string {
  return authenticator.generateSecret(20);
}

/**
 * otpauth:// URI oluştur (QR kod için)
 */
export function generateOtpAuthUri(secret: string, email: string): string {
  return authenticator.keyuri(email, "MS Oto Servis", secret);
}

/**
 * otpauth URI'den QR kod data URL'i üret
 */
export async function generateQRCode(otpAuthUri: string): Promise<string> {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(otpAuthUri);
}

/**
 * TOTP token'ı doğrula
 * @returns true: geçerli, false: geçersiz/süresi dolmuş
 */
export function verifyToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

/**
 * 8 adet yedek kod üret (her biri 8 karakter hex)
 */
export function generateBackupCodes(): { plain: string[]; hashed: string[] } {
  const plain: string[] = [];
  const hashed: string[] = [];

  for (let i = 0; i < 8; i++) {
    const code = randomBytes(4).toString("hex").toUpperCase(); // XXXXXXXX
    plain.push(code);
    hashed.push(createHash("sha256").update(code).digest("hex"));
  }

  return { plain, hashed };
}

/**
 * Yedek kodu doğrula (hash karşılaştırması)
 */
export function verifyBackupCode(
  inputCode: string,
  hashedCodes: string[]
): { valid: boolean; remainingCodes: string[] } {
  const inputHash = createHash("sha256")
    .update(inputCode.toUpperCase())
    .digest("hex");

  const index = hashedCodes.indexOf(inputHash);
  if (index === -1) return { valid: false, remainingCodes: hashedCodes };

  // Kullanılan kodu listeden çıkar (tek kullanımlık)
  const remainingCodes = hashedCodes.filter((_, i) => i !== index);
  return { valid: true, remainingCodes };
}
