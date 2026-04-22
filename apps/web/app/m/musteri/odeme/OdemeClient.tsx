"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, Banknote, Building2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface InvoiceInfo {
  id: string;
  invoiceNumber: string | null;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
  serviceOrderNumber: number | null;
}

const PAYMENT_METHODS = [
  { value: "CREDIT_CARD", label: "Kredi / Banka Kartı", icon: CreditCard },
  { value: "CASH", label: "Nakit", icon: Banknote },
  { value: "BANK_TRANSFER", label: "Havale / EFT", icon: Building2 },
] as const;

export default function OdemeClient({ invoice }: { invoice: InvoiceInfo | null }) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<"CREDIT_CARD" | "CASH" | "BANK_TRANSFER">("CREDIT_CARD");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handlePay() {
    if (!invoice) return;
    setSubmitting(true);
    // error'ı sıfırlamıyoruz — form sıfırlanmaz
    try {
      const res = await fetch("/api/musteri/odeme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id, paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ödeme işlemi başarısız.");
      } else {
        setSuccess(true);
        setTimeout(() => router.push(`/m/musteri/makbuz/${data.paymentId}`), 1500);
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
        <h2 className="text-xl font-bold text-gray-800">Ödeme Başarılı</h2>
        <p className="text-sm text-gray-500">Makbuzunuza yönlendiriliyorsunuz...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <Link href="/m/musteri/panel" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Panele Dön
      </Link>

      <div>
        <h1 className="text-2xl font-black text-[#00236f]">Ödeme</h1>
        <p className="text-sm text-gray-500 mt-0.5">Fatura ödemesi</p>
      </div>

      {!invoice ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-gray-300" />
          <p className="text-sm font-bold text-gray-500">Ödeme bekleyen fatura bulunamadı</p>
          <Link href="/m/musteri/odemeler" className="text-xs text-[#00236f] hover:underline">
            Ödeme geçmişini görüntüle →
          </Link>
        </div>
      ) : (
        <>
          {/* Fatura Özeti */}
          <div className="bg-gradient-to-br from-[#00236f] to-[#1e3a8a] rounded-2xl p-6 text-white">
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-2">
              {invoice.invoiceNumber ?? `Fatura #${invoice.id.slice(0, 8)}`}
              {invoice.serviceOrderNumber && ` · İş #${invoice.serviceOrderNumber}`}
            </p>
            <p className="text-4xl font-black">₺{invoice.remaining.toLocaleString("tr-TR")}</p>
            <p className="text-blue-200 text-sm mt-1">Kalan tutar</p>
            {invoice.paidAmount > 0 && (
              <p className="text-blue-300 text-xs mt-0.5">
                Toplam: ₺{invoice.totalAmount.toLocaleString("tr-TR")} · Ödenen: ₺{invoice.paidAmount.toLocaleString("tr-TR")}
              </p>
            )}
          </div>

          {/* Ödeme Yöntemi */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <p className="text-sm font-bold text-gray-700">Ödeme Yöntemi</p>
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
                    <span className="text-[10px] font-bold text-center leading-tight">{pm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#006c49] to-green-600 text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-opacity shadow-lg"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {submitting ? "İşleniyor..." : `₺${invoice.remaining.toLocaleString("tr-TR")} Öde`}
          </button>

          <Link
            href={`/m/musteri/odeme-taksit?invoiceId=${invoice.id}&amount=${invoice.remaining}`}
            className="block text-center text-sm text-[#00236f] hover:underline"
          >
            Taksitli ödeme seçenekleri →
          </Link>
        </>
      )}
    </div>
  );
}
