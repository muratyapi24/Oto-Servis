"use server";

import * as z from "zod";
import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { prisma } from "@repo/database";
import { registerSchema, loginSchema, customerLoginSchema } from "@/lib/validations/auth";
import { signIn } from "@/auth";
import { inngest } from "@/lib/inngest/client";
import { applyReferralCode } from "@/lib/actions/referral.actions";

export async function registerTenant(
  values: z.infer<typeof registerSchema>,
  meta?: { ipAddress?: string; userAgent?: string; referralCode?: string }
) {
  try {
    const validatedData = registerSchema.safeParse(values);
    if (!validatedData.success) {
      return { error: "Geçersiz form verisi." };
    }

    const { firstName, lastName, companyName, email, phone, password } = validatedData.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Bu e-posta adresi zaten kullanımda." };
    }

    // Generate unique slug for tenant
    const slugBase = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let slug = slugBase;
    let counter = 1;
    
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${slugBase}-${counter}`;
      counter++;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Tenant and User transaction
    const { tenantId: newTenantId } = await prisma.$transaction(async (tx) => {
      // Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          slug,
          email,
          phone,
          status: "ACTIVE",
        },
      });

      // Create Admin User for this Tenant
      await tx.user.create({
        data: {
          name: `${firstName} ${lastName}`,
          email,
          password: hashedPassword,
          role: "TENANT_ADMIN",
          tenantId: tenant.id,
        },
      });

      // Assign a default 14-day trial subscription if a starter plan exists
      const starterPlan = await tx.subscriptionPlan.findFirst({
        where: { slug: "starter-plan" }
      });

      if (starterPlan) {
        await tx.subscription.create({
          data: {
            tenantId: tenant.id,
            planId: starterPlan.id,
            status: "TRIAL",
            startDate: new Date(),
            currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          }
        });
      }

      return { tenantId: tenant.id };
    });

    // KVKK: Sözleşme kabul kaydı — IP + userAgent + timestamp + versiyon
    // IP/UA önce meta'dan, yoksa Next.js headers()'dan otomatik okunur
    try {
      const headersList = await headers();
      const ipAddress =
        meta?.ipAddress ??
        headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        headersList.get("x-real-ip") ??
        "unknown";
      const userAgent =
        meta?.userAgent ?? headersList.get("user-agent") ?? "unknown";

      await prisma.kvkkConsent.create({
        data: {
          tenantId: newTenantId,
          consentType: "REGISTRATION",
          ipAddress,
          userAgent,
          version: "1.0",
        },
      });
    } catch (kvkkError) {
      console.warn("KVKK consent kaydedilemedi (migration bekliyor olabilir):", kvkkError);
    }

    // Referral kodu varsa uygula
    if (meta?.referralCode) {
      applyReferralCode(newTenantId, meta.referralCode).catch(() => {});
    }

    // Onboarding e-mail sekansını başlat (fire-and-forget)
    inngest.send({
      name: "onboarding/tenant.registered",
      data: {
        tenantId: newTenantId,
        email,
        firstName,
        companyName,
      },
    }).catch(() => {}); // Inngest yoksa sessizce atla

    return { success: "Hesabınız başarıyla oluşturuldu! Lütfen giriş yapın." };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Kayıt işlemi sırasında bir hata oluştu." };
  }
}

export async function loginUser(values: z.infer<typeof loginSchema>) {
  try {
    const validatedData = loginSchema.safeParse(values);
    if (!validatedData.success) {
      return { error: "Geçersiz giriş bilgileri." };
    }

    const { email, password } = validatedData.data;

    const user = await prisma.user.findUnique({ where: { email } });

    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: "Giriş başarılı.", role: user?.role };
  } catch (error) {
    if ((error as Record<string, unknown>)?.type === "CredentialsSignin") {
      return { error: "E-posta veya şifre hatalı." };
    }
    if ((error as Record<string, unknown>)?.digest && String((error as Record<string, unknown>).digest).includes("NEXT_REDIRECT")) {
      throw error;
    }
    return { error: "Beklenmeyen bir hata oluştu." };
  }
}

// YENİ: Sadece Super Adminlerin kullanabileceği ayrılmış Login rotası
export async function superAdminLogin(values: z.infer<typeof loginSchema>) {
  try {
    const validatedData = loginSchema.safeParse(values);
    if (!validatedData.success) {
      return { error: "Geçersiz giriş bilgileri." };
    }

    const { email, password } = validatedData.data;

    // Özel Denetim: Admin portalından giriş yapan kişinin sahiden SUPER_ADMIN olması zorunludur.
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || user.role !== "SUPER_ADMIN") {
      return { error: "Girdiğiniz hesap Kurucu Yönetici (Super Admin) yetkisine sahip değil. Lütfen firma (tenant) portalından giriş yapın." };
    }

    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: "Giriş başarılı.", role: user.role };
  } catch (error) {
    if ((error as Record<string, unknown>)?.type === "CredentialsSignin") {
      return { error: "Girdiğiniz E-posta veya şifre hatalı." };
    }
    if ((error as Record<string, unknown>)?.digest && String((error as Record<string, unknown>).digest).includes("NEXT_REDIRECT")) {
      throw error;
    }
    return { error: "Beklenmeyen bir kimlik doğrulama hatası oluştu." };
  }
}

// ---------------------------------------------------------------------------
// OTP Redis helper — @upstash/redis ile; env yoksa dev modunda in-memory çalışır
// ---------------------------------------------------------------------------
const OTP_TTL_SECONDS = 300; // 5 dakika
const OTP_KEY_PREFIX = "customer_otp:";

// Dev mode fallback using globalThis to survive Next.js fast refresh
const devOtpStore = (globalThis as any).devOtpStore || new Map<string, { otp: string; expires: number }>();
if (process.env.NODE_ENV !== "production") {
  (globalThis as any).devOtpStore = devOtpStore;
}

async function storeOtp(plate: string, phone: string, otp: string): Promise<void> {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) throw new Error("Redis not configured");
    const { Redis } = await import("@upstash/redis");
    const redis = Redis.fromEnv();
    await redis.set(`${OTP_KEY_PREFIX}${plate}:${phone}`, otp, { ex: OTP_TTL_SECONDS });
  } catch {
    // Fallback to in-memory store for development
    devOtpStore.set(`${OTP_KEY_PREFIX}${plate}:${phone}`, {
      otp,
      expires: Date.now() + OTP_TTL_SECONDS * 1000,
    });
    console.log(`[DEV OTP] Müşteri ${plate} / ${phone} için oluşturulan kod: ${otp}`);
  }
}

async function getAndDeleteOtp(plate: string, phone: string): Promise<string | null> {
  const key = `${OTP_KEY_PREFIX}${plate}:${phone}`;
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) throw new Error("Redis not configured");
    const { Redis } = await import("@upstash/redis");
    const redis = Redis.fromEnv();
    const otp = await redis.getdel(key);
    return typeof otp === "string" ? otp : null;
  } catch {
    // Fallback to in-memory store
    const record = devOtpStore.get(key);
    devOtpStore.delete(key);
    if (record && record.expires > Date.now()) {
      return record.otp;
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// sendCustomerOTP — Plaka+telefon doğrulama, OTP üretme ve SMS gönderme
// ---------------------------------------------------------------------------
export async function sendCustomerOTP(plate: string, phone: string) {
  try {
    const queryPlate = plate.replace(/\s+/g, "").toUpperCase();
    const queryPhone = phone.replace(/\s+/g, "");

    const vehicles = await prisma.vehicle.findMany({
      where: { customer: { phone: { contains: queryPhone } } },
      include: { customer: true },
    });

    const vehicle = vehicles.find(
      (v) => v.plate.replace(/\s+/g, "").toUpperCase() === queryPlate
    );

    if (!vehicle) {
      return { error: "Bu plaka ve telefon numarası ile kayıtlı araç bulunamadı." };
    }

    const otp = String(randomInt(100000, 999999));
    await storeOtp(queryPlate, queryPhone, otp);

    const customerPhone = vehicle.customer.phone;
    if (customerPhone) {
      try {
        const { sendSms } = await import("@/lib/notifications/sms");
        await sendSms({
          to: customerPhone.startsWith("+") ? customerPhone : `+90${customerPhone.replace(/^0/, "")}`,
          body: `MS Oto Servis giriş kodunuz: ${otp}. Kod 5 dakika geçerlidir.`,
          tenantId: vehicle.tenantId,
        });
      } catch {
        // SMS gönderilemese bile OTP Redis'e kaydedildi; dev'de console'da görünür
      }
    }

    return { success: true };
  } catch {
    return { error: "OTP gönderilemedi. Lütfen daha sonra tekrar deneyin." };
  }
}

// ---------------------------------------------------------------------------
// verifyCustomerOTP — OTP doğrulama ve NextAuth oturumu açma
// ---------------------------------------------------------------------------
export async function verifyCustomerOTP(plate: string, phone: string, otp: string) {
  try {
    const queryPlate = plate.replace(/\s+/g, "").toUpperCase();
    const queryPhone = phone.replace(/\s+/g, "");

    const storedOtp = await getAndDeleteOtp(queryPlate, queryPhone);
    if (!storedOtp) {
      return { error: "OTP kodu süresi dolmuş veya geçersiz. Yeniden kod talep edin." };
    }
    if (storedOtp !== otp.trim()) {
      return { error: "Girdiğiniz kod hatalı. Lütfen tekrar deneyin." };
    }

    await signIn("customer", { plate, phone, redirect: false });
    return { success: "Giriş başarılı.", role: "CUSTOMER" };
  } catch (error) {
    if ((error as Record<string, unknown>)?.type === "CredentialsSignin") {
      return { error: "Araç kaydı bulunamadı. Servis personeliyle iletişime geçin." };
    }
    if ((error as Record<string, unknown>)?.digest && String((error as Record<string, unknown>).digest).includes("NEXT_REDIRECT")) throw error;
    return { error: "Giriş sırasında hata oluştu. Lütfen tekrar deneyin." };
  }
}

export async function loginCustomer(values: z.infer<typeof customerLoginSchema>) {
  try {
    const validatedData = customerLoginSchema.safeParse(values);
    if (!validatedData.success) {
      return { error: "Geçersiz giriş bilgileri." };
    }

    const { plate, phone, rememberMe } = validatedData.data;

    // Use NextAuth signIn with our new "customer" provider
    await signIn("customer", {
      plate,
      phone,
      redirect: false,
    });

    return { success: "Giriş başarılı.", role: "CUSTOMER" };
  } catch (error) {
    if ((error as Record<string, unknown>)?.type === "CredentialsSignin") {
      return { error: "Veritabanında bu plaka ve telefon numarası ile eşleşen bir araç kaydı bulunamadı." };
    }
    if ((error as Record<string, unknown>)?.digest && String((error as Record<string, unknown>).digest).includes("NEXT_REDIRECT")) {
      throw error; // Let Next.js handle redirect if redirect:true were used, but we use redirect:false.
    }
    return { error: "Beklenmeyen bir kimlik doğrulama hatası oluştu." };
  }
}
