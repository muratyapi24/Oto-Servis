/**
 * POST /api/webhooks/iyzico-subscription
 * iyzico abonelik ödeme callback handler'ı.
 * Pricing sayfasındaki "Satın Al" akışından gelen ödemeleri işler.
 */

import { NextRequest, NextResponse } from "next/server";
import { activateSubscription } from "@/lib/actions/subscription.actions";
import { verifyIyzicoWebhookSignature } from "@/lib/payment-providers/iyzico";
import {
  markWebhookEventFailed,
  markWebhookEventProcessed,
  reserveWebhookEvent,
} from "@/lib/webhooks/idempotency";
import * as Sentry from "@sentry/nextjs";

const FAIL_REDIRECT = "/dashboard/settings/billing?payment=failed";
const SUCCESS_REDIRECT = "/dashboard/settings/billing?payment=success";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);

    // HMAC imza doğrulama (iyzico production webhook'ları için)
    const secretKey = process.env.IYZICO_SECRET_KEY;
    const incomingSignature = request.headers.get("x-iyz-signature");
    if (secretKey && incomingSignature) {
      const valid = verifyIyzicoWebhookSignature(body, incomingSignature, secretKey);
      if (!valid) {
        Sentry.captureMessage("iyzico-subscription webhook: imza doğrulama başarısız", {
          extra: { signature: incomingSignature },
        });
        return NextResponse.json({ error: "invalid signature" }, { status: 401 });
      }
    }

    const status = params.get("status");
    const basketId = request.nextUrl.searchParams.get("basketId") ?? params.get("basketId") ?? "";
    const planSlug = request.nextUrl.searchParams.get("planSlug") ?? params.get("planSlug") ?? "";
    const billing = (
      request.nextUrl.searchParams.get("billing") ?? params.get("billing") ?? "monthly"
    ) as "monthly" | "yearly";
    const paymentId = params.get("paymentId") ?? params.get("token") ?? "";

    if (status !== "success" || !basketId || !planSlug) {
      return NextResponse.redirect(new URL(FAIL_REDIRECT, request.nextUrl.origin));
    }

    // basketId formatı: sub-{tenantId}-{timestamp}
    const parts = basketId.split("-");
    // UUID 5 segment, timestamp 1 segment; middle segments = UUID
    const tenantId = parts.slice(1, -1).join("-");

    if (!tenantId) {
      Sentry.captureMessage("iyzico-subscription webhook: geçersiz basketId", { extra: { basketId } });
      return NextResponse.redirect(new URL(FAIL_REDIRECT, request.nextUrl.origin));
    }

    const reservedEvent = await reserveWebhookEvent({
      provider: "iyzico",
      providerEventId: paymentId || basketId,
      tenantId,
      rawPayload: body,
    });

    if (!reservedEvent.shouldProcess) {
      return NextResponse.redirect(new URL(SUCCESS_REDIRECT, request.nextUrl.origin));
    }

    const result = await activateSubscription(tenantId, planSlug, billing, paymentId);
    if (!result.success) {
      await markWebhookEventFailed(reservedEvent.eventId, result.error ?? "activateSubscription başarısız");
      Sentry.captureMessage("activateSubscription başarısız", {
        extra: { tenantId, planSlug, error: result.error },
      });
      return NextResponse.redirect(new URL(FAIL_REDIRECT, request.nextUrl.origin));
    }

    await markWebhookEventProcessed(reservedEvent.eventId!);
    return NextResponse.redirect(new URL(SUCCESS_REDIRECT, request.nextUrl.origin));
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: "webhook error" }, { status: 500 });
  }
}

// iyzico form callback GET desteği (bazı sağlayıcılar GET kullanır)
export async function GET(request: NextRequest) {
  return POST(request);
}
