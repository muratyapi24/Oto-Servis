/**
 * PayTR Ödeme Sağlayıcısı
 * Türkiye'nin yerel ödeme altyapısı ile entegrasyon.
 * Ortam değişkenleri: PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY, PAYTR_MERCHANT_SALT
 */

import crypto from "crypto";

// ---------------------------------------------------------------------------
// Tipler
// ---------------------------------------------------------------------------

export interface PayTRTokenOptions {
  email: string;
  paymentAmount: number; // kuruş cinsinden (100 TL = 10000)
  currency: "TL";
  testMode: "0" | "1";
  noInstallment: "0" | "1";
  maxInstallment: "0";
  userName: string;
  userAddress: string;
  userPhone: string;
  merchantOid: string; // invoiceId
  userBasket: string; // JSON encoded basket
  userIp: string;
  okUrl: string;
  failUrl: string;
  lang: "tr";
  timeoutLimit: "30";
}

export interface PayTRWebhookPayload {
  merchant_oid: string;
  status: "success" | "failed";
  total_amount: string;
  hash: string;
  failed_reason_code?: string;
  failed_reason_msg?: string;
}

// ---------------------------------------------------------------------------
// 4.2 PayTR iframe token oluştur
// ---------------------------------------------------------------------------

export async function createPayTRToken(
  options: PayTRTokenOptions
): Promise<{ token: string; iframeUrl: string }> {
  const merchantId = process.env.PAYTR_MERCHANT_ID;
  const merchantKey = process.env.PAYTR_MERCHANT_KEY;
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT;

  if (!merchantId || !merchantKey || !merchantSalt) {
    console.warn("[PAYTR] Merchant bilgileri eksik — simülasyon modu");
    return {
      token: `sim_paytr_${Date.now()}`,
      iframeUrl: "https://www.paytr.com/odeme/guvenli/sim_token",
    };
  }

  // Hash oluştur: HMAC-SHA256(merchantId + userIp + merchantOid + email + paymentAmount + currency + testMode + noInstallment + maxInstallment + merchantKey + merchantSalt)
  const hashStr = [
    merchantId,
    options.userIp,
    options.merchantOid,
    options.email,
    options.paymentAmount.toString(),
    options.currency,
    options.testMode,
    options.noInstallment,
    options.maxInstallment,
    merchantKey,
  ].join("");

  const paytrToken = crypto
    .createHmac("sha256", merchantSalt)
    .update(hashStr)
    .digest("base64");

  const formData = new URLSearchParams({
    merchant_id: merchantId,
    user_ip: options.userIp,
    merchant_oid: options.merchantOid,
    email: options.email,
    payment_amount: options.paymentAmount.toString(),
    paytr_token: paytrToken,
    user_basket: options.userBasket,
    debug_on: "0",
    no_installment: options.noInstallment,
    max_installment: options.maxInstallment,
    user_name: options.userName,
    user_address: options.userAddress,
    user_phone: options.userPhone,
    merchant_ok_url: options.okUrl,
    merchant_fail_url: options.failUrl,
    timeout_limit: options.timeoutLimit,
    currency: options.currency,
    test_mode: options.testMode,
    lang: options.lang,
  });

  try {
    const response = await fetch("https://www.paytr.com/odeme/api/get-token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const data = (await response.json()) as {
      status: string;
      token?: string;
      reason?: string;
    };

    if (data.status === "success" && data.token) {
      return {
        token: data.token,
        iframeUrl: `https://www.paytr.com/odeme/guvenli/${data.token}`,
      };
    }

    throw new Error(data.reason ?? "PayTR token alınamadı.");
  } catch (err) {
    console.error("[PAYTR] API hatası:", err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 4.2 PayTR webhook hash doğrulama
// ---------------------------------------------------------------------------

/**
 * PayTR webhook hash'ini doğrular.
 * Hash = HMAC-SHA256(merchantOid + merchantSalt + status + totalAmount, merchantKey)
 */
export function verifyPayTRWebhookHash(
  merchantOid: string,
  status: string,
  totalAmount: string,
  merchantKey: string,
  merchantSalt: string,
  hash: string
): boolean {
  if (!merchantOid || !status || !totalAmount || !merchantKey || !merchantSalt || !hash) {
    return false;
  }

  try {
    const hashStr = merchantOid + merchantSalt + status + totalAmount;
    const expectedHash = crypto
      .createHmac("sha256", merchantKey)
      .update(hashStr)
      .digest("base64");

    const hashBuffer = Buffer.from(hash, "base64");
    const expectedBuffer = Buffer.from(expectedHash, "base64");

    if (hashBuffer.length !== expectedBuffer.length) return false;

    return crypto.timingSafeEqual(hashBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
