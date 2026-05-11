import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { STRIPE_WEBHOOK_SECRET, getStripe } from "@/lib/stripe";
import {
  markWebhookEventFailed,
  markWebhookEventProcessed,
  reserveWebhookEvent,
} from "@/lib/webhooks/idempotency";

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
  let stripe: Awaited<ReturnType<typeof getStripe>>;
  try {
    stripe = await getStripe();
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    await prisma.auditLog.create({
      data: {
        level: "ERROR",
        module: "STRIPE-WEBHOOK",
        message: `İmza doğrulama hatası: ${(err instanceof Error ? err.message : String(err))}`,
      },
    });
    return NextResponse.json({ error: "Webhook imzası geçersiz" }, { status: 400 });
  }

  const reservedEvent = await reserveWebhookEvent({
    provider: "stripe",
    providerEventId: event.id,
    rawPayload: body,
  });

  if (!reservedEvent.shouldProcess) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        const { tenantId, planId } = s.metadata ?? {};
        if (tenantId && planId) {
          const existing = await prisma.subscription.findUnique({ where: { tenantId } });
          const subscription =
            s.subscription ? await stripe.subscriptions.retrieve(String(s.subscription)) : null;
          const periodStart = subscription?.current_period_start
            ? new Date(subscription.current_period_start * 1000)
            : new Date();
          const periodEnd = subscription?.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : null;
          if (existing) {
            await prisma.subscription.update({
              where: { tenantId },
              data: {
                status: "ACTIVE",
                stripeSubscriptionId: s.subscription,
                currentPeriodStart: periodStart,
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
                currentPeriodStart: periodStart,
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
    await markWebhookEventProcessed(reservedEvent.eventId!);
  } catch (err) {
    await markWebhookEventFailed(reservedEvent.eventId, err);
    console.error("Webhook işleme hatası:", err);
    return NextResponse.json({ error: "İşleme hatası" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
