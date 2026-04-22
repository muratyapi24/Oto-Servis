"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, CheckCircle2, Clock, ChevronRight } from "lucide-react";

interface MechanicPerf {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  specialties: string[];
  dailyTarget: number | null;
  completed: number;
  avgDurationMinutes: number;
  avgRating: number | null;
}

type Period = "all" | "week" | "month";

export default function PersonelPerformansClient({
  mechanics,
}: {
  mechanics: MechanicPerf[];
}) {
  const [period, setPeriod] = useState<Period>("all");

  // Dönem filtresi — gerçek uygulamada API'den çekilir; burada UI gösterimi için
  const sorted = [...mechanics].sort((a, b) => b.completed - a.completed);

  return (
    <div className="space-y-5 pb-8">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-black text-[#00236f]">Personel Performansı</h1>
        <p className="text-sm text-gray-500 mt-0.5">Usta bazlı iş metrikleri</p>
      </div>

      {/* Dönem Filtresi */}
      <div className="inline-flex p-1 bg-gray-100 rounded-xl gap-1">
        {(["all", "week", "month"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              period === p
                ? "bg-white text-[#00236f] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {p === "all" ? "Tümü" : p === "week" ? "Bu Hafta" : "Bu Ay"}
          </button>
        ))}
      </div>

      {/* Performans Kartları */}
      {sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Aktif personel bulunamadı.
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((m, idx) => {
            const initials = `${m.firstName[0]}${m.lastName[0]}`.toUpperCase();
            const durationText =
              m.avgDurationMinutes > 0
                ? m.avgDurationMinutes >= 60
                  ? `${Math.floor(m.avgDurationMinutes / 60)}s ${m.avgDurationMinutes % 60}dk`
                  : `${m.avgDurationMinutes} dk`
                : "—";

            return (
              <Link
                key={m.id}
                href={`/m/firma/personel/${m.id}`}
                className="flex items-center gap-4 bg-white rounded-2xl border border-gray-200 p-4 hover:border-[#00236f]/30 hover:shadow-sm transition-all group"
              >
                {/* Sıra */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    idx === 0
                      ? "bg-yellow-100 text-yellow-700"
                      : idx === 1
                      ? "bg-gray-100 text-gray-600"
                      : idx === 2
                      ? "bg-orange-100 text-orange-600"
                      : "bg-gray-50 text-gray-400"
                  }`}
                >
                  {idx + 1}
                </div>

                {/* Avatar */}
                <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0">
                  {m.avatarUrl ? (
                    <Image
                      src={m.avatarUrl}
                      alt={`${m.firstName} ${m.lastName}`}
                      width={44}
                      height={44}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                      <span className="text-sm font-black text-[#00236f]">{initials}</span>
                    </div>
                  )}
                </div>

                {/* Bilgi */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">
                    {m.firstName} {m.lastName}
                  </p>
                  {m.specialties?.length > 0 && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {m.specialties.slice(0, 2).join(", ")}
                    </p>
                  )}
                  {/* Metrikler */}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-gray-600">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      <strong>{m.completed}</strong> tamamlandı
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock className="w-3 h-3 text-blue-400" />
                      {durationText}
                    </span>
                    {m.avgRating !== null && (
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        {m.avgRating}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#00236f] transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
