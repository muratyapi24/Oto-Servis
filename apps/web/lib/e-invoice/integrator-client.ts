/**
 * GİB e-Fatura Entegratörü API İstemcisi
 * Özel entegratör (Uyumsoft, Logo e-Fatura vb.) üzerinden GİB ile iletişim kurar.
 * Ortam değişkenleri: E_INVOICE_INTEGRATOR_URL, E_INVOICE_USERNAME, E_INVOICE_PASSWORD
 */

import * as Sentry from "@sentry/nextjs";

// ---------------------------------------------------------------------------
// Tipler
// ---------------------------------------------------------------------------

export interface EInvoiceSendResult {
  success: boolean;
  uuid?: string;
  ettn?: string;
  errorMessage?: string;
}

export interface EInvoiceStatusResult {
  success: boolean;
  status?: "PENDING" | "SENT" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  errorMessage?: string;
}

export interface EInvoiceCancelResult {
  success: boolean;
  errorMessage?: string;
}

export interface EInvoiceEligibilityResult {
  isEligible: boolean;
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// Token yönetimi (process-level cache)
// ---------------------------------------------------------------------------

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getIntegratorToken(): Promise<string | null> {
  const baseUrl = process.env.E_INVOICE_INTEGRATOR_URL;
  const username = process.env.E_INVOICE_USERNAME;
  const password = process.env.E_INVOICE_PASSWORD;

  if (!baseUrl || !username || !password) {
    console.warn("[E-INVOICE] Entegratör bilgileri eksik — simülasyon modu");
    return null;
  }

  // Token geçerliyse cache'den döndür (60 saniye önceden yenile)
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  try {
    const response = await fetch(`${baseUrl}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error(`Token alınamadı: HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      token: string;
      expiresIn?: number;
    };

    cachedToken = data.token;
    tokenExpiresAt = Date.now() + (data.expiresIn ?? 3600) * 1000;

    return cachedToken;
  } catch (err) {
    Sentry.captureException(err, { tags: { module: "e-invoice-token" } });
    console.error("[E-INVOICE] Token yenileme hatası:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 5.2 e-Fatura gönder
// ---------------------------------------------------------------------------

export async function sendEInvoiceToGIB(
  xmlContent: string,
  invoiceNumber: string
): Promise<EInvoiceSendResult> {
  const baseUrl = process.env.E_INVOICE_INTEGRATOR_URL;
  const token = await getIntegratorToken();

  if (!baseUrl || !token) {
    // Simülasyon modu
    console.warn("[E-INVOICE] Simülasyon: e-Fatura gönderildi:", invoiceNumber);
    return {
      success: true,
      uuid: `SIM-${Date.now()}-${invoiceNumber}`,
      ettn: `ETTN-SIM-${Date.now()}`,
    };
  }

  try {
    const response = await fetch(`${baseUrl}/invoice/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
        Authorization: `Bearer ${token}`,
        "X-Invoice-Number": invoiceNumber,
      },
      body: xmlContent,
    });

    const data = (await response.json()) as {
      success: boolean;
      uuid?: string;
      ettn?: string;
      errorMessage?: string;
    };

    return {
      success: data.success,
      uuid: data.uuid,
      ettn: data.ettn,
      errorMessage: data.errorMessage,
    };
  } catch (err) {
    Sentry.captureException(err, { tags: { module: "e-invoice-send" } });
    return {
      success: false,
      errorMessage: err instanceof Error ? (err instanceof Error ? err.message : String(err)) : "e-Fatura gönderilemedi.",
    };
  }
}

// ---------------------------------------------------------------------------
// 5.2 e-Fatura durum sorgula
// ---------------------------------------------------------------------------

export async function queryEInvoiceStatusFromGIB(
  uuid: string
): Promise<EInvoiceStatusResult> {
  const baseUrl = process.env.E_INVOICE_INTEGRATOR_URL;
  const token = await getIntegratorToken();

  if (!baseUrl || !token) {
    return { success: true, status: "ACCEPTED" }; // Simülasyon
  }

  try {
    const response = await fetch(`${baseUrl}/invoice/status/${uuid}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = (await response.json()) as {
      status: string;
      errorMessage?: string;
    };

    const statusMap: Record<string, EInvoiceStatusResult["status"]> = {
      PENDING: "PENDING",
      SENT: "SENT",
      ACCEPTED: "ACCEPTED",
      REJECTED: "REJECTED",
      CANCELLED: "CANCELLED",
    };

    return {
      success: true,
      status: statusMap[data.status] ?? "PENDING",
    };
  } catch (err) {
    Sentry.captureException(err, { tags: { module: "e-invoice-status" } });
    return {
      success: false,
      errorMessage: err instanceof Error ? (err instanceof Error ? err.message : String(err)) : "Durum sorgulanamadı.",
    };
  }
}

// ---------------------------------------------------------------------------
// 5.2 e-Fatura iptal
// ---------------------------------------------------------------------------

export async function cancelEInvoiceAtGIB(
  uuid: string,
  reason?: string
): Promise<EInvoiceCancelResult> {
  const baseUrl = process.env.E_INVOICE_INTEGRATOR_URL;
  const token = await getIntegratorToken();

  if (!baseUrl || !token) {
    return { success: true }; // Simülasyon
  }

  try {
    const response = await fetch(`${baseUrl}/invoice/cancel/${uuid}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason: reason ?? "İptal" }),
    });

    const data = (await response.json()) as {
      success: boolean;
      errorMessage?: string;
    };

    return {
      success: data.success,
      errorMessage: data.errorMessage,
    };
  } catch (err) {
    Sentry.captureException(err, { tags: { module: "e-invoice-cancel" } });
    return {
      success: false,
      errorMessage: err instanceof Error ? (err instanceof Error ? err.message : String(err)) : "e-Fatura iptal edilemedi.",
    };
  }
}

// ---------------------------------------------------------------------------
// 5.2 e-Fatura mükellefiyeti sorgula
// ---------------------------------------------------------------------------

export async function checkEInvoiceEligibilityAtGIB(
  taxNumber: string
): Promise<EInvoiceEligibilityResult> {
  const baseUrl = process.env.E_INVOICE_INTEGRATOR_URL;
  const token = await getIntegratorToken();

  if (!baseUrl || !token) {
    // Simülasyon: VKN 10 haneli ise e-Fatura mükellefi say
    return { isEligible: taxNumber.length === 10 };
  }

  try {
    const response = await fetch(
      `${baseUrl}/taxpayer/check?taxNumber=${encodeURIComponent(taxNumber)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = (await response.json()) as {
      isEligible: boolean;
      errorMessage?: string;
    };

    return {
      isEligible: data.isEligible,
      errorMessage: data.errorMessage,
    };
  } catch (err) {
    Sentry.captureException(err, { tags: { module: "e-invoice-eligibility" } });
    // Hata durumunda e-Arşiv kullan (güvenli taraf)
    return { isEligible: false };
  }
}
