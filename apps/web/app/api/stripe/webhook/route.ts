import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { STRIPE_WEBHOOK_SECRET, getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !STRIPE_WEBHOOK_SECRET) {
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({ received: true });
    }
    await prisma.auditLog.create({
      data: { level: "WARN", module: "STRIPE-WEBHOOK", message: "Webhook imzası doğrulanamadı" },
    });
    return NextResponse.json({ error: "Geçersiz imza" }, { status: 400 });
  }

  let event: any;
  try {
    const stripe = await getStripe();
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    await prisma.auditLog.create({
      data: {
        level: "ERROR",
        module: "STRIPE-WEBHOOK",
        message: `İmza doğrulama hatası: ${err.message}`,
      },
    });
    return NextResponse.json({ error: "Webhook imzası geçersiz" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        const { tenantId, planId } = s.metadata ?? {};
        if (tenantId && planId) {
          const existing = await prisma.subscription.findUnique({ where: { tenantId } });
          const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          if (existing) {
            await prisma.subscription.update({
              where: { tenantId },
              data: {
                status: "ACTIVE",
                stripeSubscriptionId: s.subscription,
                currentPeriodStart: new Date(),
                currentPeriodEnd: periodEnd,
              },
            });
          } else {
            await prisma.subscription.create({
              data: {
                tenantId,
                planId,
                status: "ACTIVE",
                startDate: new Date(),
                stripeSubscriptionId: s.subscription,
                currentPeriodStart: new Date(),
                currentPeriodEnd: periodEnd,
              },
            });
          }
        }
        break;
      }
      case "invoice.payment_succeeded": {
        const inv = event.data.object;
        if (inv.subscription) {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: inv.subscription },
            data: {
              status: "ACTIVE",
              currentPeriodStart: new Date(inv.period_start * 1000),
              currentPeriodEnd: new Date(inv.period_end * 1000),
            },
          });
        }
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object;
        if (inv.subscription) {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: inv.subscription },
            data: { status: "PAST_DUE" },
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: "CANCELLED", cancelledAt: new Date() },
        });
        break;
      }
    }
  } catch (err: any) {
    console.error("Webhook işleme hatası:", err);
    return NextResponse.json({ error: "İşleme hatası" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
