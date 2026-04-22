"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@repo/database";
import { registerSchema, loginSchema, customerLoginSchema } from "@/lib/validations/auth";
import { signIn } from "@/auth";

export async function registerTenant(
  values: z.infer<typeof registerSchema>,
  meta?: { ipAddress?: string; userAgent?: string }
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

    // KVKK: Açık rıza kaydı — transaction dışında, tablo yoksa kayıt engellenmez
    try {
      await prisma.kvkkConsent.create({
        data: {
          tenantId: newTenantId,
          consentType: "REGISTRATION",
          ipAddress: meta?.ipAddress ?? null,
          userAgent: meta?.userAgent ?? null,
          version: "1.0",
        },
      });
    } catch (kvkkError) {
      console.warn("KVKK consent kaydedilemedi (migration bekliyor olabilir):", kvkkError);
    }

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
  } catch (error: any) {
    if (error?.type === "CredentialsSignin") {
      return { error: "E-posta veya şifre hatalı." };
    }
    if (error?.digest?.includes("NEXT_REDIRECT")) {
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
  } catch (error: any) {
    if (error?.type === "CredentialsSignin") {
      return { error: "Girdiğiniz E-posta veya şifre hatalı." };
    }
    if (error?.digest?.includes("NEXT_REDIRECT")) {
      throw error;
    }
    return { error: "Beklenmeyen bir kimlik doğrulama hatası oluştu." };
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
  } catch (error: any) {
    if (error?.type === "CredentialsSignin") {
      return { error: "Veritabanında bu plaka ve telefon numarası ile eşleşen bir araç kaydı bulunamadı." };
    }
    if (error?.digest?.includes("NEXT_REDIRECT")) {
      throw error; // Let Next.js handle redirect if redirect:true were used, but we use redirect:false.
    }
    return { error: "Beklenmeyen bir kimlik doğrulama hatası oluştu." };
  }
}
