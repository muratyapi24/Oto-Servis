"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createPayment } from "@/lib/actions/payment.actions";

interface NewPaymentFormProps {
  customers: Array<{ id: string; firstName?: string | null; lastName?: string | null; companyName?: string | null }>;
  invoices: Array<{ id: string; invoiceNumber: string; totalAmount: number; paidAmount: number }>;
  defaultInvoiceId?: string;
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Nakit" },
  { value: "CREDIT_CARD", label: "Kredi Kartı" },
  { value: "BANK_TRANSFER", label: "Havale/EFT" },
  { value: "CHECK", label: "Çek" },
  { value: "PROMISSORY_NOTE", label: "Senet" },
];

export default function NewPaymentForm({ customers, invoices, defaultInvoiceId }: NewPaymentFormProps) {
  const router = useRouter();
  const [invoiceId, setInvoiceId] = useState(defaultInvoiceId ?? "");
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Çek/senet alanları
  const [checkNumber, setCheckNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [drawerName, setDrawerName] = useState("");

  const isCheckOrNote = paymentMethod === "CHECK" || paymentMethod === "PROMISSORY_NOTE";

  const getCustomerName = (c: typeof customers[0]) =>
    c.companyName || [c.firstName, c.lastName].filter(Boolean).join(" ") || "—";

  const selectedInvoice = invoices.find((i) => i.id === invoiceId);
  const remainingAmount = selectedInvoice
    ? selectedInvoice.totalAmount - selectedInvoice.paidAmount
    : 0;

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!amount || Number(amount) <= 0) {
      setError("Geçerli bir tutar girin.");
      return;
    }

    if (isCheckOrNote && (!checkNumber || !bankName || !dueDate || !drawerName)) {
      setError("Çek/senet için tüm alanları doldurun.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createPayment({
        invoiceId: invoiceId || undefined,
        customerId: customerId || undefined,
        amount: Number(amount),
        paymentMethod: paymentMethod as any,
        paymentDate: new Date(paymentDate || new Date()),
        notes: notes || undefined,
        checkDetails: isCheckOrNote
          ? { checkNumber, bankName, dueDate: new Date(dueDate), drawerName }
          : undefined,
      });

      if (result.success) {
        setSuccess("Ödeme başarıyla kaydedildi.");
        setTimeout(() => router.push("/dashboard/finance/payments"), 1000);
      } else {
        setError(result.error ?? "Ödeme kaydedilemedi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Ödeme Bilgileri</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Fatura (Opsiyonel)</label>
            <select
              value={invoiceId}
              onChange={(e) => {
                setInvoiceId(e.target.value);
                const inv = invoices.find((i) => i.id === e.target.value);
                if (inv) setAmount(String(inv.totalAmount - inv.paidAmount));
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
            >
              <option value="">Fatura seçin...</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — Kalan: {(inv.totalAmount - inv.paidAmount).toLocaleString("tr-TR")} ₺
                </option>
              ))}
            </select>
            {selectedInvoice && remainingAmount > 0 && (
              <p className="text-xs text-amber-600 mt-1 font-medium">
                Kalan tutar: {remainingAmount.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Müşteri (Opsiyonel)</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
            >
              <option value="">Müşteri seçin...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{getCustomerName(c)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Tutar (₺) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={0.01}
              step={0.01}
              placeholder="0.00"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Ödeme Yöntemi *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Ödeme Tarihi</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Notlar</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ödeme notu..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Çek/Senet Detayları */}
      {isCheckOrNote && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-black text-amber-700 uppercase tracking-widest">
            {paymentMethod === "CHECK" ? "Çek" : "Senet"} Detayları
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">
                {paymentMethod === "CHECK" ? "Çek No" : "Senet No"} *
              </label>
              <input
                type="text"
                value={checkNumber}
                onChange={(e) => setCheckNumber(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Banka *</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Vade Tarihi *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Keşideci *</label>
              <input
                type="text"
                value={drawerName}
                onChange={(e) => setDrawerName(e.target.value)}
                placeholder="Çeki/senedi düzenleyen kişi/firma"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pb-8">
        <button
          onClick={() => router.push("/dashboard/finance/payments")}
          className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
        >
          İptal
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !amount}
          className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-black rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Kaydediliyor...</>
          ) : (
            <><CreditCard className="w-4 h-4" />Ödemeyi Kaydet</>
          )}
        </button>
      </div>
    </div>
  );
}
