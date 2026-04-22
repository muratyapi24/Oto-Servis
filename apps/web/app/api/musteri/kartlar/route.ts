import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    // Stripe API key yoksa boş liste döndür
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ cards: [] });
    }

    // Müşterinin Stripe customer ID'sini bul
    const customer = await prisma.customer.findFirst({
      where: { tenantId: session.user.tenantId ?? undefined },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json({ cards: [] });
    }

    // Stripe'tan kayıtlı kartları çek
    try {
      const { getStripe } = await import("@/lib/stripe");
      const stripe = await getStripe();

      // Stripe customer ID'yi metadata'dan bul (gerçek uygulamada Customer modelinde stripeCustomerId alanı olur)
      // Şimdilik boş liste döndürüyoruz — Stripe entegrasyonu env key gerektirir
      return NextResponse.json({ cards: [] });
    } catch {
      return NextResponse.json({ cards: [] });
    }
  } catch (err) {
    console.error("Kartlar API hatası:", err);
    return NextResponse.json({ error: "Kartlar yüklenemedi." }, { status: 500 });
  }
}
