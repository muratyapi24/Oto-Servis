"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import {
  CheckCircle,
  FileDown,
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ClipboardList,
  Lock,
} from "lucide-react";
import { updateStockCountItem, approveStockCount } from "@/lib/actions/stock-count.actions";
import { exportElementToPdf } from "@/lib/pdf-utils";

dayjs.locale("tr");

interface StockCountItem {
  id: string;
  partId: string;
  systemQuantity: number;
  actualQuantity: number | null;
  difference: number | null;
  part: {
    id: string;
    name: string;
    partNumber: string;
    unit: string;
    purchasePrice: number | string | null;
    category?: { id: string; name: string } | null;
  };
}

interface StockCount {
  id: string;
  status: "DRAFT" | "IN_PROGRESS" | "COMPLETED";
  notes?: string | null;
  createdAt: string;
  completedAt?: string | null;
  location?: { id: string; name: string } | null;
  items: StockCountItem[];
}

interface CountSummary {
  totalItems: number;
  countedItems: number;
  uncountedItems: number;
  itemsWithDifference: number;
  itemsWithPositiveDiff: number;
  itemsWithNegativeDiff: number;
  totalDifferenceValue: number;
  completionPercentage: number;
}

interface StockCountDetailClientProps {
  count: StockCount;
  summary: CountSummary;
}

const STATUS_CONFIG = {
  DRAFT: {
    label: "Taslak",
    className: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  IN_PROGRESS: {
    label: "Devam Ediyor",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  COMPLETED: {
    label: "Tamamlandı",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
};

const formatMoney = (val: number | string | null) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(Number(val) || 0);

export default function StockCountDetailClient({
  count,
  summary,
}: StockCountDetailClientProps) {
  const router = useRouter();
  const isReadOnly = count.status === "COMPLETED";

  // Local state for item quantities (optimistic UI)
  const [localItems, setLocalItems] = useState<
    Record<string, number | null>
  >(() => {
    const map: Record<string, number | null> = {};
    count.items.forEach((item) => {
      map[item.partId] = item.actualQuantity;
    });
    return map;
  });

  const [savingItems, setSavingItems] = useState<Record<string, boolean>>({});
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const [isApproving, setIsApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [approveSuccess, setApproveSuccess] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Debounce timers per partId
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {}
  );

  const handleQuantityChange = useCallback(
    (partId: string, value: string) => {
      if (isReadOnly) return;

      const numValue = value === "" ? null : parseInt(value, 10);
      setLocalItems((prev) => ({ ...prev, [partId]: numValue }));
      setItemErrors((prev) => ({ ...prev, [partId]: "" }));

      // Clear existing timer
      if (debounceTimers.current[partId]) {
        clearTimeout(debounceTimers.current[partId]);
      }

      // Skip if empty
      if (numValue === null || isNaN(numValue) || numValue < 0) return;

      // Debounce 800ms
      debounceTimers.current[partId] = setTimeout(async () => {
        setSavingItems((prev) => ({ ...prev, [partId]: true }));
        try {
          const result = await updateStockCountItem(
            count.id,
            partId,
            numValue
          );
          if (!result.success) {
            setItemErrors((prev) => ({
              ...prev,
              [partId]: result.error || "Güncelleme başarısız.",
            }));
          }
        } finally {
          setSavingItems((prev) => ({ ...prev, [partId]: false }));
        }
      }, 800);
    },
    [count.id, isReadOnly]
  );

  const handleApprove = async () => {
    setApproveError(null);
    setIsApproving(true);
    try {
      const result = await approveStockCount(count.id);
      if (result.success) {
        setApproveSuccess(true);
        router.refresh();
      } else {
        setApproveError(result.error || "Sayım onaylanamadı.");
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportElementToPdf("stock-count-pdf-content", {
        filename: `stok-sayim-${count.id.slice(-6).toUpperCase()}.pdf`,
        orientation: "p",
        format: "a4",
        margin: 10,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const statusCfg = STATUS_CONFIG[count.status] || STATUS_CONFIG.DRAFT;

  // Compute live differences for display
  const getDisplayDiff = (item: StockCountItem) => {
    const actual = localItems[item.partId];
    if (actual === null || actual === undefined) return null;
    return actual - item.systemQuantity;
  };

  return (
    <div className="space-y-6">
      {/* Durum + Aksiyon Başlığı */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black border ${statusCfg.className}`}
          >
            {statusCfg.label}
          </span>
          {count.location && (
            <span className="text-sm text-slate-500 font-medium">
              📍 {count.location.name}
            </span>
          )}
          <span className="text-sm text-slate-400">
            {dayjs(count.createdAt).format("DD MMM YYYY, HH:mm")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* PDF Export */}
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            Fark Raporu PDF
          </button>

          {/* Onay Butonu */}
          {!isReadOnly && (
            <button
              onClick={handleApprove}
              disabled={isApproving || approveSuccess}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Onaylanıyor...
                </>
              ) : approveSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Onaylandı
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Sayımı Onayla
                </>
              )}
            </button>
          )}

          {isReadOnly && (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 text-sm font-bold rounded-xl">
              <Lock className="w-4 h-4" />
              Salt Okunur
            </div>
          )}
        </div>
      </div>

      {/* Onay Hatası */}
      {approveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {approveError}
        </div>
      )}

      {/* Notlar */}
      {count.notes && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600">
          <span className="font-bold text-slate-700">Not: </span>
          {count.notes}
        </div>
      )}

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Tamamlanma
          </span>
          <div className="mt-1">
            <span className="text-3xl font-black text-slate-900">
              %{summary.completionPercentage}
            </span>
          </div>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${summary.completionPercentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {summary.countedItems}/{summary.totalItems} kalem
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Fark Olan
          </span>
          <span className="text-3xl font-black text-amber-600 block mt-1">
            {summary.itemsWithDifference}
          </span>
          <p className="text-xs text-slate-400 mt-1">
            +{summary.itemsWithPositiveDiff} / -{summary.itemsWithNegativeDiff}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Sayılmayan
          </span>
          <span className="text-3xl font-black text-slate-600 block mt-1">
            {summary.uncountedItems}
          </span>
          <p className="text-xs text-slate-400 mt-1">kalem bekliyor</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Toplam Fark Değeri
          </span>
          <span
            className={`text-2xl font-black block mt-1 ${
              summary.totalDifferenceValue >= 0
                ? "text-emerald-600"
                : "text-red-600"
            }`}
          >
            {formatMoney(summary.totalDifferenceValue)}
          </span>
        </div>
      </div>

      {/* Sayım Kalemleri Tablosu */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-black text-slate-700">
            Sayım Kalemleri ({count.items.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Parça</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4 text-center">Sistem Miktarı</th>
                <th className="px-6 py-4 text-center">Fiili Miktar</th>
                <th className="px-6 py-4 text-center">Fark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {count.items.map((item) => {
                const displayDiff = getDisplayDiff(item);
                const isSaving = savingItems[item.partId];
                const itemError = itemErrors[item.partId];
                const actualVal = localItems[item.partId];

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">
                        {item.part.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {item.part.partNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.part.category ? (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-medium">
                          {item.part.category.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-black text-slate-700">
                        {item.systemQuantity}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">
                        {item.part.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isReadOnly ? (
                        <span className="font-black text-slate-700">
                          {item.actualQuantity ?? "—"}
                          {item.actualQuantity !== null && (
                            <span className="text-xs text-slate-400 ml-1">
                              {item.part.unit}
                            </span>
                          )}
                        </span>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              value={
                                actualVal === null || actualVal === undefined
                                  ? ""
                                  : actualVal
                              }
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.partId,
                                  e.target.value
                                )
                              }
                              placeholder="Gir..."
                              className="w-24 text-center px-2 py-1.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none bg-slate-50"
                            />
                            {isSaving && (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                              </div>
                            )}
                          </div>
                          {itemError && (
                            <span className="text-xs text-red-500">
                              {itemError}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {displayDiff === null ? (
                        <span className="text-slate-300">—</span>
                      ) : displayDiff === 0 ? (
                        <span className="inline-flex items-center gap-1 text-slate-500 font-bold">
                          <Minus className="w-3.5 h-3.5" />0
                        </span>
                      ) : displayDiff > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-black">
                          <TrendingUp className="w-3.5 h-3.5" />+{displayDiff}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 font-black">
                          <TrendingDown className="w-3.5 h-3.5" />
                          {displayDiff}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF İçeriği (gizli, export için) */}
      <div
        id="stock-count-pdf-content"
        className="fixed -left-[9999px] top-0 w-[800px] bg-white p-8 text-sm"
        aria-hidden="true"
      >
        {/* PDF Başlık */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <h1 className="text-2xl font-black text-slate-900">
            Stok Sayım Fark Raporu
          </h1>
          <div className="flex gap-6 mt-2 text-slate-600 text-xs">
            <span>
              Sayım No: #{count.id.slice(-6).toUpperCase()}
            </span>
            <span>
              Tarih: {dayjs(count.createdAt).format("DD MMMM YYYY, HH:mm")}
            </span>
            <span>
              Lokasyon: {count.location?.name ?? "Tüm Lokasyonlar"}
            </span>
            <span>Durum: {statusCfg.label}</span>
          </div>
          {count.completedAt && (
            <div className="text-xs text-slate-500 mt-1">
              Tamamlanma: {dayjs(count.completedAt).format("DD MMMM YYYY, HH:mm")}
            </div>
          )}
        </div>

        {/* Özet */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500 font-bold uppercase">
              Toplam Kalem
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {summary.totalItems}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500 font-bold uppercase">
              Tamamlanma
            </div>
            <div className="text-2xl font-black text-blue-600 mt-1">
              %{summary.completionPercentage}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500 font-bold uppercase">
              Fark Olan
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {summary.itemsWithDifference}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500 font-bold uppercase">
              Fark Değeri
            </div>
            <div
              className={`text-xl font-black mt-1 ${
                summary.totalDifferenceValue >= 0
                  ? "text-emerald-600"
                  : "text-red-600"
              }`}
            >
              {formatMoney(summary.totalDifferenceValue)}
            </div>
          </div>
        </div>

        {/* Kalem Tablosu */}
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="px-3 py-2 text-left font-bold">Parça Adı</th>
              <th className="px-3 py-2 text-left font-bold">Parça No</th>
              <th className="px-3 py-2 text-left font-bold">Kategori</th>
              <th className="px-3 py-2 text-center font-bold">Sistem</th>
              <th className="px-3 py-2 text-center font-bold">Fiili</th>
              <th className="px-3 py-2 text-center font-bold">Fark</th>
              <th className="px-3 py-2 text-right font-bold">Fark Değeri</th>
            </tr>
          </thead>
          <tbody>
            {count.items.map((item, idx) => {
              const diff =
                item.actualQuantity !== null
                  ? item.actualQuantity - item.systemQuantity
                  : null;
              const purchasePrice = Number(item.part.purchasePrice ?? 0);
              const diffValue = diff !== null ? diff * purchasePrice : 0;

              return (
                <tr
                  key={item.id}
                  className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                >
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {item.part.name}
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {item.part.partNumber}
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {item.part.category?.name ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-center font-bold text-slate-700">
                    {item.systemQuantity}
                  </td>
                  <td className="px-3 py-2 text-center font-bold text-slate-700">
                    {item.actualQuantity ?? "—"}
                  </td>
                  <td
                    className={`px-3 py-2 text-center font-black ${
                      diff === null
                        ? "text-slate-300"
                        : diff > 0
                          ? "text-emerald-600"
                          : diff < 0
                            ? "text-red-600"
                            : "text-slate-500"
                    }`}
                  >
                    {diff === null
                      ? "—"
                      : diff > 0
                        ? `+${diff}`
                        : diff}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-bold ${
                      diffValue > 0
                        ? "text-emerald-600"
                        : diffValue < 0
                          ? "text-red-600"
                          : "text-slate-400"
                    }`}
                  >
                    {diff !== null ? formatMoney(diffValue) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-900 text-white font-black">
              <td colSpan={5} className="px-3 py-2 text-right">
                Toplam Fark Değeri:
              </td>
              <td className="px-3 py-2 text-center">
                {summary.itemsWithDifference}
              </td>
              <td className="px-3 py-2 text-right">
                {formatMoney(summary.totalDifferenceValue)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-400 flex justify-between">
          <span>MS Oto Servis — Stok Sayım Raporu</span>
          <span>
            Oluşturulma: {dayjs().format("DD MMMM YYYY, HH:mm")}
          </span>
        </div>
      </div>
    </div>
  );
}
