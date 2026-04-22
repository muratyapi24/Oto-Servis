import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const { planId, billingCycle } = (await req.json()) as {
    planId: string;
    billingCycle: "monthly" | "yearly";
  };

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) return NextResponse.json({ error: "Plan bulunamadı" }, { status: 404 });

  const price =
    billingCycle === "yearly"
      ? (plan.priceYearly ?? plan.priceMonthly * 12)
      : plan.priceMonthly;
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ url: `${baseUrl}/dashboard/settings?checkout=simulated` });
  }

  const stripe = await getStripe();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: plan.currency.toLowerCase(),
          product_data: {
            name: plan.name,
            description: plan.description ?? undefined,
          },
          unit_amount: Math.round(price * 100),
          recurring: { interval: billingCycle === "yearly" ? "year" : "month" },
        },
        quantity: 1,
      },
    ],
    metadata: { tenantId: session.user.tenantId, planId },
    success_url: `${baseUrl}/dashboard/settings?checkout=success`,
    cancel_url: `${baseUrl}/dashboard/settings?checkout=cancelled`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
