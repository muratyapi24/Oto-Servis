"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
  History,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/tr";

interface Movement {
  id: string;
  partName: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  reason: string | null;
  date: string;
}

const TYPE_CONFIG = {
  IN: {
    label: "GİRİŞ",
    cls: "bg-green-100 text-green-700",
    borderCls: "border-l-green-400",
    icon: <TrendingUp className="w-4 h-4 text-green-600" />,
  },
  OUT: {
    label: "ÇIKIŞ",
    cls: "bg-red-100 text-red-700",
    borderCls: "border-l-red-400",
    icon: <TrendingDown className="w-4 h-4 text-red-600" />,
  },
  ADJUST: {
    label: "DÜZELTME",
    cls: "bg-yellow-100 text-yellow-700",
    borderCls: "border-l-yellow-400",
    icon: <RefreshCw className="w-4 h-4 text-yellow-600" />,
  },
};

const LIMIT = 20;

export default function StokHareketlerClient() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(async (pageNum: number, reset = false) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/mobile/firma/stok/hareketler?page=${pageNum}&limit=${LIMIT}`
      );
      const data = await res.json();
      const items: Movement[] = (data.movements ?? []).map((m: any) => ({
        id: m.id,
        partName: m.partName,
        type: m.type,
        quantity: Number(m.quantity),
        reason: m.reason,
        date: m.date,
      }));
      if (reset) {
        setMovements(items);
      } else {
        setMovements((prev) => [...prev, ...items]);
      }
      setHasMore(items.length === LIMIT);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  // Infinite scroll — IntersectionObserver
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPage(nextPage);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchPage]);

  return (
    <div className="space-y-5 pb-8">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#00236f]">Stok Hareketleri</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tüm giriş, çıkış ve düzeltmeler</p>
        </div>
        <Link
          href="/m/firma/depolar"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Depolar
        </Link>
      </div>

      {/* Renk Açıklaması */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
          <span
            key={type}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${cfg.cls}`}
          >
            {cfg.icon}
            {cfg.label}
          </span>
        ))}
      </div>

      {/* Liste */}
      {initialLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : movements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <History className="w-8 h-8 text-gray-300" />
          <p className="text-sm font-bold text-gray-500">Stok hareketi bulunamadı</p>
        </div>
      ) : (
        <div className="space-y-2">
          {movements.map((mov) => {
            const cfg = TYPE_CONFIG[mov.type] ?? TYPE_CONFIG.ADJUST;
            return (
              <div
                key={mov.id}
                className={`bg-white rounded-xl border border-gray-200 border-l-4 ${cfg.borderCls} p-4 flex items-center gap-3`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.cls}`}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{mov.partName}</p>
                  {mov.reason && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{mov.reason}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {dayjs(mov.date).locale("tr").format("DD MMM YYYY HH:mm")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`text-lg font-black font-mono ${
                      mov.type === "IN"
                        ? "text-green-600"
                        : mov.type === "OUT"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {mov.type === "IN" ? "+" : mov.type === "OUT" ? "-" : "±"}
                    {mov.quantity}
                  </p>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cfg.cls}`}>
                    {cfg.label}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Infinite scroll tetikleyici */}
          <div ref={loaderRef} className="flex items-center justify-center py-4">
            {loading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
            {!hasMore && movements.length > 0 && (
              <p className="text-xs text-gray-400">Tüm hareketler yüklendi.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
