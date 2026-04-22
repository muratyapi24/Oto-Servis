"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Banknote, CreditCard, Building2, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/tr";

interface Payment {
  id: string;
  customerName: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  serviceOrderId: string | null;
  notes: string | null;
}

const METHOD_ICONS: Record<string, React.ReactNode> = {
  CASH: <Banknote className="w-4 h-4 text-green-600" />,
  CREDIT_CARD: <CreditCard className="w-4 h-4 text-blue-600" />,
  BANK_TRANSFER: <Building2 className="w-4 h-4 text-purple-600" />,
};
const METHOD_LABELS: Record<string, string> = {
  CASH: "Nakit",
  CREDIT_CARD: "Kart",
  BANK_TRANSFER: "Havale/EFT",
};

const LIMIT = 20;

export default function TahsilatlarClient() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mobile/firma/finans/tahsilatlar?page=${p}&limit=${LIMIT}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yüklenemedi.");
      setPayments(data.payments ?? []);
      setTotal(data.total ?? 0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPage(page); }, [page, fetchPage]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 pb-8">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#00236f]">Tahsilatlar</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} kayıt</p>
        </div>
        <Link
          href="/m/firma/tahsilat-ekle"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-[#1e3a8a] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-4 h-4" /> Yeni
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          <Banknote className="w-8 h-8 mx-auto mb-2 text-gray-200" />
          Tahsilat kaydı bulunamadı.
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {payments.map((p) => (
              <Link
                key={p.id}
                href={`/m/firma/tahsilat/${p.id}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-[#00236f]/30 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                  {METHOD_ICONS[p.paymentMethod] ?? <Banknote className="w-4 h-4 text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{p.customerName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod} ·{" "}
                    {dayjs(p.paymentDate).locale("tr").format("DD MMM YYYY")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-black text-gray-900 font-mono">
                    ₺{p.amount.toLocaleString("tr-TR")}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#00236f] transition-colors shrink-0" />
              </Link>
            ))}
          </div>

          {/* Sayfalama */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                ← Önceki
              </button>
              <span className="text-xs text-gray-500">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Sonraki →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
