/**
 * POST /api/mobile/musteri/otp
 * Müşteri SMS OTP gönder ve doğrula.
 * Body: { action: "send", plate: string, phone: string }
 *    | { action: "verify", plate: string, phone: string, otp: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { sendCustomerOTP } from "@/lib/actions/auth.actions";
import { prisma } from "@repo/database";
import { createHmac, randomBytes } from "crypto";

const OTP_KEY_PREFIX = "customer_otp:";
const TOKEN_SECRET = process.env.NEXTAUTH_SECRET ?? "mobile-secret-change-me";

function createMobileToken(payload: Record<string, unknown>): string {
  const exp = Math.floor(Date.now() / 1000) + 86400;
  const data = JSON.stringify({ ...payload, exp, jti: randomBytes(8).toString("hex") });
  const encoded = Buffer.from(data).toString("base64url");
  const sig = createHmac("sha256", TOKEN_SECRET).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

async function getAndDeleteOtp(plate: string, phone: string): Promise<string | null> {
  try {
    const { Redis } = await import("@upstash/redis");
    const redis = Redis.fromEnv();
    const otp = await redis.getdel(`${OTP_KEY_PREFIX}${plate}:${phone}`);
    return typeof otp === "string" ? otp : null;
  } catch {
    return null;
  }
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? "mobile-customer-secret-change-in-production"
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      action: "send" | "verify";
      plate: string;
      phone: string;
      otp?: string;
    };

    if (!body.plate || !body.phone) {
      return NextResponse.json({ error: "Plaka ve telefon numarası zorunludur." }, { status: 400 });
    }

    const queryPlate = body.plate.replace(/\s+/g, "").toUpperCase();
    const queryPhone = body.phone.replace(/\s+/g, "");

    if (body.action === "send") {
      const result = await sendCustomerOTP(queryPlate, queryPhone);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: "OTP gönderildi." });
    }

    if (body.action === "verify") {
      if (!body.otp) {
        return NextResponse.json({ error: "OTP kodu zorunludur." }, { status: 400 });
      }

      // OTP doğrula
      const storedOtp = await getAndDeleteOtp(queryPlate, queryPhone);
      if (!storedOtp) {
        return NextResponse.json({ error: "OTP kodu süresi dolmuş veya geçersiz. Yeniden kod talep edin." }, { status: 400 });
      }
      if (storedOtp !== body.otp.trim()) {
        return NextResponse.json({ error: "Girdiğiniz kod hatalı." }, { status: 400 });
      }

      // Araç kaydını bul
      const vehicle = await prisma.vehicle.findFirst({
        where: { plate: queryPlate, deletedAt: null },
        include: { customer: { select: { id: true, tenantId: true, firstName: true, lastName: true, companyName: true, type: true } } },
      });
      if (!vehicle) {
        return NextResponse.json({ error: "Bu plakaya ait araç kaydı bulunamadı." }, { status: 404 });
      }

      // Mobile token üret (24 saat geçerli, HMAC-SHA256)
      const token = createMobileToken({
        sub: vehicle.customer.id,
        plate: queryPlate,
        tenantId: vehicle.customer.tenantId,
        role: "CUSTOMER",
      });

      return NextResponse.json({
        success: true,
        token,
        customer: {
          id: vehicle.customer.id,
          vehicleId: vehicle.id,
          plate: vehicle.plate,
          brand: vehicle.brand,
          model: vehicle.model,
          name: vehicle.customer.type === "CORPORATE"
            ? vehicle.customer.companyName
            : `${vehicle.customer.firstName ?? ""} ${vehicle.customer.lastName ?? ""}`.trim(),
        },
      });
    }

    return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
  } catch (err) {
    console.error("/api/mobile/musteri/otp hatası:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
