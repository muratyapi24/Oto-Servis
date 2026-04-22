/**
 * Paraşüt API İstemcisi
 * OAuth2 token yönetimi (Redis cache, 60s önceden yenileme)
 * Docs: https://apidocs.parasut.com
 */

import { Redis } from "@upstash/redis";
import * as Sentry from "@sentry/nextjs";

// ---------------------------------------------------------------------------
// Tipler
// ---------------------------------------------------------------------------

export interface ParasutCredentials {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  companyId: string;
}

interface ParasutToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  created_at: number;
}

export interface ParasutContact {
  id: string;
  name: string;
  taxNumber?: string;
}

export interface ParasutInvoiceLine {
  name: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export interface ParasutInvoiceInput {
  invoiceNumber: string;
  issueDate: string; // YYYY-MM-DD
  dueDate?: string;
  contactId: string; // Paraşüt müşteri ID'si
  lines: ParasutInvoiceLine[];
  currency?: string;
  description?: string;
}

export interface ParasutPaymentInput {
  invoiceId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  description?: string;
}

// ---------------------------------------------------------------------------
// Redis token cache
// ---------------------------------------------------------------------------

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

const PARASUT_BASE = "https://api.parasut.com/v4";
const TOKEN_URL = "https://api.parasut.com/oauth/token";

// ---------------------------------------------------------------------------
// 6.1 OAuth2 token al (Redis cache, 60s önceden yenile)
// ---------------------------------------------------------------------------

export async function getParasutToken(creds: ParasutCredentials): Promise<string> {
  const cacheKey = `parasut:token:${creds.clientId}:${creds.username}`;
  const r = getRedis();

  // Redis'ten token al
  if (r) {
    try {
      const cached = await r.get<ParasutToken>(cacheKey);
      if (cached) {
        const expiresAt = (cached.created_at + cached.expires_in) * 1000;
        if (Date.now() < expiresAt - 60_000) {
          return cached.access_token;
        }
      }
    } catch {
      // Redis hatası — devam et
    }
  }

  // Yeni token al
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "password",
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        username: creds.username,
        password: creds.password,
        redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
      }),
    });

    if (!res.ok) {
      throw new Error(`Paraşüt token alınamadı: HTTP ${res.status}`);
    }

    const token: ParasutToken = await res.json();

    // Redis'e kaydet (expires_in - 120 saniye TTL)
    if (r) {
      try {
        await r.setex(cacheKey, Math.max(token.expires_in - 120, 60), token);
      } catch {
        // Redis yazma hatası — kritik değil
      }
    }

    return token.access_token;
  } catch (err) {
    Sentry.captureException(err, { tags: { module: "parasut-token" } });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 6.1 Paraşüt API isteği
// ---------------------------------------------------------------------------

export async function parasutRequest<T>(
  creds: ParasutCredentials,
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = await getParasutToken(creds);
  const url = `${PARASUT_BASE}/${creds.companyId}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Paraşüt API hatası (${res.status}): ${errText}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// 6.1 Bağlantı testi
// ---------------------------------------------------------------------------

export async function testParasutConnectionWithCreds(
  creds: ParasutCredentials
): Promise<{ connected: boolean; errorMessage?: string }> {
  try {
    await getParasutToken(creds);
    // Şirket bilgisini çek
    await parasutRequest(creds, "GET", "");
    return { connected: true };
  } catch (err) {
    return {
      connected: false,
      errorMessage: err instanceof Error ? err.message : "Bağlantı hatası",
    };
  }
}

// ---------------------------------------------------------------------------
// 6.6 Müşteri deduplication — vergi numarasıyla arama
// ---------------------------------------------------------------------------

export async function findOrCreateParasutContact(
  creds: ParasutCredentials,
  contact: {
    name: string;
    taxNumber?: string;
    email?: string;
    phone?: string;
  }
): Promise<string> {
  // Vergi numarasıyla ara
  if (contact.taxNumber) {
    try {
      const searchResult = await parasutRequest<{
        data: Array<{ id: string; attributes: { name: string } }>;
      }>(
        creds,
        "GET",
        `/contacts?filter[tax_number]=${encodeURIComponent(contact.taxNumber)}&page[size]=1`
      );

      if (searchResult.data.length > 0) {
        return searchResult.data[0]!.id;
      }
    } catch {
      // Arama başarısız — yeni oluştur
    }
  }

  // İsimle ara
  try {
    const nameSearch = await parasutRequest<{
      data: Array<{ id: string }>;
    }>(
      creds,
      "GET",
      `/contacts?filter[name]=${encodeURIComponent(contact.name)}&page[size]=1`
    );

    if (nameSearch.data.length > 0) {
      return nameSearch.data[0]!.id;
    }
  } catch {
    // Arama başarısız — yeni oluştur
  }

  // Yeni müşteri oluştur
  const payload = {
    data: {
      type: "contacts",
      attributes: {
        contact_type: "company",
        name: contact.name,
        tax_number: contact.taxNumber ?? "",
        email: contact.email ?? "",
        phone: contact.phone ?? "",
      },
    },
  };

  const result = await parasutRequest<{ data: { id: string } }>(
    creds,
    "POST",
    "/contacts",
    payload
  );

  return result.data.id;
}

// ---------------------------------------------------------------------------
// Fatura oluştur
// ---------------------------------------------------------------------------

export async function createParasutInvoice(
  creds: ParasutCredentials,
  input: ParasutInvoiceInput
): Promise<{ id: string }> {
  const payload = {
    data: {
      type: "sales_invoices",
      attributes: {
        item_type: "invoice",
        description: input.description ?? input.invoiceNumber,
        issue_date: input.issueDate,
        due_date: input.dueDate ?? input.issueDate,
        currency: input.currency ?? "TRL",
        lines: input.lines.map((line) => ({
          quantity: line.quantity,
          unit_price: line.unitPrice,
          vat_rate: line.vatRate,
          description: line.name,
        })),
      },
      relationships: {
        contact: {
          data: { type: "contacts", id: input.contactId },
        },
      },
    },
  };

  const result = await parasutRequest<{ data: { id: string } }>(
    creds,
    "POST",
    "/sales_invoices",
    payload
  );

  return { id: result.data.id };
}

// ---------------------------------------------------------------------------
// Fatura güncelle
// ---------------------------------------------------------------------------

export async function updateParasutInvoice(
  creds: ParasutCredentials,
  externalId: string,
  input: Partial<ParasutInvoiceInput>
): Promise<void> {
  const payload = {
    data: {
      type: "sales_invoices",
      id: externalId,
      attributes: {
        ...(input.issueDate && { issue_date: input.issueDate }),
        ...(input.dueDate && { due_date: input.dueDate }),
        ...(input.lines && {
          lines: input.lines.map((line) => ({
            quantity: line.quantity,
            unit_price: line.unitPrice,
            vat_rate: line.vatRate,
            description: line.name,
          })),
        }),
      },
    },
  };

  await parasutRequest(creds, "PATCH", `/sales_invoices/${externalId}`, payload);
}

// ---------------------------------------------------------------------------
// Fatura iptal et
// ---------------------------------------------------------------------------

export async function cancelParasutInvoice(
  creds: ParasutCredentials,
  externalId: string
): Promise<void> {
  await parasutRequest(creds, "DELETE", `/sales_invoices/${externalId}`);
}

// ---------------------------------------------------------------------------
// Ödeme kaydet
// ---------------------------------------------------------------------------

export async function createParasutPayment(
  creds: ParasutCredentials,
  input: ParasutPaymentInput
): Promise<{ id: string }> {
  const payload = {
    data: {
      type: "payments",
      attributes: {
        amount: input.amount,
        date: input.date,
        description: input.description ?? "MS Oto Servis Tahsilatı",
        currency: "TRL",
      },
      relationships: {
        payable: {
          data: { type: "sales_invoices", id: input.invoiceId },
        },
      },
    },
  };

  const result = await parasutRequest<{ data: { id: string } }>(
    creds,
    "POST",
    "/payments",
    payload
  );

  return { id: result.data.id };
}
