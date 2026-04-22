import { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  subscribeSSEEvents,
  formatSSEMessage,
  publishSSEEvent,
} from "@/lib/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/sse/stock
 * Tenant bazlı gerçek zamanlı stok güncelleme SSE stream'i.
 * Yalnızca STOCK_UPDATED tipindeki event'leri filtreler.
 */
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return new Response("Yetkisiz erişim", { status: 401 });
  }

  const tenantId = session.user.tenantId;

  if (!tenantId) {
    return new Response("Tenant bulunamadı", { status: 403 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // İlk bağlantı ping'i
      controller.enqueue(
        encoder.encode(
          formatSSEMessage({
            type: "PING",
            payload: { ts: Date.now() },
            tenantId,
          })
        )
      );

      // Yalnızca STOCK_UPDATED event'lerini filtrele ve ilet
      const unsubscribe = subscribeSSEEvents(tenantId, (event) => {
        if (event.type !== "STOCK_UPDATED") return;
        try {
          controller.enqueue(encoder.encode(formatSSEMessage(event)));
        } catch {
          // Bağlantı kapandı
          unsubscribe();
        }
      });

      // Periyodik ping (30s) — bağlantıyı canlı tutar
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(
              formatSSEMessage({
                type: "PING",
                payload: { ts: Date.now() },
                tenantId,
              })
            )
          );
        } catch {
          clearInterval(pingInterval);
          unsubscribe();
        }
      }, 30_000);

      // Bağlantı koptuğunda cleanup
      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* zaten kapalı */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
