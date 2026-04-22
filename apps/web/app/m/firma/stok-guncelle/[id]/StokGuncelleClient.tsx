"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

type MovementType = "IN" | "OUT" | "ADJUST";

interface Part {
  id: string;
  name: string;
  partNumber: string;
  currentStock: number;
  minStockLevel: number;
  unit: string;
}

const MOVEMENT_OPTIONS: { type: MovementType; label: string; desc: string; color: string; icon: React.ReactNode }[] = [
  {
    type: "IN",
    label: "Giriş",
    desc: "Stok artışı (alım, iade)",
    color: "border-green-400 bg-green-50 text-green-700",
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    type: "OUT",
    label: "Çıkış",
    desc: "Stok azalışı (kullanım, satış)",
    color: "border-red-400 bg-red-50 text-red-700",
    icon: <TrendingDown className="w-5 h-5" />,
  },
  {
    type: "ADJUST",
    label: "Düzeltme",
    desc: "Sayım farkı düzeltmesi",
    color: "border-yellow-400 bg-yellow-50 text-yellow-700",
    icon: <RefreshCw className="w-5 h-5" />,
  },
];

export default function StokGuncelleClient({ part }: { part: Part }) {
  const router = useRouter();
  const [movementType, setMovementType] = useState<MovementType>("IN");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newStock, setNewStock] = useState<number | null>(null);

  const qty = parseInt(quantity) || 0;
  const isOutInsufficient = movementType === "OUT" && qty > part.currentStock;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (qty <= 0) {
      setError("Miktar sıfırdan büyük olmalıdır.");
      return;
    }
    if (isOutInsufficient) {
      setError("Yetersiz stok.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/mobile/firma/stok/guncelle/${part.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty, type: movementType, reason: reason || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Güncelleme başarısız.");
      } else {
        const delta =
          movementType === "IN" ? qty : movementType === "OUT" ? -qty : 0;
        setNewStock(part.currentStock + delta);
        setSuccess(true);
        setTimeout(() => router.push("/m/firma/stok-hareketler"), 2000);
      }
    } catch {
      setError("Beklenmeyen bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Stok Güncellendi</h2>
        {newStock !== null && (
          <p className="text-sm text-gray-500">
            Yeni stok: <strong className="text-gray-800">{newStock} {part.unit}</strong>
          </p>
        )}
        <p className="text-xs text-gray-400">Stok hareketlerine yönlendiriliyorsunuz...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Geri */}
      <Link
        href="/m/firma/stok"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Stoka Dön
      </Link>

      {/* Parça Bilgisi */}
      <div className="bg-gradient-to-br from-[#00236f] to-[#1e3a8a] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black">{part.name}</h2>
            <p className="text-blue-200 text-xs font-mono">{part.partNumber}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-black">{part.currentStock}</p>
            <p className="text-blue-200 text-[10px] uppercase tracking-wider">Mevcut</p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-black">{part.minStockLevel}</p>
            <p className="text-blue-200 text-[10px] uppercase tracking-wider">Minimum</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hareket Tipi */}
        <div className="space-y-2">
          <p className="text-sm font-bold text-gray-700">Hareket Tipi *</p>
          <div className="grid grid-cols-3 gap-2">
            {MOVEMENT_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => setMovementType(opt.type)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                  movementType === opt.type
                    ? opt.color + " border-current"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                {opt.icon}
                <span className="text-xs font-bold">{opt.label}</span>
                <span className="text-[10px] text-center leading-tight opacity-70">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Miktar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          <label className="text-sm font-bold text-gray-700">Miktar *</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={`w-full p-3 bg-gray-50 border rounded-xl text-sm focus:ring-2 outline-none transition-colors ${
              isOutInsufficient
                ? "border-red-300 focus:ring-red-200"
                : "border-gray-300 focus:ring-[#00236f]/30 focus:border-[#00236f]"
            }`}
          />
          {isOutInsufficient && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5" />
              Geçersiz miktar. Mevcut stok: {part.currentStock} {part.unit}
            </div>
          )}
        </div>

        {/* Açıklama */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          <label className="text-sm font-bold text-gray-700">Açıklama (opsiyonel)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Hareket nedeni..."
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/30 focus:border-[#00236f] outline-none"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || isOutInsufficient || qty <= 0}
          className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-500 to-[#1e3a8a] text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Güncelleniyor...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Stoku Güncelle
            </>
          )}
        </button>
      </form>
    </div>
  );
}
