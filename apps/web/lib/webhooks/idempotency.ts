import crypto from "crypto";
import { prisma } from "@repo/database";

export type WebhookProvider = "stripe" | "iyzico" | "paytr" | "whatsapp";

interface ReserveWebhookEventInput {
  provider: WebhookProvider;
  providerEventId: string;
  tenantId?: string | null;
  rawPayload: string;
}

interface ReserveWebhookEventResult {
  shouldProcess: boolean;
  duplicate: boolean;
  eventId?: string;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export function createRawPayloadHash(rawPayload: string): string {
  return crypto.createHash("sha256").update(rawPayload).digest("hex");
}

export async function reserveWebhookEvent({
  provider,
  providerEventId,
  tenantId,
  rawPayload,
}: ReserveWebhookEventInput): Promise<ReserveWebhookEventResult> {
  if (!providerEventId.trim()) {
    throw new Error("Webhook event id zorunludur.");
  }

  try {
    const event = await prisma.webhookEvent.create({
      data: {
        provider,
        providerEventId,
        tenantId: tenantId ?? null,
        rawPayloadHash: createRawPayloadHash(rawPayload),
        status: "RECEIVED",
      },
    });

    return { shouldProcess: true, duplicate: false, eventId: event.id };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { shouldProcess: false, duplicate: true };
    }
    throw error;
  }
}

export async function markWebhookEventProcessed(eventId: string): Promise<void> {
  await prisma.webhookEvent.update({
    where: { id: eventId },
    data: {
      status: "PROCESSED",
      processedAt: new Date(),
    },
  });
}

export async function markWebhookEventFailed(
  eventId: string | undefined,
  error: unknown
): Promise<void> {
  if (!eventId) return;

  await prisma.webhookEvent.update({
    where: { id: eventId },
    data: {
      status: "FAILED",
      errorMessage: error instanceof Error ? error.message : String(error),
    },
  });
}
