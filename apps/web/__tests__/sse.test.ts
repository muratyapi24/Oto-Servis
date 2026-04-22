import * as fc from "fast-check";
import { publishSSEEvent, subscribeSSEEvents, formatSSEMessage } from "../lib/sse";

describe("SSE Properties", () => {
  it("P6.1: Tenant A'nın event'leri Tenant B'ye iletilmemeli", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.string({ minLength: 1 }),
        async (tenantA, tenantB, payload) => {
          fc.pre(tenantA !== tenantB);

          const receivedByB: unknown[] = [];

          const unsubB = subscribeSSEEvents(tenantB, (event) => {
            receivedByB.push(event);
          });

          // Tenant A'ya event yayınla
          publishSSEEvent({
            type: "SERVICE_ORDER_UPDATED",
            payload: { data: payload },
            tenantId: tenantA,
          });

          // Kısa bekleme
          await new Promise((r) => setTimeout(r, 10));

          unsubB();

          // Tenant B hiçbir şey almamalı
          expect(receivedByB).toHaveLength(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  it("Tenant kendi event'lerini almalı", async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (tenantId) => {
        const received: unknown[] = [];
        const unsub = subscribeSSEEvents(tenantId, (e) => received.push(e));

        publishSSEEvent({
          type: "APPOINTMENT_CREATED",
          payload: { id: "test-123" },
          tenantId,
        });

        await new Promise((r) => setTimeout(r, 10));
        unsub();

        expect(received).toHaveLength(1);
      }),
      { numRuns: 10 }
    );
  });

  it("formatSSEMessage geçerli event-stream formatı üretmeli", () => {
    fc.assert(
      fc.property(fc.uuid(), fc.string(), (tenantId, data) => {
        const msg = formatSSEMessage({
          type: "SERVICE_ORDER_UPDATED",
          payload: { data },
          tenantId,
        });
        expect(msg).toMatch(/^data: /);
        expect(msg).toMatch(/\n\n$/);
        const json = JSON.parse(msg.replace("data: ", "").trim());
        expect(json.type).toBe("SERVICE_ORDER_UPDATED");
      })
    );
  });
});
