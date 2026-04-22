"use client";

import { Star } from "lucide-react";

interface RatingMetricsSectionProps {
  average: number;
  total: number;
  distribution: Record<string, number>;
}

export default function RatingMetricsSection({
  average,
  total,
  distribution,
}: RatingMetricsSectionProps) {
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="bg-white p-6 rounded-3xl ambient-shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-on-surface">Müşteri Memnuniyeti</h3>
        <span className="text-xs font-bold text-slate-400">Son 30 Gün</span>
      </div>

      {total === 0 ? (
        <div className="text-center py-8">
          <Star className="w-8 h-8 mx-auto text-slate-200 mb-2" />
          <p className="text-sm text-slate-400">Henüz değerlendirme yok.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Ortalama Puan */}
          <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl">
            <div className="text-center">
              <p className="text-4xl font-black text-on-surface">{average.toFixed(1)}</p>
              <div className="flex items-center gap-0.5 mt-1 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(average)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-on-surface">{total} değerlendirme</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Son 30 günlük ortalama</p>
            </div>
          </div>

          {/* Puan Dağılımı */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[String(star)] ?? 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12 shrink-0">
                    <span className="text-xs font-bold text-slate-600">{star}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-yellow-400 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-500 w-6 text-right shrink-0">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
