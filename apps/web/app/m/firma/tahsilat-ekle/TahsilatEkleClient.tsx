"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  DollarSign,
  CreditCard,
  Banknote,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface Customer { id: string; name: string; phone: string }

const PAYMENT_METHODS = [
  { value: "CASH", label: "Nakit", icon: Banknote },
  { value: "CREDIT_CARD", label: "Kart", icon: CreditCard },
  { value: "BANK_TRANSFER", label: "Havale/EFT", icon: Building2 },
] as const;

export default function TahsilatEkleClient({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CREDIT_CARD" | "BANK_TRANSFER">("CASH");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const amountNum = parseFloat(amount) || 0;
  const isInvalidAmount = amount !== "" && amountNum <= 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) { setError("Müşteri seçin."); return; }
    if (amountNum <= 0) { setError("Geçerli bir tutar girin."); return; }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/mobile/firma/finans/tahsilat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, amount: amountNum, paymentMethod, notes: notes || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Tahsilat oluşturulamadı."); return; }
      setSuccess(true);
      setTimeout(() => router.push("/m/firma/tahsilatlar"), 1500);
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
        <h2 className="text-xl font-bold text-gray-800">Tahsilat Kaydedildi</h2>
        <p className="text-sm text-gray-500">Tahsilatlar listesine yönlendiriliyorsunuz...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <Link href="/m/firma/tahsilatlar" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Tahsilatlara Dön
      </Link>

      <div>
        <h1 className="text-2xl font-black text-[#00236f]">Yeni Tahsilat</h1>
        <p className="text-sm text-gray-500 mt-0.5">Müşteriden ödeme kaydı oluşturun</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Müşteri */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <User className="w-4 h-4 text-gray-400" /> Müşteri *
          </label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/30 focus:border-[#00236f] outline-none"
          >
            <option value="">Müşteri seçin...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
            ))}
          </select>
        </div>

        {/* Tutar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <DollarSign className="w-4 h-4 text-gray-400" /> Tutar (₺) *
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={`w-full p-3 bg-gray-50 border rounded-xl text-sm focus:ring-2 outline-none transition-colors ${
              isInvalidAmount
                ? "border-red-300 focus:ring-red-200"
                : "border-gray-300 focus:ring-[#00236f]/30 focus:border-[#00236f]"
            }`}
          />
          {isInvalidAmount && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Geçersiz tutar
            </p>
          )}
        </div>

        {/* Ödeme Yöntemi */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          <label className="text-sm font-bold text-gray-700">Ödeme Yöntemi *</label>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((pm) => {
              const Icon = pm.icon;
              return (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => setPaymentMethod(pm.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                    paymentMethod === pm.value
                      ? "border-[#00236f] bg-blue-50 text-[#00236f]"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-bold">{pm.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Not */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          <label className="text-sm font-bold text-gray-700">Not (opsiyonel)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Ödeme açıklaması..."
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/30 focus:border-[#00236f] resize-none outline-none"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !customerId || amountNum <= 0}
          className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-500 to-[#1e3a8a] text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg"
        >
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...</> : <><CheckCircle2 className="w-4 h-4" /> Tahsilatı Kaydet</>}
        </button>
      </form>
    </div>
  );
}
