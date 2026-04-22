"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, Download, Loader2, AlertCircle } from "lucide-react";

interface GelirData {
  month: string;
  total: number;
  breakdown: { labor: number; parts: number; other: number };
}

const CATEGORIES = [
  { key: "labor" as const, label: "İşçilik", color: "bg-[#00236f]" },
  { key: "parts" as const, label: "Parça", color: "bg-[#006c49]" },
  { key: "other" as const, label: "Diğer", color: "bg-gray-400" },
];

function formatMoney(val: number) {
  return `₺${val.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`;
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function GelirRaporuClient() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [data, setData] = useState<GelirData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (m: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mobile/firma/finans/gelir-raporu?month=${m}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Yüklenemedi.");
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(month);
  }, [month, fetchData]);

  async function handlePdfDownload() {
    if (!data) return;
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Gelir Raporu", 20, 20);
    doc.setFontSize(12);
    doc.text(`Dönem: ${data.month}`, 20, 35);
    doc.text(`Toplam Gelir: ${formatMoney(data.total)}`, 20, 50);
    doc.text(`İşçilik: ${formatMoney(data.breakdown.labor)}`, 20, 65);
    doc.text(`Parça: ${formatMoney(data.breakdown.parts)}`, 20, 80);
    doc.text(`Diğer: ${formatMoney(data.breakdown.other)}`, 20, 95);
    doc.save(`gelir-raporu-${data.month}.pdf`);
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#00236f]">Gelir Raporu</h1>
          <p className="text-sm text-gray-500 mt-0.5">Aylık gelir dağılımı</p>
        </div>
        <button
          onClick={handlePdfDownload}
          disabled={!data || loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#00236f] text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Download className="w-4 h-4" />
          PDF
        </button>
      </div>

      {/* Ay Seçici */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
          Dönem
        </label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/30 focus:border-[#00236f] outline-none"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      ) : data ? (
        <>
          {/* Toplam Hero */}
          <div className="bg-gradient-to-br from-[#00236f] to-[#1e3a8a] rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-[#6cf8bb]" />
              <p className="text-blue-200 text-sm font-medium">Toplam Gelir</p>
            </div>
            <p className="text-4xl font-black">{formatMoney(data.total)}</p>
            <p className="text-blue-200 text-xs mt-1">{data.month}</p>
          </div>

          {/* Kategori Dağılımı */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-700">Kategori Dağılımı</h3>
            {CATEGORIES.map((cat) => {
              const val = data.breakdown[cat.key];
              const pct = data.total > 0 ? (val / data.total) * 100 : 0;
              return (
                <div key={cat.key} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{cat.label}</span>
                    <span className="font-bold text-gray-900">{formatMoney(val)}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`${cat.color} h-full rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-right">%{pct.toFixed(1)}</p>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
