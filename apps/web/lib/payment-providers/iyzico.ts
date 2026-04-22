/**
 * iyzico Ödeme Sağlayıcısı
 * Türkiye'nin önde gelen ödeme altyapısı ile entegrasyon.
 * Ortam değişkenleri: IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_BASE_URL
 */

import crypto from "crypto";

const IYZICO_BASE_URL =
  process.env.IYZICO_BASE_URL ?? "https://sandbox.iyzipay.com";

// ---------------------------------------------------------------------------
// Tipler
// ---------------------------------------------------------------------------

export interface IyzicoPaymentFormOptions {
  price: string;
  paidPrice: string;
  currency: string;
  basketId: string;
  callbackUrl: string;
  buyer: {
    id: string;
    name: string;
    surname: string;
    email: string;
    identityNumber: string;
    registrationAddress: string;
    city: string;
    country: string;
    ip: string;
  };
  billingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
  };
  basketItems: Array<{
    id: string;
    name: string;
    category1: string;
    itemType: "PHYSICAL" | "VIRTUAL";
    price: string;
  }>;
}

export interface IyzicoPaymentFormResult {
  status: "success" | "failure";
  checkoutFormContent?: string;
  token?: string;
  errorMessage?: string;
}

export interface IyzicoWebhookPayload {
  status: "SUCCESS" | "FAILURE";
  paymentId: string;
  basketId: string;
  paidPrice: string;
  currency: string;
  errorCode?: string;
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// iyzico Authorization header üretici
// ---------------------------------------------------------------------------

function generateIyzicoAuthHeader(
  apiKey: string,
  secretKey: string,
  randomString: string,
  requestBody: string
): string {
  const hash = crypto
    .createHmac("sha256", secretKey)
    .update(apiKey + randomString + requestBody)
    .digest("base64");

  const authorizationString = `apiKey:${apiKey}&randomKey:${randomString}&signature:${hash}`;
  return `IYZWSv2 ${Buffer.from(authorizationString).toString("base64")}`;
}

// ---------------------------------------------------------------------------
// 4.1 iyzico ödeme formu oluştur
// ---------------------------------------------------------------------------

export async function createIyzicoPaymentForm(
  options: IyzicoPaymentFormOptions
): Promise<IyzicoPaymentFormResult> {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;

  if (!apiKey || !secretKey) {
    console.warn("[IYZICO] API anahtarları eksik — simülasyon modu");
    return {
      status: "success",
      checkoutFormContent: "<div>iyzico simülasyon formu</div>",
      token: `sim_${Date.now()}`,
    };
  }

  const randomString = Math.random().toString(36).substring(2, 15);
  const requestBody = JSON.stringify({
    locale: "tr",
    conversationId: options.basketId,
    price: options.price,
    paidPrice: options.paidPrice,
    currency: options.currency,
    basketId: options.basketId,
    paymentGroup: "PRODUCT",
    callbackUrl: options.callbackUrl,
    enabledInstallments: [1, 2, 3, 6, 9],
    buyer: options.buyer,
    billingAddress: options.billingAddress,
    basketItems: options.basketItems,
  });

  const authHeader = generateIyzicoAuthHeader(
    apiKey,
    secretKey,
    randomString,
    requestBody
  );

  try {
    const response = await fetch(
      `${IYZICO_BASE_URL}/payment/iyzipos/checkoutform/initialize/auth/ecom`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: requestBody,
      }
    );

    const data = (await response.json()) as {
      status: string;
      checkoutFormContent?: string;
      token?: string;
      errorMessage?: string;
    };

    if (data.status === "success") {
      return {
        status: "success",
        checkoutFormContent: data.checkoutFormContent,
        token: data.token,
      };
    }

    return {
      status: "failure",
      errorMessage: data.errorMessage ?? "iyzico ödeme formu oluşturulamadı.",
    };
  } catch (err) {
    console.error("[IYZICO] API hatası:", err);
    return {
      status: "failure",
      errorMessage: "iyzico API bağlantı hatası.",
    };
  }
}

// ---------------------------------------------------------------------------
// 4.1 HMAC-SHA256 webhook imza doğrulama
// ---------------------------------------------------------------------------

/**
 * iyzico webhook imzasını doğrular.
 * iyzico, webhook payload'ını HMAC-SHA256 ile imzalar.
 *
 * @param payload   - Ham webhook body string'i
 * @param signature - iyzico'dan gelen imza (Base64)
 * @param secretKey - iyzico secret key
 */
export function verifyIyzicoWebhookSignature(
  payload: string,
  signature: string,
  secretKey: string
): boolean {
  if (!payload || !signature || !secretKey) return false;

  try {
    const expectedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(payload)
      .digest("base64");

    // Timing-safe karşılaştırma
    const sigBuffer = Buffer.from(signature, "base64");
    const expectedBuffer = Buffer.from(expectedSignature, "base64");

    if (sigBuffer.length !== expectedBuffer.length) return false;

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 4.1 Webhook payload ayrıştırma
// ---------------------------------------------------------------------------

export function parseIyzicoWebhookPayload(body: string): IyzicoWebhookPayload {
  const params = new URLSearchParams(body);

  return {
    status: (params.get("status") ?? "FAILURE") as "SUCCESS" | "FAILURE",
    paymentId: params.get("paymentId") ?? "",
    basketId: params.get("basketId") ?? "",
    paidPrice: params.get("paidPrice") ?? "0",
    currency: params.get("currency") ?? "TRY",
    errorCode: params.get("errorCode") ?? undefined,
    errorMessage: params.get("errorMessage") ?? undefined,
  };
}
