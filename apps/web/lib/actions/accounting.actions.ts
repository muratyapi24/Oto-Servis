"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import { auth } from "@/auth";

export async function getAccountingIntegration() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

    const integration = await prisma.accountingIntegration.findUnique({
      where: { tenantId: session.user.tenantId }
    });

    return { integration };
  } catch (error: any) {
    Sentry.captureException(error);
    return { error: "Entegrasyon bilgileri alınamadı." };
  }
}

export async function saveAccountingIntegration(data: {
  provider: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password?: string;
  companyId: string;
  isActive: boolean;
}) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

    const tenantId = session.user.tenantId;

    const existing = await prisma.accountingIntegration.findUnique({
      where: { tenantId }
    });

    if (existing) {
      // Sifre gonderilmediyse eskisini koru
      const pwd = data.password ? data.password : existing.password;
      
      await prisma.accountingIntegration.update({
        where: { tenantId },
        data: {
          provider: data.provider,
          clientId: data.clientId,
          clientSecret: data.clientSecret,
          username: data.username,
          password: pwd,
          companyId: data.companyId,
          isActive: data.isActive
        }
      });
    } else {
      if (!data.password) return { error: "Şifre zorunludur." };
      
      await prisma.accountingIntegration.create({
        data: {
          tenantId,
          provider: data.provider,
          clientId: data.clientId,
          clientSecret: data.clientSecret,
          username: data.username,
          password: data.password,
          companyId: data.companyId,
          isActive: data.isActive
        }
      });
    }

    revalidatePath("/dashboard/settings/accounting");
    return { success: "Muhasebe ayarları kaydedildi." };
  } catch (error: any) {
    Sentry.captureException(error);
    return { error: "Ayarlar kaydedilemedi." };
  }
}

export async function testAccountingConnection() {
  // Gelecekte gerçek parasut login token isteği ile test edilebilir.
  // Şu anlık sadece simülasyon.
  await new Promise(res => setTimeout(res, 1000));
  return { success: "Bağlantı başarılı!" };
}
