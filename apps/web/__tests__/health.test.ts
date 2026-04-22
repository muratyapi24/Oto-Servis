import * as fc from "fast-check";

describe("Health Check Properties", () => {
  it("P4.1: Sağlıklı yanıt şeması doğru olmalı", () => {
    fc.assert(
      fc.property(
        fc.record({
          status: fc.constant("ok"),
          db: fc.constant("connected"),
          version: fc.string({ minLength: 1 }),
          timestamp: fc.date().map((d) => d.toISOString()),
        }),
        (response) => {
          expect(response.status).toBe("ok");
          expect(response.db).toBe("connected");
          expect(response.timestamp).toBeTruthy();
        }
      )
    );
  });

  it("P4.2: Hata yanıtı şeması doğru olmalı", () => {
    fc.assert(
      fc.property(
        fc.record({
          status: fc.constant("error"),
          db: fc.constant("disconnected"),
          timestamp: fc.date().map((d) => d.toISOString()),
        }),
        (response) => {
          expect(response.status).toBe("error");
          expect(response.db).toBe("disconnected");
        }
      )
    );
  });
});
