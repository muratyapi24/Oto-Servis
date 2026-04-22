/**
 * GET/PUT /api/m/notification-preferences
 * Müşteri bildirim tercihleri API'si.
 * Kimlik doğrulama zorunlu.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  // Müşteri ID'sini session'dan al (müşteri portalı için)
  const customerId = (session.user as any).customerId;
  const tenantId = (session.user as any).tenantId;

  if (!customerId || !tenantId) {
    return NextResponse.json({ error: "Müşteri bilgisi bulunamadı" }, { status: 403 });
  }

  const preference = await prisma.customerNotificationPreference.findFirst({
    where: { tenantId, customerId },
  });

  return NextResponse.json({
    preference: preference ?? {
      smsEnabled: true,
      whatsappEnabled: false,
      emailEnabled: true,
      preferredChannel: "SMS",
    },
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const customerId = (session.user as any).customerId;
  const tenantId = (session.user as any).tenantId;

  if (!customerId || !tenantId) {
    return NextResponse.json({ error: "Müşteri bilgisi bulunamadı" }, { status: 403 });
  }

  const body = await request.json();
  const { smsEnabled, whatsappEnabled, emailEnabled, preferredChannel } = body;

  // WhatsApp etkinleştirmede telefon numarası doğrulaması
  if (whatsappEnabled) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      select: { phone: true },
    });

    if (!customer?.phone) {
      return NextResponse.json(
        { success: false, error: "WhatsApp etkinleştirmek için telefon numarası gereklidir." },
        { status: 400 }
      );
    }
  }

  await prisma.customerNotificationPreference.upsert({
    where: { customerId },
    create: {
      tenantId,
      customerId,
      smsEnabled: smsEnabled ?? true,
      whatsappEnabled: whatsappEnabled ?? false,
      emailEnabled: emailEnabled ?? true,
      preferredChannel: preferredChannel ?? "SMS",
    },
    update: {
      smsEnabled: smsEnabled ?? true,
      whatsappEnabled: whatsappEnabled ?? false,
      emailEnabled: emailEnabled ?? true,
      preferredChannel: preferredChannel ?? "SMS",
    },
  });

  return NextResponse.json({ success: true });
}
