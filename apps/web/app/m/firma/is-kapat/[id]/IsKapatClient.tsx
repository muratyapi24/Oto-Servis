"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Car,
  User,
  ClipboardCheck,
} from "lucide-react";

interface IsKapatClientProps {
  orderId: string;
  orderNumber: number;
  plate: string;
  vehicleName: string;
  customerName: string;
  complaint: string;
  totalAmount: number;
}

export default function IsKapatClient({
  orderId,
  orderNumber,
  plate,
  vehicleName,
  customerName,
  complaint,
  totalAmount,
}: IsKapatClientProps) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    if (!notes.trim()) {
      setError("Kalite notu zorunludur.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/mobile/firma/servis/${orderId}/kapat`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qualityCheckNotes: notes }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "İş kapatılamadı.");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/m/firma/kuyruk"), 1500);
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
        <h2 className="text-xl font-bold text-gray-800">İş Başarıyla Kapatıldı</h2>
        <p className="text-sm text-gray-500">Müşteriye bildirim gönderildi. Kuyruğa yönlendiriliyorsunuz...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Geri */}
      <Link
        href={`/m/firma/servis-detay/${orderId}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Servis Detayına Dön
      </Link>

      {/* Başlık */}
      <div className="bg-gradient-to-br from-[#00236f] to-[#1e3a8a] rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">
          İş Emri #{orderNumber}
        </p>
        <h2 className="text-2xl font-black font-mono">{plate}</h2>
        <p className="text-blue-200 text-sm mt-0.5">{vehicleName}</p>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <User className="w-3 h-3" /> Müşteri
          </p>
          <p className="text-sm font-bold text-gray-800 truncate">{customerName}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Car className="w-3 h-3" /> Toplam
          </p>
          <p className="text-sm font-bold text-gray-800 font-mono">
            ₺{totalAmount.toLocaleString("tr-TR")}
          </p>
        </div>
      </div>

      {/* Şikayet */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Şikayet</p>
        <p className="text-sm text-gray-700 leading-relaxed">{complaint}</p>
      </div>

      {/* Kalite Kontrol Notu */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-[#00236f]" />
          <p className="text-sm font-bold text-gray-800">Kalite Kontrol Notu *</p>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Yapılan işlemleri, kontrol edilen noktaları ve müşteriye iletilecek notları yazın..."
          className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/30 focus:border-[#00236f] resize-none outline-none transition-all"
        />
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-500 to-[#1e3a8a] text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-opacity shadow-lg"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Kapatılıyor...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4" />
            İşi Kapat ve Tamamla
          </>
        )}
      </button>

      <p className="text-xs text-gray-400 text-center">
        İş kapatıldığında müşteriye otomatik bildirim gönderilir.
      </p>
    </div>
  );
}
