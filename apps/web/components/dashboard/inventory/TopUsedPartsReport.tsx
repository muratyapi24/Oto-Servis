"use client";

import { useState, useTransition } from "react";
import { Download, FileText, BarChart2, Calendar } from "lucide-react";
import { getTopUsedParts } from "@/lib/actions/inventory.actions";
import { exportElementToPdf } from "@/lib/pdf-utils";
import { exportToCsv } from "@/lib/csv-utils";

interface TopPart {
  partId: string;
  name: string;
  partNumber: string;
  category: { id: string; name: string } | null;
  currentStock: number;
  purchasePrice: number;
  sellingPrice: number;
  totalUsedQuantity: number;
  movementCount: number;
}

interface TopUsedPartsReportProps {
  initialParts: TopPart[];
  initialDateRange: { startDate: string; endDate: string };
}

const PRESET_RANGES = [
  { label: "Son 7 Gün", days: 7 },
  { label: "Son 30 Gün", days: 30 },
  { label: "Son 90 Gün", days: 90 },
  { label: "Son 1 Yıl", days: 365 },
];

function getDateRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function exportToCSV(parts: TopPart[]) {
  const rows = parts.map((p, i) => ({
    Sıra: i + 1,
    "Parça Adı": p.name,
    "Parça No": p.partNumber,
    Kategori: p.category?.name ?? "—",
    "Kullanım Miktarı": p.totalUsedQuantity,
    "Hareket Sayısı": p.movementCount,
    "Mevcut Stok": p.currentStock,
  }));

  exportToCsv(rows, `en-cok-kullanilan-parcalar-${new Date().toISOString().slice(0, 10)}.csv`);
}

export default function TopUsedPartsReport({
  initialParts,
  initialDateRange,
}: TopUsedPartsReportProps) {
  const [parts, setParts] = useState<TopPart[]>(initialParts);
  const [startDate, setStartDate] = useState(initialDateRange.startDate);
  const [endDate, setEndDate] = useState(initialDateRange.endDate);
  const [activePreset, setActivePreset] = useState(30);
  const [isPending, startTransition] = useTransition();
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const maxQuantity = parts.length > 0 ? Math.max(...parts.map((p) => p.totalUsedQuantity)) : 1;

  const fetchData = (start: string, end: string) => {
    startTransition(async () => {
      const result = await getTopUsedParts(
        { startDate: new Date(start), endDate: new Date(end + "T23:59:59") },
        20
      );
      if (result.success && result.data) {
        setParts((result.data.parts as TopPart[]).filter(Boolean));
      }
    });
  };

  const handlePreset = (days: number) => {
    const range = getDateRange(days);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setActivePreset(days);
    fetchData(range.startDate, range.endDate);
  };

  const handleCustomSearch = () => {
    setActivePreset(0);
    fetchData(startDate, endDate);
  };

  const handlePdfExport = async () => {
    setIsExportingPdf(true);
    try {
      await exportElementToPdf("top-used-parts-content", {
        filename: `en-cok-kullanilan-parcalar-${new Date().toISOString().slice(0, 10)}.pdf`,
        orientation: "l",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tarih Aralığı Seçimi */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-black text-slate-600">Tarih Aralığı</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_RANGES.map((preset) => (
            <button
              key={preset.days}
              onClick={() => handlePreset(preset.days)}
              className={`px-4 py-1.5 rounded-xl text-sm font-black transition-all ${
                activePreset === preset.days
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Başlangıç
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Bitiş
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <button
            onClick={handleCustomSearch}
            disabled={isPending}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl text-sm font-black shadow-sm transition-all disabled:opacity-60"
          >
            <BarChart2 className="w-4 h-4" />
            {isPending ? "Yükleniyor..." : "Uygula"}
          </button>
        </div>
      </div>

      {/* Export Butonları */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => exportToCSV(parts)}
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

      {/* Bar Chart + Tablo */}
      <div id="top-used-parts-content" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-black text-slate-700 text-sm">En Çok Kullanılan Parçalar</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date(startDate).toLocaleDateString("tr-TR")} — {new Date(endDate).toLocaleDateString("tr-TR")}
          </p>
        </div>

        {isPending ? (
          <div className="py-16 text-center text-slate-400 text-sm">Yükleniyor...</div>
        ) : parts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Bu tarih aralığında kullanım verisi bulunamadı.
          </div>
        ) : (
          <div className="p-6 space-y-3">
            {parts.map((part, index) => {
              const barWidth = maxQuantity > 0 ? (part.totalUsedQuantity / maxQuantity) * 100 : 0;
              const barColor =
                index === 0
                  ? "bg-amber-500"
                  : index === 1
                  ? "bg-amber-400"
                  : index === 2
                  ? "bg-amber-300"
                  : "bg-slate-200";

              return (
                <div key={part.partId} className="flex items-center gap-4">
                  {/* Sıra */}
                  <span className="w-6 text-right text-xs font-black text-slate-400 flex-shrink-0">
                    {index + 1}
                  </span>
                  {/* Parça Bilgisi */}
                  <div className="w-48 flex-shrink-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{part.name}</p>
                    <p className="text-xs text-slate-400">#{part.partNumber}</p>
                  </div>
                  {/* Bar */}
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor} flex items-center justify-end pr-2`}
                        style={{ width: `${Math.max(barWidth, 2)}%` }}
                      >
                        {barWidth > 15 && (
                          <span className="text-xs font-black text-white">
                            {part.totalUsedQuantity}
                          </span>
                        )}
                      </div>
                    </div>
                    {barWidth <= 15 && (
                      <span className="text-sm font-black text-slate-700 w-12 text-right">
                        {part.totalUsedQuantity}
                      </span>
                    )}
                  </div>
                  {/* Hareket Sayısı */}
                  <div className="w-24 text-right flex-shrink-0">
                    <span className="text-xs text-slate-400">{part.movementCount} hareket</span>
                  </div>
                  {/* Mevcut Stok */}
                  <div className="w-24 text-right flex-shrink-0">
                    <span
                      className={`text-xs font-bold ${
                        part.currentStock === 0
                          ? "text-red-600"
                          : part.currentStock < 5
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }`}
                    >
                      Stok: {part.currentStock}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
