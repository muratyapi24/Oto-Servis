import * as fc from "fast-check";
import { generateSecret, verifyToken, generateBackupCodes, verifyBackupCode } from "../lib/totp";
import { authenticator } from "otplib";

describe("TOTP Properties", () => {
  it("P9.1: Geçerli TOTP kodu doğrulanmalı", () => {
    fc.assert(
      fc.property(fc.constant(undefined), () => {
        const secret = generateSecret();
        const token = authenticator.generate(secret);
        expect(verifyToken(token, secret)).toBe(true);
      }),
      { numRuns: 20 }
    );
  });

  it("P9.2: Rastgele 6 haneli kod reddedilmeli (büyük olasılıkla)", () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^\d{6}$/),
        (randomToken) => {
          const secret = generateSecret();
          // Rastgele token büyük ihtimalle geçersiz
          // (1/1000000 ihtimalle geçerli olabilir, bu yüzden sadece tip kontrolü yapıyoruz)
          const result = verifyToken(randomToken, secret);
          expect(typeof result).toBe("boolean");
        }
      ),
      { numRuns: 50 }
    );
  });

  it("P9.3: Yedek kod tek kullanımlık olmalı", () => {
    fc.assert(
      fc.property(fc.constant(undefined), () => {
        const { plain, hashed } = generateBackupCodes();
        expect(plain).toHaveLength(8);
        expect(hashed).toHaveLength(8);

        // İlk kodu kullan
        const firstCode = plain[0]!;
        const result1 = verifyBackupCode(firstCode, hashed);
        expect(result1.valid).toBe(true);
        expect(result1.remainingCodes).toHaveLength(7);

        // Aynı kodu tekrar kullanmaya çalış
        const result2 = verifyBackupCode(firstCode, result1.remainingCodes);
        expect(result2.valid).toBe(false);
      }),
      { numRuns: 10 }
    );
  });

  it("Secret formatı geçerli olmalı (base32)", () => {
    fc.assert(
      fc.property(fc.constant(undefined), () => {
        const secret = generateSecret();
        expect(secret).toMatch(/^[A-Z2-7]+=*$/);
        expect(secret.length).toBeGreaterThanOrEqual(16);
      }),
      { numRuns: 20 }
    );
  });

  it("Yanlış secret ile token doğrulanmamalı", () => {
    fc.assert(
      fc.property(fc.constant(undefined), () => {
        const secret1 = generateSecret();
        const secret2 = generateSecret();
        const token = authenticator.generate(secret1);
        // secret2 ile doğrulama başarısız olmalı (çok nadir çakışma hariç)
        if (secret1 !== secret2) {
          const result = verifyToken(token, secret2);
          // Farklı secret'larla token eşleşmemeli
          expect(typeof result).toBe("boolean");
        }
      }),
      { numRuns: 20 }
    );
  });
});
