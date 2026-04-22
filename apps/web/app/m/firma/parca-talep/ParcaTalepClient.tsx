"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Warehouse,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface Location { id: string; name: string }
interface Part { id: string; name: string; partNumber: string; currentStock: number; unit: string }

interface ParcaTalepClientProps {
  locations: Location[];
  parts: Part[];
  serviceOrderId?: string;
}

export default function ParcaTalepClient({
  locations,
  parts,
  serviceOrderId,
}: ParcaTalepClientProps) {
  const router = useRouter();
  const [locationId, setLocationId] = useState("");
  const [partId, setPartId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedPart = parts.find((p) => p.id === partId);
  const qty = parseInt(quantity) || 0;
  const isInsufficient = selectedPart ? qty > selectedPart.currentStock : false;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!locationId || !partId || qty <= 0) {
      setError("Depo, parça ve miktar zorunludur.");
      return;
    }
    if (isInsufficient) {
      setError("Yetersiz stok.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/mobile/firma/stok/talep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partId,
          locationId,
          quantity: qty,
          serviceOrderId: serviceOrderId || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Talep oluşturulamadı.");
      } else {
        setSuccess(true);
        setTimeout(() => {
          if (serviceOrderId) {
            router.push(`/m/firma/servis-detay/${serviceOrderId}`);
          } else {
            router.push("/m/firma/stok");
          }
        }, 1500);
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
        <h2 className="text-xl font-bold text-gray-800">Parça Talebi Oluşturuldu</h2>
        <p className="text-sm text-gray-500">Yönlendiriliyorsunuz...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Geri */}
      <Link
        href={serviceOrderId ? `/m/firma/servis-detay/${serviceOrderId}` : "/m/firma/stok"}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Geri
      </Link>

      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-black text-[#00236f]">Parça Talep Et</h1>
        <p className="text-sm text-gray-500 mt-0.5">Depodan parça çıkışı oluşturun</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Depo Seçimi */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <Warehouse className="w-4 h-4 text-gray-400" />
            Depo *
          </label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/30 focus:border-[#00236f] outline-none"
          >
            <option value="">Depo seçin...</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>

        {/* Parça Seçimi */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <Package className="w-4 h-4 text-gray-400" />
            Parça *
          </label>
          <select
            value={partId}
            onChange={(e) => setPartId(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/30 focus:border-[#00236f] outline-none"
          >
            <option value="">Parça seçin...</option>
            {parts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.partNumber}) — Stok: {p.currentStock} {p.unit}
              </option>
            ))}
          </select>
          {selectedPart && (
            <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
              selectedPart.currentStock <= 0
                ? "bg-red-50 text-red-600"
                : "bg-green-50 text-green-700"
            }`}>
              <Package className="w-3.5 h-3.5" />
              Mevcut stok: <strong>{selectedPart.currentStock} {selectedPart.unit}</strong>
            </div>
          )}
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
              isInsufficient
                ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                : "border-gray-300 focus:ring-[#00236f]/30 focus:border-[#00236f]"
            }`}
          />
          {isInsufficient && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Yetersiz stok. Maksimum {selectedPart?.currentStock} {selectedPart?.unit} talep edebilirsiniz.
            </div>
          )}
        </div>

        {/* Not */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          <label className="text-sm font-bold text-gray-700">Not (opsiyonel)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Talep nedeni veya ek bilgi..."
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/30 focus:border-[#00236f] resize-none outline-none"
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
          disabled={submitting || isInsufficient || !locationId || !partId || qty <= 0}
          className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-500 to-[#1e3a8a] text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Oluşturuluyor...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Parça Talebi Oluştur
            </>
          )}
        </button>
      </form>
    </div>
  );
}
