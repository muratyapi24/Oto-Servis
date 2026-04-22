/**
 * IYS (İleti Yönetim Sistemi) API Client
 *
 * İleti Merkezi üzerinden IYS pazarlama izin sorgulama ve kayıt işlemleri.
 * Türk mevzuatı gereği ticari elektronik ileti göndermeden önce izin kontrolü
 * zorunludur (6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun).
 *
 * API Referans: https://apidocs.iletimerkezi.com/iys
 */

import { prisma } from "@repo/database";

interface IysCredentials {
  apiKey: string;
  apiSecret: string;
  brandCode: string; // İleti Merkezi marka kodu
}

interface IysConsentStatus {
  status: "ONAY" | "RET" | "BEKLEMEDE";
  consentDate?: string;
  consentId?: string;
}

const IYS_API_BASE = "https://api.iletimerkezi.com/v1/iys";

async function getIysCredentials(tenantId: string): Promise<IysCredentials | null> {
  const provider = await prisma.notificationProvider.findFirst({
    where: { tenantId, type: "SMS", provider: "ILETIMERKEZI", isActive: true },
    select: { settings: true },
  });

  if (!provider?.settings) return null;

  const creds = provider.settings as Record<string, string>;
  if (!creds.iysApiKey || !creds.iysApiSecret || !creds.iysBrandCode) return null;

  return {
    apiKey: creds.iysApiKey,
    apiSecret: creds.iysApiSecret,
    brandCode: creds.iysBrandCode,
  };
}

/**
 * Müşterinin belirtilen kanal için IYS pazarlama iznini sorgular
 */
export async function checkIysConsent(
  tenantId: string,
  phone: string,
  channel: "MESAJ" | "ARAMA" | "EPOSTA" = "MESAJ"
): Promise<IysConsentStatus | null> {
  const creds = await getIysCredentials(tenantId);
  if (!creds) return null;

  try {
    const normalizedPhone = normalizePhone(phone);
    const res = await fetch(`${IYS_API_BASE}/recipient-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${creds.apiKey}:${creds.apiSecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        brandCode: creds.brandCode,
        type: channel,
        recipient: normalizedPhone,
        recipientType: "BIREYSEL",
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return {
      status: data.status ?? "BEKLEMEDE",
      consentDate: data.consentDate,
      consentId: data.consentId,
    };
  } catch {
    return null;
  }
}

/**
 * IYS iznini kayıt altına alır (müşteri onay verdiğinde çağrılır)
 */
export async function recordIysConsent(
  tenantId: string,
  phone: string,
  channel: "MESAJ" | "ARAMA" | "EPOSTA" = "MESAJ"
): Promise<{ consentId?: string; success: boolean }> {
  const creds = await getIysCredentials(tenantId);
  if (!creds) return { success: false };

  try {
    const normalizedPhone = normalizePhone(phone);
    const res = await fetch(`${IYS_API_BASE}/add-consent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${creds.apiKey}:${creds.apiSecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        brandCode: creds.brandCode,
        type: channel,
        recipient: normalizedPhone,
        recipientType: "BIREYSEL",
        status: "ONAY",
        consentDate: new Date().toISOString().split("T")[0],
        source: "HS_WEB",
      }),
    });

    if (!res.ok) return { success: false };

    const data = await res.json();
    return { success: true, consentId: data.consentId };
  } catch {
    return { success: false };
  }
}

/**
 * IYS iznini iptal eder (müşteri rızayı geri çektiğinde çağrılır)
 */
export async function revokeIysConsent(
  tenantId: string,
  phone: string,
  channel: "MESAJ" | "ARAMA" | "EPOSTA" = "MESAJ"
): Promise<boolean> {
  const creds = await getIysCredentials(tenantId);
  if (!creds) return false;

  try {
    const normalizedPhone = normalizePhone(phone);
    const res = await fetch(`${IYS_API_BASE}/add-consent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${creds.apiKey}:${creds.apiSecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        brandCode: creds.brandCode,
        type: channel,
        recipient: normalizedPhone,
        recipientType: "BIREYSEL",
        status: "RET",
        consentDate: new Date().toISOString().split("T")[0],
        source: "HS_WEB",
      }),
    });

    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Verilen müşteri listesini IYS onaylı olanlarla filtreler.
 * IYS API erişimi yoksa (credentials eksik) tüm listeyi geçirir.
 */
export async function filterByIysConsent(
  tenantId: string,
  customers: Array<{ id: string; phone: string }>,
  channel: "MESAJ" | "ARAMA" | "EPOSTA" = "MESAJ"
): Promise<Array<{ id: string; phone: string }>> {
  const creds = await getIysCredentials(tenantId);

  // IYS entegrasyonu yapılandırılmamışsa önce DB'deki marketing consent'e bak
  if (!creds) {
    const prefs = await prisma.customerNotificationPreference.findMany({
      where: {
        tenantId,
        customerId: { in: customers.map((c) => c.id) },
        marketingConsentGivenAt: { not: null },
        marketingConsentRevokedAt: null,
      },
      select: { customerId: true },
    });
    const consentedIds = new Set(prefs.map((p) => p.customerId));
    // Eğer hiç consent kaydı yoksa tümüne gönder (geriye dönük uyumluluk)
    if (consentedIds.size === 0) return customers;
    return customers.filter((c) => consentedIds.has(c.id));
  }

  // IYS API ile gerçek zamanlı kontrol (toplu işlemde paralel sorgular)
  const results = await Promise.all(
    customers.map(async (customer) => {
      const status = await checkIysConsent(tenantId, customer.phone, channel);
      return { customer, approved: status?.status === "ONAY" };
    })
  );

  return results.filter((r) => r.approved).map((r) => r.customer);
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+9${digits}`;
  if (digits.length === 10) return `+90${digits}`;
  return `+${digits}`;
}
