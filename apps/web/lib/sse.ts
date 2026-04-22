/**
 * Server-Sent Events (SSE) yayın yardımcı modülü
 * Tenant bazlı event yayını için in-process EventEmitter kullanır.
 * Çoklu instance ortamında Redis Pub/Sub ile değiştirilebilir.
 */

import { EventEmitter } from "events";

export type SSEEventType =
  | "SERVICE_ORDER_UPDATED"
  | "APPOINTMENT_CREATED"
  | "APPROVAL_RESPONDED"
  | "STOCK_UPDATED"
  | "PING";

export interface StockUpdatedPayload {
  partId: string;
  partNumber: string;
  partName: string;
  newStock: number;
  movementType: "IN" | "OUT" | "ADJUST";
  locationId?: string;
}

export interface SSEEvent {
  type: SSEEventType;
  payload: Record<string, unknown>;
  tenantId: string;
}

// Singleton emitter — process başına tek instance
const emitter = new EventEmitter();
emitter.setMaxListeners(200); // Çok sayıda SSE bağlantısı için

/**
 * Belirli bir tenant'a event yayınla
 */
export function publishSSEEvent(event: SSEEvent): void {
  emitter.emit(`sse:${event.tenantId}`, event);
}

/**
 * Tenant'a ait SSE event'lerini dinle; cleanup fonksiyonu döner
 */
export function subscribeSSEEvents(
  tenantId: string,
  handler: (event: SSEEvent) => void
): () => void {
  const channel = `sse:${tenantId}`;
  emitter.on(channel, handler);
  return () => emitter.off(channel, handler);
}

/**
 * Stok güncellemesini ilgili tenant'a yayınla
 */
export function publishStockUpdate(
  tenantId: string,
  payload: StockUpdatedPayload
): void {
  publishSSEEvent({
    type: "STOCK_UPDATED",
    payload: payload as unknown as Record<string, unknown>,
    tenantId,
  });
}

/**
 * SSE mesajını text/event-stream formatına çevir
 */
export function formatSSEMessage(event: SSEEvent): string {
  return `data: ${JSON.stringify({ type: event.type, payload: event.payload })}\n\n`;
}
