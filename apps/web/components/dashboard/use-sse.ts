"use client";

import { useEffect, useRef, useCallback } from "react";
import type { SSEEventType } from "@/lib/sse";

interface SSEMessage {
  type: SSEEventType;
  payload: Record<string, unknown>;
}

type SSEHandler = (message: SSEMessage) => void;

/**
 * Dashboard SSE client hook — otomatik reconnect destekli
 * @param tenantId Bağlanılacak tenant ID
 * @param onMessage Gelen event handler'ı
 */
export function useSSE(tenantId: string | undefined, onMessage: SSEHandler) {
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!tenantId || typeof window === "undefined") return;

    // Önceki bağlantıyı kapat
    if (esRef.current) {
      esRef.current.close();
    }

    const es = new EventSource(`/api/events/${tenantId}`);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SSEMessage;
        if (data.type !== "PING") {
          onMessageRef.current(data);
        }
      } catch {
        // JSON parse hatası — yoksay
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      // 3 saniye sonra yeniden bağlan
      reconnectTimer.current = setTimeout(connect, 3000);
    };
  }, [tenantId]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (esRef.current) esRef.current.close();
    };
  }, [connect]);
}
