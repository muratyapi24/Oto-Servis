/**
 * useStockSSE — Gerçek Zamanlı Stok Güncelleme Hook'u
 *
 * Web uygulamasının /api/sse/stock endpoint'ine bağlanarak
 * STOCK_UPDATED event'lerini dinler ve TanStack React Query
 * önbelleğini otomatik olarak geçersiz kılar.
 *
 * Özellikler:
 * - STOCK_UPDATED event'lerini dinler
 * - TanStack React Query ['inventory', 'parts'] key'ini invalidate eder
 * - Bağlantı koptuğunda 5 saniye sonra otomatik yeniden bağlanır
 * - Çevrimdışı durumda bağlanmaya çalışmaz
 * - Zustand store'a son güncelleme zamanını kaydeder
 */

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { getApiBaseUrl } from "@/lib/api";

// ─── Zustand Store ────────────────────────────────────────────────────────────

interface InventorySSEState {
  lastUpdatedAt: number | null;
  isConnected: boolean;
  lastUpdatedPartId: string | null;
  setLastUpdated: (partId: string) => void;
  setConnected: (connected: boolean) => void;
}

export const useInventorySSEStore = create<InventorySSEState>((set) => ({
  lastUpdatedAt: null,
  isConnected: false,
  lastUpdatedPartId: null,
  setLastUpdated: (partId: string) =>
    set({ lastUpdatedAt: Date.now(), lastUpdatedPartId: partId }),
  setConnected: (connected: boolean) => set({ isConnected: connected }),
}));

// ─── SSE Payload Tipi ─────────────────────────────────────────────────────────

interface StockUpdatedPayload {
  partId: string;
  partNumber: string;
  partName: string;
  newStock: number;
  movementType: "IN" | "OUT" | "ADJUST";
  locationId?: string;
}

interface SSEMessage {
  type: "STOCK_UPDATED" | "PING";
  payload: StockUpdatedPayload | { ts: number };
}

// ─── Auth Token Yardımcısı ────────────────────────────────────────────────────

async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem("auth_token");
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const BASE_URL = getApiBaseUrl();
const SSE_ENDPOINT = `${BASE_URL}/api/sse/stock`;
const RECONNECT_DELAY_MS = 5_000;

export function useStockSSE() {
  const queryClient = useQueryClient();
  const { setLastUpdated, setConnected } = useInventorySSEStore();

  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setConnected(false);
  }, [setConnected]);

  const connect = useCallback(async () => {
    if (!isMountedRef.current) return;

    // Çevrimdışı kontrolü
    const netState = await NetInfo.fetch();
    const online =
      netState.isConnected === true && netState.isInternetReachable !== false;

    if (!online) {
      // Çevrimdışıyken bağlanmaya çalışma; NetInfo değişikliğinde yeniden dene
      return;
    }

    const token = await getAuthToken();
    if (!token) return;

    // Önceki bağlantıyı temizle
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(SSE_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        },
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`SSE bağlantısı başarısız: HTTP ${response.status}`);
      }

      setConnected(true);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();

        if (done || !isMountedRef.current) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE mesajlarını satır satır işle
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const message: SSEMessage = JSON.parse(jsonStr);

            if (message.type === "STOCK_UPDATED") {
              const payload = message.payload as StockUpdatedPayload;

              // TanStack React Query önbelleğini geçersiz kıl
              await queryClient.invalidateQueries({
                queryKey: ["inventory", "parts"],
              });
              // Stok ekranı için de invalidate et
              await queryClient.invalidateQueries({
                queryKey: ["firma-stok"],
              });

              // Zustand store'a son güncelleme zamanını kaydet
              setLastUpdated(payload.partId);
            }
            // PING mesajları sessizce yoksayılır
          } catch {
            // JSON parse hatası — geç
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        // Kasıtlı iptal — yeniden bağlanma
        return;
      }

      setConnected(false);

      // Bağlantı hatası — 5 saniye sonra yeniden dene
      if (isMountedRef.current) {
        reconnectTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            connect();
          }
        }, RECONNECT_DELAY_MS);
      }
    }
  }, [queryClient, setConnected, setLastUpdated]);

  useEffect(() => {
    isMountedRef.current = true;

    // İlk bağlantı
    connect();

    // Ağ durumu değişikliklerini dinle
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const online =
        state.isConnected === true && state.isInternetReachable !== false;

      if (online && !abortControllerRef.current) {
        // Çevrimiçi olunca yeniden bağlan
        connect();
      } else if (!online) {
        // Çevrimdışı olunca bağlantıyı kes
        cleanup();
      }
    });

    return () => {
      isMountedRef.current = false;
      cleanup();
      unsubscribeNetInfo();
    };
  }, [connect, cleanup]);
}
