"use client";

import { useState } from "react";
import { Download, FileText, TrendingUp, Package, DollarSign, ChevronDown, ChevronRight } from "lucide-react";
import { exportElementToPdf } from "@/lib/pdf-utils";
import { exportToCsv } from "@/lib/csv-utils";

interface StockValueCategory {
  categoryId: string;
  categoryName: string;
  partCount: number;
  totalStock: number;
  totalValue: number;
  parts: Array<{
    id: string;
    name: string;
    partNumber: string;
    currentStock: number;
    purchasePrice: number;
    stockValue: number;
  }>;
}

interface StockValueSummary {
  totalCategories: number;
  totalPartTypes: number;
  grandTotalStock: number;
  grandTotalValue: number;
}

interface StockValueReportProps {
  categories: StockValueCategory[];
  summary: StockValueSummary;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(value);
}

function exportToCSV(categories: StockValueCategory[], summary: StockValueSummary) {
  const rows: Record<string, string | number>[] = [];

  for (const cat of categories) {
    for (const part of cat.parts) {
      rows.push({
        Kategori: cat.categoryName,
        "Parça Adı": part.name,
        "Parça No": part.partNumber,
        "Mevcut Stok": part.currentStock,
        "Alış Fiyatı (₺)": part.purchasePrice.toFixed(2),
        "Stok Değeri (₺)": part.stockValue.toFixed(2),
      });
    }
  }

  // Genel toplam satırı
  rows.push({
    Kategori: "GENEL TOPLAM",
    "Parça Adı": "",
    "Parça No": "",
    "Mevcut Stok": summary.grandTotalStock,
    "Alış Fiyatı (₺)": "",
    "Stok Değeri (₺)": summary.grandTotalValue.toFixed(2),
  });

  exportToCsv(rows, `stok-deger-raporu-${new Date().toISOString().slice(0, 10)}.csv`);
}

export default function StockValueReport({ categories, summary }: StockValueReportProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handlePdfExport = async () => {
    setIsExportingPdf(true);
    try {
      await exportElementToPdf("stock-value-report-content", {
        filename: `stok-deger-raporu-${new Date().toISOString().slice(0, 10)}.pdf`,
        orientation: "l",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kategori</span>
          </div>
          <span className="text-3xl font-black text-slate-900">{summary.totalCategories}</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Parça Tipi</span>
          </div>
          <span className="text-3xl font-black text-slate-900">{summary.totalPartTypes}</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Toplam Stok</span>
          </div>
          <span className="text-3xl font-black text-slate-900">{summary.grandTotalStock.toLocaleString("tr-TR")}</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Toplam Değer</span>
          </div>
          <span className="text-2xl font-black text-amber-600">{formatCurrency(summary.grandTotalValue)}</span>
        </div>
      </div>

      {/* Export Butonları */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => exportToCSV(categories, summary)}
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
      <div id="stock-value-report-content" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-black text-slate-700 text-sm">Kategori Bazlı Stok Değeri</h3>
          <p className="text-xs text-slate-400 mt-0.5">Tarih: {new Date().toLocaleDateString("tr-TR")}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Kategori / Parça</th>
                <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Parça Sayısı</th>
                <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Toplam Stok</th>
                <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Toplam Değer</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400 text-sm">
                    Stok verisi bulunamadı.
                  </td>
                </tr>
              ) : (
                <>
                  {categories.map((cat) => {
                    const isExpanded = expandedCategories.has(cat.categoryId);
                    return (
                      <>
                        {/* Kategori Satırı */}
                        <tr
                          key={cat.categoryId}
                          className="border-b border-slate-50 bg-slate-50/50 hover:bg-slate-100/50 cursor-pointer transition-colors"
                          onClick={() => toggleCategory(cat.categoryId)}
                        >
                          <td className="px-4 py-3 font-black text-slate-700 flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                            {cat.categoryName}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-600">{cat.partCount}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-600">{cat.totalStock.toLocaleString("tr-TR")}</td>
                          <td className="px-4 py-3 text-right font-black text-amber-600">{formatCurrency(cat.totalValue)}</td>
                        </tr>
                        {/* Parça Detay Satırları */}
                        {isExpanded &&
                          cat.parts.map((part) => (
                            <tr key={part.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                              <td className="px-4 py-2.5 pl-12 text-slate-600">
                                <span className="font-medium">{part.name}</span>
                                <span className="ml-2 text-xs text-slate-400">#{part.partNumber}</span>
                              </td>
                              <td className="px-4 py-2.5 text-right text-slate-500">—</td>
                              <td className="px-4 py-2.5 text-right text-slate-600">{part.currentStock.toLocaleString("tr-TR")}</td>
                              <td className="px-4 py-2.5 text-right text-slate-600">{formatCurrency(part.stockValue)}</td>
                            </tr>
                          ))}
                      </>
                    );
                  })}
                  {/* Genel Toplam */}
                  <tr className="border-t-2 border-slate-200 bg-amber-50/50">
                    <td className="px-4 py-3 font-black text-slate-900">GENEL TOPLAM</td>
                    <td className="px-4 py-3 text-right font-black text-slate-900">{summary.totalPartTypes}</td>
                    <td className="px-4 py-3 text-right font-black text-slate-900">{summary.grandTotalStock.toLocaleString("tr-TR")}</td>
                    <td className="px-4 py-3 text-right font-black text-amber-600 text-base">{formatCurrency(summary.grandTotalValue)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
