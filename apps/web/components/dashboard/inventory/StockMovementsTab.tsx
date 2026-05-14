"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, History, Loader2, RotateCcw } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/tr";

interface StockMovement {
  id: string;
  partName: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  reason: string | null;
  date: string;
}

const TYPE_STYLES = {
  IN: { label: "GİRİŞ", cls: "text-green-700 bg-green-50 border-green-200" },
  OUT: { label: "ÇIKIŞ", cls: "text-red-700 bg-red-50 border-red-200" },
  ADJUST: { label: "DÜZELTME", cls: "text-yellow-700 bg-yellow-50 border-yellow-200" },
};

const ROW_STYLES = {
  IN: "border-l-4 border-l-green-400",
  OUT: "border-l-4 border-l-red-400",
  ADJUST: "border-l-4 border-l-yellow-400",
};

// İade hareketi olup olmadığını reason alanından tespit et
function isReturnMovement(reason: string | null): boolean {
  if (!reason) return false;
  return reason.includes("İade") || reason.includes("iade");
}

export default function StockMovementsTab() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [returnOnly, setReturnOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(search && { partName: search }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      const res = await fetch(`/api/dashboard/stock-movements?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMovements(data.movements ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, search, startDate, endDate]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchMovements();
  }

  // İade filtresi client-side uygulanır (reason bazlı)
  const filteredMovements = returnOnly
    ? movements.filter((m) => isReturnMovement(m.reason))
    : movements;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <h4 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <History className="w-5 h-5 text-amber-500" />
          Stok Hareketleri
        </h4>
        <div className="flex flex-wrap gap-2 ml-auto items-center">
          {/* İade filtresi toggle */}
          <button
            type="button"
            onClick={() => {
              setReturnOnly((v) => !v);
              setPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              returnOnly
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Sadece İadeler
          </button>

          <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Parça adı ara..."
                className="pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-gray-700 border-none rounded-lg text-sm focus:ring-2 focus:ring-amber-500/50 outline-none w-44"
              />
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-gray-700 border-none rounded-lg text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-gray-700 border-none rounded-lg text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 transition-colors"
            >
              Filtrele
            </button>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400 dark:text-slate-500" />
        </div>
      ) : filteredMovements.length === 0 ? (
        <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
          <History className="w-8 h-8 mx-auto mb-2 text-slate-200" />
          {returnOnly ? "İade hareketi bulunamadı." : "Stok hareketi bulunamadı."}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-gray-800/50/50 text-slate-500 font-bold border-b border-slate-100 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Parça</th>
                  <th className="px-6 py-3">Tip</th>
                  <th className="px-6 py-3">Miktar</th>
                  <th className="px-6 py-3">Açıklama</th>
                  <th className="px-6 py-3 text-right">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements.map((mov) => {
                  const typeStyle = TYPE_STYLES[mov.type] ?? TYPE_STYLES.ADJUST;
                  const rowStyle = ROW_STYLES[mov.type] ?? ROW_STYLES.ADJUST;
                  const isReturn = isReturnMovement(mov.reason);
                  return (
                    <tr key={mov.id} className={`hover:bg-slate-50/50 transition-colors ${rowStyle}`}>
                      <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{mov.partName}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-wider ${typeStyle.cls}`}>
                            {typeStyle.label}
                          </span>
                          {isReturn && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border-amber-200">
                              <RotateCcw className="w-2.5 h-2.5" />
                              İADE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 font-mono font-bold text-slate-700 dark:text-gray-300">
                        {mov.type === "OUT" ? "-" : "+"}{mov.quantity}
                      </td>
                      <td className="px-6 py-3 text-slate-500 dark:text-slate-400 text-xs max-w-xs truncate">
                        {mov.reason || "—"}
                      </td>
                      <td className="px-6 py-3 text-right text-xs text-slate-400 dark:text-slate-500">
                        {dayjs(mov.date).locale("tr").format("DD MMM YYYY HH:mm")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Sayfalama */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-gray-700">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {total} kayıttan {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} gösteriliyor
                {returnOnly && filteredMovements.length !== movements.length && (
                  <span className="ml-2 text-amber-600 font-bold">
                    ({filteredMovements.length} iade)
                  </span>
                )}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 dark:bg-gray-800/50 disabled:opacity-40 transition-colors"
                >
                  ← Önceki
                </button>
                <span className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-gray-300">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 dark:bg-gray-800/50 disabled:opacity-40 transition-colors"
                >
                  Sonraki →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
