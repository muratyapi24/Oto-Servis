/**
 * Meilisearch Full-text Arama Servisi
 * Ortam değişkenleri: MEILISEARCH_HOST, MEILISEARCH_API_KEY
 */

import { Meilisearch } from "meilisearch";

let client: Meilisearch | null = null;

function getClient(): Meilisearch | null {
  const host = process.env.MEILISEARCH_HOST;
  const apiKey = process.env.MEILISEARCH_API_KEY;

  if (!host) {
    return null; // Meilisearch yapılandırılmamış — sessizce atla
  }

  if (!client) {
    client = new Meilisearch({ host, apiKey });
  }
  return client;
}

// Index isimleri
export const SearchIndexes = {
  customers: "customers",
  vehicles: "vehicles",
  serviceOrders: "service_orders",
  parts: "parts",
} as const;

// Türkçe karakter eşleştirme haritası
const TURKISH_CHAR_MAP: Record<string, string> = {
  ş: "s", Ş: "S", ğ: "g", Ğ: "G",
  ü: "u", Ü: "U", ö: "o", Ö: "O",
  ç: "c", Ç: "C", ı: "i", İ: "I",
};

export function normalizeTurkish(text: string): string {
  return text.replace(/[şŞğĞüÜöÖçÇıİ]/g, (char) => TURKISH_CHAR_MAP[char] ?? char);
}

/**
 * Index'leri oluştur ve Türkçe ayarlarını yapılandır
 */
export async function setupSearchIndexes(): Promise<void> {
  const ms = getClient();
  if (!ms) return;

  const indexConfigs = [
    {
      uid: SearchIndexes.customers,
      primaryKey: "id",
      searchableAttributes: ["firstName", "lastName", "companyName", "phone", "email"],
      filterableAttributes: ["tenantId", "type"],
    },
    {
      uid: SearchIndexes.vehicles,
      primaryKey: "id",
      searchableAttributes: ["plate", "brand", "model", "chassisNo"],
      filterableAttributes: ["tenantId", "customerId"],
    },
    {
      uid: SearchIndexes.serviceOrders,
      primaryKey: "id",
      searchableAttributes: ["complaintDescription", "orderNumber", "vehiclePlate"],
      filterableAttributes: ["tenantId", "status"],
    },
    {
      uid: SearchIndexes.parts,
      primaryKey: "id",
      searchableAttributes: ["name", "partNumber", "description", "brand"],
      filterableAttributes: ["tenantId", "categoryId"],
    },
  ];

  for (const config of indexConfigs) {
    try {
      const index = ms.index(config.uid);
      await index.updateSettings({
        searchableAttributes: config.searchableAttributes,
        filterableAttributes: config.filterableAttributes,
        typoTolerance: {
          enabled: true,
          minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
        },
      });
    } catch {
      // Index yoksa oluştur
      await ms.createIndex(config.uid, { primaryKey: config.primaryKey });
    }
  }
}

/**
 * Tenant izolasyonlu arama
 */
export async function search(
  indexName: string,
  query: string,
  tenantId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ hits: unknown[]; total: number }> {
  const ms = getClient();
  if (!ms) {
    return { hits: [], total: 0 };
  }

  try {
    const index = ms.index(indexName);
    const result = await index.search(query, {
      filter: `tenantId = "${tenantId}"`,
      limit: options.limit ?? 20,
      offset: options.offset ?? 0,
    });

    return { hits: result.hits, total: result.estimatedTotalHits ?? 0 };
  } catch {
    return { hits: [], total: 0 };
  }
}

/**
 * Belge ekle veya güncelle
 */
export async function upsertDocument(
  indexName: string,
  document: Record<string, unknown>
): Promise<void> {
  const ms = getClient();
  if (!ms) return;

  try {
    await ms.index(indexName).addDocuments([document]);
  } catch {
    // Sessizce başarısız ol — arama opsiyonel bir özellik
  }
}

/**
 * Belge sil
 */
export async function deleteDocument(
  indexName: string,
  id: string
): Promise<void> {
  const ms = getClient();
  if (!ms) return;

  try {
    await ms.index(indexName).deleteDocument(id);
  } catch {
    // Sessizce başarısız ol
  }
}
