// Feature: missing-features-roadmap, Property 5: Onay Token Benzersizliği

import * as fc from "fast-check";
import { randomBytes } from "crypto";

/**
 * Property 5: Onay token benzersizliği
 * Her üretilen token benzersiz olmalı
 */
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

describe("Property 5: Onay token benzersizliği", () => {
  it("farklı çağrılarda üretilen tokenlar birbirinden farklı olmalı", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 20 }),
        (count) => {
          const tokens = Array.from({ length: count }, generateToken);
          const uniqueTokens = new Set(tokens);
          return uniqueTokens.size === tokens.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("token 64 karakter hex formatında olmalı", () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const token = generateToken();
          return token.length === 64 && /^[0-9a-f]+$/.test(token);
        }
      ),
      { numRuns: 100 }
    );
  });
});
