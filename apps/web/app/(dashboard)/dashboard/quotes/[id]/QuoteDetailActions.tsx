"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, CheckCircle2, XCircle, Wrench } from "lucide-react";
import { updateQuoteStatus, convertQuoteToServiceOrder } from "@/lib/actions/quote.actions";

export default function QuoteDetailActions({ quote }: { quote: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(action: string) {
    setLoading(true); setError(null);
    let res: any;
    if (action === "SEND") res = await updateQuoteStatus({ quoteId: quote.id, status: "SENT" });
    else if (action === "ACCEPT") res = await updateQuoteStatus({ quoteId: quote.id, status: "ACCEPTED" });
    else if (action === "REJECT") res = await updateQuoteStatus({ quoteId: quote.id, status: "REJECTED" });
    else if (action === "CONVERT") {
      res = await convertQuoteToServiceOrder(quote.id);
      if (res.serviceOrderId) { router.push(`/dashboard/services/${res.serviceOrderId}`); return; }
    }
    setLoading(false);
    if (res?.error) setError(res.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {quote.status === "DRAFT" && (
          <button onClick={() => handle("SEND")} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-70">
            <Send className="w-4 h-4" /> Gönder
          </button>
        )}
        {quote.status === "SENT" && (
          <>
            <button onClick={() => handle("ACCEPT")} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-70">
              <CheckCircle2 className="w-4 h-4" /> Kabul Et
            </button>
            <button onClick={() => handle("REJECT")} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 disabled:opacity-70">
              <XCircle className="w-4 h-4" /> Reddet
            </button>
          </>
        )}
        {quote.status === "ACCEPTED" && quote.vehicleId && (
          <button onClick={() => handle("CONVERT")} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white rounded-xl text-sm font-bold hover:bg-blue-800 disabled:opacity-70">
            <Wrench className="w-4 h-4" /> Servis Emrine Dönüştür
          </button>
        )}
      </div>
    </div>
  );
}
