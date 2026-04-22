/**
 * POST /api/webhooks/whatsapp
 * Meta Cloud API WhatsApp webhook handler'ı.
 * X-Hub-Signature-256 imza doğrulaması yapılır.
 * delivered/read/failed durum güncellemeleri işlenir.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import * as Sentry from "@sentry/nextjs";
import crypto from "crypto";

// Meta Cloud API webhook doğrulama (GET)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.META_WHATSAPP_WEBHOOK_SECRET;

  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// Meta Cloud API webhook işleme (POST)
export async function POST(request: NextRequest) {
  let body = "";

  try {
    body = await request.text();

    // X-Hub-Signature-256 imza doğrulama
    const signature = request.headers.get("x-hub-signature-256") ?? "";
    const appSecret = process.env.META_WHATSAPP_ACCESS_TOKEN ?? "";

    if (appSecret && signature) {
      const expectedSignature = `sha256=${crypto
        .createHmac("sha256", appSecret)
        .update(body)
        .digest("hex")}`;

      if (signature !== expectedSignature) {
        Sentry.captureMessage("WhatsApp webhook imza doğrulama başarısız", {
          level: "warning",
        });
        return NextResponse.json({ received: true }, { status: 200 });
      }
    }

    const payload = JSON.parse(body) as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            statuses?: Array<{
              id: string;
              status: "delivered" | "read" | "failed";
              timestamp: string;
              errors?: Array<{ code: number; title: string }>;
            }>;
          };
        }>;
      }>;
    };

    // Durum güncellemelerini işle
    const statuses = payload.entry?.[0]?.changes?.[0]?.value?.statuses ?? [];

    for (const statusUpdate of statuses) {
      const { id: messageId, status } = statusUpdate;

      // Notification kaydını messageId ile bul ve güncelle
      const notification = await prisma.notification.findFirst({
        where: {
          metadata: {
            path: ["messageId"],
            equals: messageId,
          },
        },
      });

      if (notification) {
        let newStatus: "DELIVERED" | "READ" | "FAILED" = "DELIVERED";
        if (status === "read") newStatus = "READ";
        else if (status === "failed") newStatus = "FAILED";

        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: newStatus,
            metadata: {
              ...(notification.metadata as Record<string, unknown>),
              webhookStatus: status,
              webhookTimestamp: statusUpdate.timestamp,
              errors: statusUpdate.errors ?? null,
            },
          },
        });
      }
    }
  } catch (err) {
    Sentry.captureException(err, {
      tags: { module: "whatsapp-webhook" },
      extra: { body: body.slice(0, 500) },
    });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
