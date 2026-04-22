/**
 * BST Mobil API Client
 * Web uygulamasının /api/mobile/* endpoint'lerini tüketir
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Bilinmeyen hata" }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // ─── Müşteri ────────────────────────────────────────────────────────────────
  musteriPanel: () =>
    request("/api/mobile/musteri/panel"),

  musteriServisDetay: (id: string) =>
    request(`/api/mobile/musteri/servis/${id}`),

  musteriServisRating: (id: string, body: { rating: number; comment?: string }) =>
    request(`/api/mobile/musteri/servis/${id}/rating`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  musteriAracEkle: (body: {
    plate: string;
    brand: string;
    model: string;
    year?: number;
    imageUrl?: string;
  }) =>
    request("/api/mobile/musteri/arac", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  musteriProfil: () =>
    request("/api/mobile/musteri/profil"),

  // ─── Firma ──────────────────────────────────────────────────────────────────
  firmaPanel: () =>
    request("/api/mobile/firma/panel"),

  firmaKuyruk: () =>
    request("/api/mobile/firma/kuyruk"),

  firmaPersonel: () =>
    request("/api/mobile/firma/personel"),

  firmaPersonelDetay: (id: string) =>
    request(`/api/mobile/firma/personel/${id}`),

  firmaFinans: () =>
    request("/api/mobile/firma/finans"),

  firmaStok: () =>
    request("/api/mobile/firma/stok"),

  firmaStokHareketler: (params?: { page?: number; limit?: number; partId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.partId) qs.set("partId", params.partId);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return request(`/api/mobile/firma/stok/hareketler${query}`);
  },

  firmaServisDetay: (id: string) =>
    request(`/api/mobile/firma/servis/${id}`),

  firmaServisKapat: (id: string, body: { qualityCheckNotes?: string }) =>
    request(`/api/mobile/firma/servis/${id}/kapat`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  firmaOnayListesi: () =>
    request("/api/mobile/firma/onay"),

  firmaOnayIslem: (id: string, body: { action: "approve" | "reject"; reason?: string }) =>
    request(`/api/mobile/firma/onay/${id}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  firmaDepolar: () => request("/api/mobile/firma/depolar"),

  firmaDepoDetay: (id: string) => request(`/api/mobile/firma/depolar/${id}`),

  firmaStokGuncelle: (
    id: string,
    body: { quantity: number; type: "IN" | "OUT" | "ADJUST"; reason?: string }
  ) =>
    request(`/api/mobile/firma/stok/guncelle/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  firmaBarkodAra: (barcode: string) =>
    request(`/api/mobile/firma/stok/barkod?q=${encodeURIComponent(barcode)}`),

  firmaFaturaDetay: (id: string) =>
    request(`/api/mobile/firma/fatura/${id}`),

  firmaFaturaPdf: (id: string) =>
    request(`/api/invoices/${id}/pdf`),

  // ─── Arama & Auth ────────────────────────────────────────────────────────────
  search: (q: string, type = "all") =>
    request(`/api/search?q=${encodeURIComponent(q)}&type=${type}`),

  login: (email: string, password: string) =>
    request("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
};
