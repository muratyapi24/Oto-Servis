import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { subscribeSSEEvents, formatSSEMessage, publishSSEEvent } from "@/lib/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;

  // Tenant doğrulaması — session tenantId ile URL tenantId eşleşmeli
  const session = await auth();
  if (!session?.user) {
    return new Response("Yetkisiz erişim", { status: 401 });
  }

  const sessionTenantId = session.user.tenantId;
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  if (!isSuperAdmin && sessionTenantId !== tenantId) {
    return new Response("Erişim reddedildi", { status: 403 });
  }

  // SSE stream oluştur
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // İlk bağlantı ping'i
      controller.enqueue(
        encoder.encode(
          formatSSEMessage({ type: "PING", payload: { ts: Date.now() }, tenantId })
        )
      );

      // Event dinleyici
      const unsubscribe = subscribeSSEEvents(tenantId, (event) => {
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
              formatSSEMessage({ type: "PING", payload: { ts: Date.now() }, tenantId })
            )
          );
        } catch {
          clearInterval(pingInterval);
          unsubscribe();
        }
      }, 30_000);

      // Bağlantı kapandığında temizle
      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        unsubscribe();
        try { controller.close(); } catch { /* zaten kapalı */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
