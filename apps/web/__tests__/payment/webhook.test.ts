// Feature: invoice-payment-accounting
// Birim testleri: Webhook imza doğrulama

import crypto from "crypto";
import {
  verifyIyzicoWebhookSignature,
  parseIyzicoWebhookPayload,
} from "@/lib/payment-providers/iyzico";
import { verifyPayTRWebhookHash } from "@/lib/payment-providers/paytr";
import * as fc from "fast-check";

// ---------------------------------------------------------------------------
// verifyIyzicoWebhookSignature — Birim testleri
// ---------------------------------------------------------------------------

describe("verifyIyzicoWebhookSignature", () => {
  const secretKey = "test-secret-key-12345";

  function createValidSignature(payload: string, key: string): string {
    return crypto.createHmac("sha256", key).update(payload).digest("base64");
  }

  it("doğru imzayla true döner", () => {
    const payload = "status=SUCCESS&paymentId=123&basketId=inv-001";
    const signature = createValidSignature(payload, secretKey);
    expect(verifyIyzicoWebhookSignature(payload, signature, secretKey)).toBe(true);
  });

  it("yanlış imzayla false döner", () => {
    const payload = "status=SUCCESS&paymentId=123&basketId=inv-001";
    const wrongSignature = createValidSignature(payload, "wrong-key");
    expect(verifyIyzicoWebhookSignature(payload, wrongSignature, secretKey)).toBe(false);
  });

  it("değiştirilmiş payload ile false döner", () => {
    const payload = "status=SUCCESS&paymentId=123&basketId=inv-001";
    const signature = createValidSignature(payload, secretKey);
    const tamperedPayload = "status=SUCCESS&paymentId=999&basketId=inv-001";
    expect(verifyIyzicoWebhookSignature(tamperedPayload, signature, secretKey)).toBe(false);
  });

  it("boş payload ile false döner", () => {
    expect(verifyIyzicoWebhookSignature("", "sig", secretKey)).toBe(false);
  });

  it("boş imzayla false döner", () => {
    expect(verifyIyzicoWebhookSignature("payload", "", secretKey)).toBe(false);
  });

  it("boş secret key ile false döner", () => {
    expect(verifyIyzicoWebhookSignature("payload", "sig", "")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseIyzicoWebhookPayload — Birim testleri
// ---------------------------------------------------------------------------

describe("parseIyzicoWebhookPayload", () => {
  it("başarılı ödeme payload'ını doğru ayrıştırır", () => {
    const body = "status=SUCCESS&paymentId=pay123&basketId=inv-001&paidPrice=100.00&currency=TRY";
    const result = parseIyzicoWebhookPayload(body);
    expect(result.status).toBe("SUCCESS");
    expect(result.paymentId).toBe("pay123");
    expect(result.basketId).toBe("inv-001");
    expect(result.paidPrice).toBe("100.00");
    expect(result.currency).toBe("TRY");
  });

  it("başarısız ödeme payload'ını doğru ayrıştırır", () => {
    const body = "status=FAILURE&paymentId=&basketId=inv-002&paidPrice=0&errorCode=10051&errorMessage=Insufficient+funds";
    const result = parseIyzicoWebhookPayload(body);
    expect(result.status).toBe("FAILURE");
    expect(result.errorCode).toBe("10051");
  });
});

// ---------------------------------------------------------------------------
// verifyPayTRWebhookHash — Birim testleri
// ---------------------------------------------------------------------------

describe("verifyPayTRWebhookHash", () => {
  const merchantKey = "paytr-merchant-key";
  const merchantSalt = "paytr-merchant-salt";

  function createValidHash(
    merchantOid: string,
    status: string,
    totalAmount: string,
    key: string,
    salt: string
  ): string {
    const hashStr = merchantOid + salt + status + totalAmount;
    return crypto.createHmac("sha256", key).update(hashStr).digest("base64");
  }

  it("doğru hash ile true döner", () => {
    const merchantOid = "inv-001";
    const status = "success";
    const totalAmount = "10000";
    const hash = createValidHash(merchantOid, status, totalAmount, merchantKey, merchantSalt);
    expect(
      verifyPayTRWebhookHash(merchantOid, status, totalAmount, merchantKey, merchantSalt, hash)
    ).toBe(true);
  });

  it("yanlış hash ile false döner", () => {
    const merchantOid = "inv-001";
    const status = "success";
    const totalAmount = "10000";
    const wrongHash = createValidHash(merchantOid, status, totalAmount, "wrong-key", merchantSalt);
    expect(
      verifyPayTRWebhookHash(merchantOid, status, totalAmount, merchantKey, merchantSalt, wrongHash)
    ).toBe(false);
  });

  it("değiştirilmiş tutar ile false döner", () => {
    const merchantOid = "inv-001";
    const status = "success";
    const totalAmount = "10000";
    const hash = createValidHash(merchantOid, status, totalAmount, merchantKey, merchantSalt);
    expect(
      verifyPayTRWebhookHash(merchantOid, status, "99999", merchantKey, merchantSalt, hash)
    ).toBe(false);
  });

  it("boş parametrelerle false döner", () => {
    expect(verifyPayTRWebhookHash("", "success", "10000", merchantKey, merchantSalt, "hash")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Property 8: Webhook imza doğrulaması tutarlı olmalı (fast-check)
// ---------------------------------------------------------------------------

describe("Feature: invoice-payment-accounting, Property 8: Webhook imza doğrulaması", () => {
  it("doğru imzayla imzalanmış her payload kabul edilmeli", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),  // payload
        fc.string({ minLength: 8, maxLength: 64 }),   // secretKey
        (payload, secretKey) => {
          const signature = crypto
            .createHmac("sha256", secretKey)
            .update(payload)
            .digest("base64");
          return verifyIyzicoWebhookSignature(payload, signature, secretKey) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("yanlış key ile imzalanmış payload reddedilmeli", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.string({ minLength: 8, maxLength: 64 }),
        fc.string({ minLength: 8, maxLength: 64 }),
        (payload, correctKey, wrongKey) => {
          fc.pre(correctKey !== wrongKey);
          const signature = crypto
            .createHmac("sha256", wrongKey)
            .update(payload)
            .digest("base64");
          return verifyIyzicoWebhookSignature(payload, signature, correctKey) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("PayTR: doğru hash ile imzalanmış her payload kabul edilmeli", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),  // merchantOid
        fc.constantFrom("success", "failed"),         // status
        fc.integer({ min: 100, max: 999999 }).map(String), // totalAmount
        fc.string({ minLength: 8, maxLength: 64 }),  // merchantKey
        fc.string({ minLength: 8, maxLength: 64 }),  // merchantSalt
        (merchantOid, status, totalAmount, merchantKey, merchantSalt) => {
          const hashStr = merchantOid + merchantSalt + status + totalAmount;
          const hash = crypto
            .createHmac("sha256", merchantKey)
            .update(hashStr)
            .digest("base64");
          return verifyPayTRWebhookHash(
            merchantOid, status, totalAmount, merchantKey, merchantSalt, hash
          ) === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
