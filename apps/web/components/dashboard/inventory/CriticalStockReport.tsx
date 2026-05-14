"use client";

import React, { useState } from "react";
import { Download, FileText, AlertTriangle, AlertCircle, Phone, Mail, User } from "lucide-react";
import { exportElementToPdf } from "@/lib/pdf-utils";
import { exportToCsv } from "@/lib/csv-utils";

interface CriticalPart {
  id: string;
  name: string;
  partNumber: string;
  currentStock: number;
  minStockLevel: number;
  deficit: number;
  purchasePrice: number;
  category: { id: string; name: string } | null;
  supplier: {
    id: string;
    name: string;
    contactPerson: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  location: { id: string; name: string } | null;
}

interface CriticalStockSummary {
  totalCritical: number;
  outOfStock: number;
  belowMinimum: number;
}

interface CriticalStockReportProps {
  parts: CriticalPart[];
  summary: CriticalStockSummary;
}

function exportToCSV(parts: CriticalPart[]) {
  const rows = parts.map((p) => ({
    "Parça Adı": p.name,
    "Parça No": p.partNumber,
    Kategori: p.category?.name ?? "—",
    "Mevcut Stok": p.currentStock,
    "Min. Stok": p.minStockLevel,
    Açık: p.deficit,
    Durum: p.currentStock === 0 ? "Stok Tükendi" : "Kritik Seviye",
    Tedarikçi: p.supplier?.name ?? "—",
    "Tedarikçi Tel": p.supplier?.phone ?? "—",
    "Tedarikçi E-posta": p.supplier?.email ?? "—",
    Lokasyon: p.location?.name ?? "—",
  }));

  exportToCsv(rows, `kritik-stok-raporu-${new Date().toISOString().slice(0, 10)}.csv`);
}

export default function CriticalStockReport({ parts, summary }: CriticalStockReportProps) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);

  const handlePdfExport = async () => {
    setIsExportingPdf(true);
    try {
      await exportElementToPdf("critical-stock-report-content", {
        filename: `kritik-stok-raporu-${new Date().toISOString().slice(0, 10)}.pdf`,
        orientation: "l",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Toplam Kritik</span>
          </div>
          <span className="text-3xl font-black text-amber-600">{summary.totalCritical}</span>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Stok Tükendi</span>
          </div>
          <span className="text-3xl font-black text-red-600">{summary.outOfStock}</span>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-orange-50 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Min. Altında</span>
          </div>
          <span className="text-3xl font-black text-orange-500">{summary.belowMinimum}</span>
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

      {/* Tablo */}
      <div id="critical-stock-report-content" className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 dark:bg-gray-800/50">
          <h3 className="font-black text-slate-700 dark:text-gray-300 text-sm">Kritik Stok Listesi</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Tarih: {new Date().toLocaleDateString("tr-TR")}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-gray-700">
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Parça</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Kategori</th>
                <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Mevcut</th>
                <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Min. Stok</th>
                <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Açık</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Durum</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Tedarikçi</th>
              </tr>
            </thead>
            <tbody>
              {parts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      Kritik stok seviyesinde parça bulunmuyor.
                    </div>
                  </td>
                </tr>
              ) : (
                parts.map((part) => {
                  const isOutOfStock = part.currentStock === 0;
                  const isExpanded = expandedSupplier === part.id;

                  return (
                    <React.Fragment key={part.id}>
                      <tr
                        className={`border-b border-slate-50 transition-colors ${
                          isOutOfStock ? "bg-red-50/40 hover:bg-red-50/60" : "bg-amber-50/30 hover:bg-amber-50/50"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-700 dark:text-gray-300">{part.name}</span>
                          <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">#{part.partNumber}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{part.category?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`font-black text-base ${
                              isOutOfStock ? "text-red-600" : "text-amber-600"
                            }`}
                          >
                            {part.currentStock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-400">{part.minStockLevel}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-black text-red-600">-{part.deficit}</span>
                        </td>
                        <td className="px-4 py-3">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-700 dark:text-red-400">
                              <AlertCircle className="w-3 h-3" />
                              Tükendi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-700">
                              <AlertTriangle className="w-3 h-3" />
                              Kritik
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {part.supplier ? (
                            <button
                              onClick={() => setExpandedSupplier(isExpanded ? null : part.id)}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium text-sm underline-offset-2 hover:underline transition-colors"
                            >
                              {part.supplier.name}
                            </button>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                      {/* Tedarikçi Detay Satırı */}
                      {isExpanded && part.supplier && (
                        <tr key={`${part.id}-supplier`} className="border-b border-slate-50 bg-blue-50 dark:bg-blue-900/30/30">
                          <td colSpan={7} className="px-4 py-3 pl-12">
                            <div className="flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                <span className="font-medium">{part.supplier.contactPerson ?? "—"}</span>
                              </div>
                              {part.supplier.phone && (
                                <a
                                  href={`tel:${part.supplier.phone}`}
                                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  {part.supplier.phone}
                                </a>
                              )}
                              {part.supplier.email && (
                                <a
                                  href={`mailto:${part.supplier.email}`}
                                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  {part.supplier.email}
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
