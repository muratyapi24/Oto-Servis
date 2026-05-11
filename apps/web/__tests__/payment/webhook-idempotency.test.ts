jest.mock("@repo/database", () => ({
  prisma: {
    webhookEvent: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from "@repo/database";
import {
  createRawPayloadHash,
  markWebhookEventProcessed,
  reserveWebhookEvent,
} from "@/lib/webhooks/idempotency";

const webhookEvent = prisma.webhookEvent as unknown as {
  create: jest.Mock;
  update: jest.Mock;
};

describe("webhook idempotency ledger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates stable sha256 hashes for raw payloads", () => {
    expect(createRawPayloadHash("status=success&paymentId=pay-1")).toBe(
      createRawPayloadHash("status=success&paymentId=pay-1")
    );
    expect(createRawPayloadHash("status=success&paymentId=pay-1")).not.toBe(
      createRawPayloadHash("status=success&paymentId=pay-2")
    );
  });

  it("reserves a first-seen provider event before processing", async () => {
    webhookEvent.create.mockResolvedValue({
      id: "evt_ledger_1",
      provider: "iyzico",
      providerEventId: "pay-1",
      status: "RECEIVED",
    });

    const result = await reserveWebhookEvent({
      provider: "iyzico",
      providerEventId: "pay-1",
      tenantId: "tenant-1",
      rawPayload: "status=success&paymentId=pay-1",
    });

    expect(result.shouldProcess).toBe(true);
    expect(webhookEvent.create).toHaveBeenCalledWith({
      data: {
        provider: "iyzico",
        providerEventId: "pay-1",
        tenantId: "tenant-1",
        rawPayloadHash: createRawPayloadHash("status=success&paymentId=pay-1"),
        status: "RECEIVED",
      },
    });
  });

  it("rejects replayed provider events without reprocessing", async () => {
    webhookEvent.create.mockRejectedValue({
      code: "P2002",
      meta: { target: ["provider", "providerEventId"] },
    });

    const result = await reserveWebhookEvent({
      provider: "stripe",
      providerEventId: "evt_123",
      rawPayload: "{\"id\":\"evt_123\"}",
    });

    expect(result.shouldProcess).toBe(false);
    expect(result.duplicate).toBe(true);
  });

  it("marks a reserved event as processed after successful handling", async () => {
    webhookEvent.update.mockResolvedValue({
      id: "evt_ledger_1",
      status: "PROCESSED",
    });

    await markWebhookEventProcessed("evt_ledger_1");

    expect(webhookEvent.update).toHaveBeenCalledWith({
      where: { id: "evt_ledger_1" },
      data: {
        status: "PROCESSED",
        processedAt: expect.any(Date),
      },
    });
  });
});
