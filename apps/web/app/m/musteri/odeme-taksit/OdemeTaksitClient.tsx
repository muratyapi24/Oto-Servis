"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, Calendar } from "lucide-react";

const INSTALLMENT_OPTIONS = [2, 3, 6, 12];

interface OdemeTaksitClientProps {
  invoiceId: string | null;
  totalAmount: number;
}

export default function OdemeTaksitClient({ invoiceId, totalAmount }: OdemeTaksitClientProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [plan, setPlan] = useState<{ installments: number; monthly: number } | null>(null);

  async function handleConfirm() {
    if (!selected || !invoiceId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/musteri/odeme-taksit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, installments: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Taksit planı oluşturulamadı.");
      } else {
        setPlan({ installments: selected, monthly: totalAmount / selected });
        setSuccess(true);
      }
    } catch {
      setError("Beklenmeyen bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success && plan) {
    return (
      <div className="space-y-5 pb-8">
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Taksit Planı Oluşturuldu</h2>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-700">Taksit Özeti</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-gray-900">{plan.installments}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Taksit</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-gray-900">
                ₺{plan.monthly.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Aylık</p>
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 pt-2 border-t">
            <span>Toplam</span>
            <span className="font-bold">₺{totalAmount.toLocaleString("tr-TR")}</span>
          </div>
        </div>
        <Link
          href="/m/musteri/odemeler"
          className="block text-center text-sm text-[#00236f] hover:underline"
        >
          Ödeme geçmişini görüntüle →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <Link href="/m/musteri/odeme" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Ödemeye Dön
      </Link>

      <div>
        <h1 className="text-2xl font-black text-[#00236f]">Taksitli Ödeme</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Toplam: <strong>₺{totalAmount.toLocaleString("tr-TR")}</strong>
        </p>
      </div>

      {/* Taksit Seçenekleri */}
      <div className="space-y-3">
        {INSTALLMENT_OPTIONS.map((n) => {
          const monthly = totalAmount / n;
          const isSelected = selected === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setSelected(n)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                isSelected
                  ? "border-[#00236f] bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isSelected ? "bg-[#00236f] text-white" : "bg-gray-100 text-gray-500"
              }`}>
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-bold ${isSelected ? "text-[#00236f]" : "text-gray-800"}`}>
                  {n} Taksit
                </p>
                <p className="text-xs text-gray-500">
                  Aylık ₺{monthly.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
                </p>
              </div>
              {isSelected && <CheckCircle2 className="w-5 h-5 text-[#00236f] shrink-0" />}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={!selected || submitting || !invoiceId}
        className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-500 to-[#1e3a8a] text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        {submitting ? "Oluşturuluyor..." : "Taksit Planını Onayla"}
      </button>
    </div>
  );
}
