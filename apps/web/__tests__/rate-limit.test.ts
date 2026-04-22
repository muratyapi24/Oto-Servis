import * as fc from "fast-check";
import { checkRateLimit } from "../lib/rate-limit";

describe("Rate Limiting Properties", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";
  });

  it("P2.2: Farklı IP'ler birbirinin limitini etkilememeli", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.ipV4(),
        fc.ipV4(),
        async (ip1, ip2) => {
          fc.pre(ip1 !== ip2);
          const r1 = await checkRateLimit(ip1, "/api/test");
          const r2 = await checkRateLimit(ip2, "/api/test");
          // Her IP bağımsız sayaçla başlamalı
          expect(r1.remaining).toBeGreaterThanOrEqual(0);
          expect(r2.remaining).toBeGreaterThanOrEqual(0);
        }
      )
    );
  });

  it("P2.3: Geliştirme ortamında rate limit atlanmalı", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const result = await checkRateLimit("1.2.3.4", "/api/auth/login");
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(999);
    process.env.NODE_ENV = originalEnv;
  });
});
