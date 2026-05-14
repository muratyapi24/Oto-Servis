"use client";

import { useState, useTransition } from "react";
import { Search, Download, FileText, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { getStockMovementReport } from "@/lib/actions/inventory.actions";
import { exportElementToPdf } from "@/lib/pdf-utils";
import { exportToCsv } from "@/lib/csv-utils";

interface Movement {
  id: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  reason: string | null;
  createdAt: Date;
  part: {
    id: string;
    name: string;
    partNumber: string;
    unit: string;
  };
  location: { id: string; name: string } | null;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface MovementHistoryReportProps {
  initialMovements: Movement[];
  initialPagination: Pagination;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  IN: { label: "Giriş", color: "bg-emerald-100 text-emerald-700" },
  OUT: { label: "Çıkış", color: "bg-red-100 text-red-700" },
  ADJUST: { label: "Düzeltme", color: "bg-amber-100 text-amber-700" },
};

function exportToCSV(movements: Movement[]) {
  const rows = movements.map((m) => ({
    Tarih: new Date(m.createdAt).toLocaleString("tr-TR"),
    "Parça Adı": m.part.name,
    "Parça No": m.part.partNumber,
    Tip: TYPE_LABELS[m.type]?.label ?? m.type,
    Miktar: m.quantity,
    Birim: m.part.unit,
    Lokasyon: m.location?.name ?? "—",
    Açıklama: m.reason ?? "—",
  }));

  exportToCsv(rows, `hareket-gecmisi-${new Date().toISOString().slice(0, 10)}.csv`);
}

export default function MovementHistoryReport({
  initialMovements,
  initialPagination,
}: MovementHistoryReportProps) {
  const [movements, setMovements] = useState<Movement[]>(initialMovements);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [isPending, startTransition] = useTransition();
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Filtreler
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [partName, setPartName] = useState("");
  const [type, setType] = useState<"" | "IN" | "OUT" | "ADJUST">("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchMovements = (page = 1) => {
    startTransition(async () => {
      const result = await getStockMovementReport({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate + "T23:59:59") : undefined,
        type: type || undefined,
        page,
        pageSize: 20,
      });

      if (result.success && result.data) {
        // Filter by part name client-side (since action doesn't support partName filter directly)
        let filtered = result.data.movements as Movement[];
        if (partName.trim()) {
          const lower = partName.toLowerCase();
          filtered = filtered.filter(
            (m) =>
              m.part.name.toLowerCase().includes(lower) ||
              m.part.partNumber.toLowerCase().includes(lower)
          );
        }
        setMovements(filtered);
        setPagination(result.data.pagination);
        setCurrentPage(page);
      }
    });
  };

  const handleSearch = () => fetchMovements(1);

  const handlePageChange = (page: number) => {
    fetchMovements(page);
  };

  const handlePdfExport = async () => {
    setIsExportingPdf(true);
    try {
      await exportElementToPdf("movement-history-report-content", {
        filename: `hareket-gecmisi-${new Date().toISOString().slice(0, 10)}.pdf`,
        orientation: "l",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtreler */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span className="text-sm font-black text-slate-600 dark:text-slate-400">Filtreler</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
              Bitiş Tarihi
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
              Parça Adı / No
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                placeholder="Parça ara..."
                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
              Hareket Tipi
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "" | "IN" | "OUT" | "ADJUST")}
              className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">Tümü</option>
              <option value="IN">Giriş</option>
              <option value="OUT">Çıkış</option>
              <option value="ADJUST">Düzeltme</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSearch}
            disabled={isPending}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl text-sm font-black shadow-sm transition-all disabled:opacity-60"
          >
            <Search className="w-4 h-4" />
            {isPending ? "Aranıyor..." : "Ara"}
          </button>
        </div>
      </div>

      {/* Export Butonları */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => exportToCSV(movements)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-black shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          CSV İndir
        </button>
        <button
          onClick={handlePdfExport}
          disabled={isExportingPdf}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-black shadow-sm transition-all disabled:opacity-60"
        >
          <FileText className="w-4 h-4" />
          {isExportingPdf ? "Hazırlanıyor..." : "PDF İndir"}
        </button>
      </div>

      {/* Tablo */}
      <div id="movement-history-report-content" className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 dark:bg-gray-800/50 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-700 dark:text-gray-300 text-sm">Stok Hareket Geçmişi</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Toplam {pagination.total} kayıt</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-gray-700">
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Tarih</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Parça</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Tip</th>
                <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Miktar</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Lokasyon</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Açıklama</th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
                    Yükleniyor...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
                    Hareket kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  const typeInfo = TYPE_LABELS[m.type] ?? { label: m.type, color: "bg-slate-100 text-slate-600" };
                  return (
                    <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50 dark:bg-gray-800/50/50 transition-colors">
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleString("tr-TR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-700 dark:text-gray-300">{m.part.name}</span>
                        <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">#{m.part.partNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-700 dark:text-gray-300">
                        {m.type === "OUT" ? "-" : m.type === "IN" ? "+" : "±"}
                        {Math.abs(m.quantity)} {m.part.unit}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{m.location?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">{m.reason ?? "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Sayfalama */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-gray-700">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Sayfa {pagination.page} / {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isPending}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:bg-gray-800/50 disabled:opacity-40 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Önceki
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= pagination.totalPages || isPending}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:bg-gray-800/50 disabled:opacity-40 transition-all"
              >
                Sonraki
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
