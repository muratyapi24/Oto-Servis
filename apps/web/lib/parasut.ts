/**
 * Paraşüt API Client
 * Türkiye'nin önde gelen bulut muhasebe yazılımı entegrasyonu
 * Docs: https://apidocs.parasut.com
 *
 * Ortam değişkenleri (tenant bazlı AccountingIntegration tablosundan okunur):
 * - clientId, clientSecret, username, password, companyId
 */

interface ParasutCredentials {
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

const PARASUT_BASE = "https://api.parasut.com/v4";
const TOKEN_URL = "https://api.parasut.com/oauth/token";

// Token cache (process başına)
const tokenCache = new Map<string, ParasutToken>();

/**
 * OAuth2 token al (Resource Owner Password Credentials)
 */
async function getToken(creds: ParasutCredentials): Promise<string> {
  const cacheKey = `${creds.clientId}:${creds.username}`;
  const cached = tokenCache.get(cacheKey);

  if (cached) {
    const expiresAt = (cached.created_at + cached.expires_in) * 1000;
    if (Date.now() < expiresAt - 60_000) {
      return cached.access_token;
    }
  }

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
    throw new Error(`Paraşüt token alınamadı: ${res.status}`);
  }

  const token: ParasutToken = await res.json();
  tokenCache.set(cacheKey, token);
  return token.access_token;
}

async function parasutRequest<T>(
  creds: ParasutCredentials,
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = await getToken(creds);
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
    const err = await res.text();
    throw new Error(`Paraşüt API hatası (${res.status}): ${err}`);
  }

  return res.json();
}

/**
 * Fatura oluştur (Satış Faturası)
 */
export async function createParasutInvoice(
  creds: ParasutCredentials,
  invoice: {
    invoiceNumber: string;
    issueDate: string; // YYYY-MM-DD
    dueDate?: string;
    customerName: string;
    customerTaxNumber?: string;
    lines: {
      name: string;
      quantity: number;
      unitPrice: number;
      vatRate: number;
    }[];
    currency?: string;
  }
): Promise<{ id: string; externalId: string }> {
  const payload = {
    data: {
      type: "sales_invoices",
      attributes: {
        item_type: "invoice",
        description: invoice.invoiceNumber,
        issue_date: invoice.issueDate,
        due_date: invoice.dueDate ?? invoice.issueDate,
        currency: invoice.currency ?? "TRL",
        lines: invoice.lines.map((line) => ({
          quantity: line.quantity,
          unit_price: line.unitPrice,
          vat_rate: line.vatRate,
          description: line.name,
        })),
      },
      relationships: {
        contact: {
          data: {
            type: "contacts",
            // Müşteri Paraşüt'te yoksa önce oluşturulmalı
            // Burada basit bir yaklaşım: müşteri adıyla arama yapılır
          },
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

  return { id: result.data.id, externalId: result.data.id };
}

/**
 * Ödeme kaydet
 */
export async function createParasutPayment(
  creds: ParasutCredentials,
  payment: {
    invoiceId: string; // Paraşüt fatura ID'si
    amount: number;
    date: string; // YYYY-MM-DD
    description?: string;
  }
): Promise<{ id: string }> {
  const payload = {
    data: {
      type: "payments",
      attributes: {
        amount: payment.amount,
        date: payment.date,
        description: payment.description ?? "MS Oto Servis Tahsilatı",
        currency: "TRL",
      },
      relationships: {
        payable: {
          data: { type: "sales_invoices", id: payment.invoiceId },
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

/**
 * Müşteri oluştur veya bul
 */
export async function upsertParasutContact(
  creds: ParasutCredentials,
  contact: {
    name: string;
    taxNumber?: string;
    email?: string;
    phone?: string;
  }
): Promise<string> {
  // Önce ara
  const searchResult = await parasutRequest<{ data: { id: string; attributes: { name: string } }[] }>(
    creds,
    "GET",
    `/contacts?filter[name]=${encodeURIComponent(contact.name)}&page[size]=1`
  );

  if (searchResult.data.length > 0) {
    return searchResult.data[0]!.id;
  }

  // Yoksa oluştur
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
