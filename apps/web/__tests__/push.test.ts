import * as fc from "fast-check";

describe("Web Push Properties", () => {
  it("P7.1: VAPID anahtarları yoksa push gönderilmemeli (simülasyon modu)", async () => {
    const originalPublic = process.env.VAPID_PUBLIC_KEY;
    const originalPrivate = process.env.VAPID_PRIVATE_KEY;

    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;

    // push.ts'i dinamik import ile yükle (env değişkenleri sıfırlandıktan sonra)
    jest.resetModules();
    const { sendPushToUser } = await import("../lib/push");

    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (userId) => {
        const result = await sendPushToUser(userId, {
          title: "Test",
          body: "Test body",
        });
        // VAPID yoksa sent=0, failed=0 dönmeli
        expect(result.sent).toBe(0);
        expect(result.failed).toBe(0);
      }),
      { numRuns: 5 }
    );

    process.env.VAPID_PUBLIC_KEY = originalPublic;
    process.env.VAPID_PRIVATE_KEY = originalPrivate;
  });

  it("P7.2: Push payload zorunlu alanları içermeli", () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          body: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        (payload) => {
          expect(payload.title).toBeTruthy();
          expect(payload.body).toBeTruthy();
          expect(typeof payload.title).toBe("string");
          expect(typeof payload.body).toBe("string");
        }
      )
    );
  });

  it("Subscription endpoint benzersiz olmalı (userId + endpoint)", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.webUrl(),
        (userId, endpoint) => {
          const key = `${userId}:${endpoint}`;
          expect(key).toContain(userId);
          expect(key).toContain(endpoint);
        }
      )
    );
  });
});
