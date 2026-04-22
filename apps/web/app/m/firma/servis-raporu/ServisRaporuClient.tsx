"use client";

import { useState } from "react";
import { Wrench, Star, BarChart3 } from "lucide-react";

interface StatusDist { status: string; count: number }
interface PeriodData {
  total: number;
  distribution: StatusDist[];
  avgRating: number;
  ratingCount: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Bekliyor", color: "bg-gray-400" },
  IN_PROGRESS: { label: "İşlemde", color: "bg-blue-500" },
  WAITING_APPROVAL: { label: "Onay Bekliyor", color: "bg-orange-400" },
  COMPLETED: { label: "Tamamlandı", color: "bg-green-500" },
  CANCELLED: { label: "İptal", color: "bg-red-400" },
};

export default function ServisRaporuClient({
  weekData,
  monthData,
}: {
  weekData: PeriodData;
  monthData: PeriodData;
}) {
  const [period, setPeriod] = useState<"week" | "month">("month");
  const data = period === "week" ? weekData : monthData;

  return (
    <div className="space-y-5 pb-8">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-black text-[#00236f]">Servis Raporu</h1>
        <p className="text-sm text-gray-500 mt-0.5">Operasyon metrikleri</p>
      </div>

      {/* Dönem Filtresi */}
      <div className="inline-flex p-1 bg-gray-100 rounded-xl gap-1">
        {(["week", "month"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              period === p
                ? "bg-white text-[#00236f] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {p === "week" ? "Bu Hafta" : "Bu Ay"}
          </button>
        ))}
      </div>

      {/* KPI Kartlar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-[#00236f] to-[#1e3a8a] rounded-2xl p-5 text-white">
          <Wrench className="w-5 h-5 text-blue-300 mb-3" />
          <p className="text-3xl font-black">{data.total}</p>
          <p className="text-blue-200 text-xs mt-1 uppercase tracking-wider">Toplam Servis</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <Star className="w-5 h-5 text-yellow-400 mb-3" />
          <p className="text-3xl font-black text-gray-900">
            {data.avgRating > 0 ? data.avgRating.toFixed(1) : "—"}
          </p>
          <p className="text-gray-400 text-xs mt-1 uppercase tracking-wider">
            Ort. Puan ({data.ratingCount})
          </p>
        </div>
      </div>

      {/* Statüs Dağılımı */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-gray-400" />
          Statüs Dağılımı
        </h3>
        {data.distribution.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Veri bulunamadı.</p>
        ) : (
          data.distribution.map((d) => {
            const cfg = STATUS_LABELS[d.status] ?? { label: d.status, color: "bg-gray-400" };
            const pct = data.total > 0 ? (d.count / data.total) * 100 : 0;
            return (
              <div key={d.status} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{cfg.label}</span>
                  <span className="font-bold text-gray-900">{d.count}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`${cfg.color} h-full rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 text-right">%{pct.toFixed(1)}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
