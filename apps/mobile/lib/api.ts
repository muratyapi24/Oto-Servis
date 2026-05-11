/**
 * BST Mobil API Client
 * Web uygulamasının /api/mobile/* endpoint'lerini tüketir
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// Production'da EXPO_PUBLIC_API_URL ZORUNLU
export function getApiBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) {
    if (__DEV__) {
      console.warn("[API] EXPO_PUBLIC_API_URL tanımlanmamış, localhost kullanılıyor");
      return "http://localhost:3000";
    }
    throw new Error(
      "EXPO_PUBLIC_API_URL ortam değişkeni tanımlanmamış. " +
      "Production build'de bu değer zorunludur."
    );
  }
  return url;
}

const BASE_URL = getApiBaseUrl();

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
    request<{ part: { id: string; name: string; partNumber: string | null; currentStock: number; sellingPrice: number; unit: string } | null }>(
      `/api/mobile/firma/stok?barcode=${encodeURIComponent(barcode)}`
    ),

  firmaFaturaDetay: (id: string) =>
    request(`/api/mobile/firma/fatura/${id}`),

  firmaFaturaPdf: (id: string) =>
    request(`/api/invoices/${id}/pdf`),

  // ─── Firma Bildirimler & Hizmetler ──────────────────────────────────────────
  firmaBildirimler: () =>
    request<{ notifications: Array<{
      id: string; title: string; message: string;
      isRead: boolean; link?: string | null; createdAt: string;
    }> }>("/api/mobile/firma/bildirimler"),

  firmaBildirimOku: (id: string) =>
    request<{ success: boolean }>(`/api/mobile/firma/bildirimler/${id}/oku`, { method: "PATCH" }),

  firmaTumBildirimOku: () =>
    request<{ success: boolean }>("/api/mobile/firma/bildirimler", { method: "PATCH" }),

  firmaHizmetler: () =>
    request<{ services: Array<{
      id: string; name: string; price: number;
      category?: string; unit?: string;
    }> }>("/api/mobile/firma/hizmetler"),

  firmaMesajlar: () =>
    request<{ threads: Array<{
      id: string; customerName: string; vehiclePlate: string;
      lastMessage: string; unread: number; updatedAt: string;
    }> }>("/api/mobile/firma/mesajlar"),

  // ─── Arama & Auth ────────────────────────────────────────────────────────────
  search: (q: string, type = "all") =>
    request(`/api/search?q=${encodeURIComponent(q)}&type=${type}`),

  login: (email: string, password: string) =>
    request("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // ─── Müşteri OTP Auth ────────────────────────────────────────────────────────
  musteriOtpGonder: (plate: string, phone: string) =>
    request<{ success: boolean; message?: string; error?: string }>(
      "/api/mobile/musteri/otp",
      {
        method: "POST",
        body: JSON.stringify({ action: "send", plate, phone }),
      }
    ),

  musteriOtpDogrula: (plate: string, phone: string, otp: string) =>
    request<{
      success: boolean;
      token?: string;
      customer?: {
        id: string;
        vehicleId: string;
        plate: string;
        brand: string;
        model: string;
        name: string;
      };
      error?: string;
    }>(
      "/api/mobile/musteri/otp",
      {
        method: "POST",
        body: JSON.stringify({ action: "verify", plate, phone, otp }),
      }
    ),
};
