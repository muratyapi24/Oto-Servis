"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, FileText, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createInvoice } from "@/lib/actions/invoice.actions";
import { calculateLineTotal, calculateInvoiceTotals } from "@/lib/invoice-utils";

interface Customer {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  phone?: string;
}

interface InvoiceItem {
  type: "LABOR" | "PART" | "SERVICE";
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  sortOrder: number;
}

interface NewInvoiceFormProps {
  customers: Customer[];
}

export default function NewInvoiceForm({ customers }: NewInvoiceFormProps) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Yeni kalem state
  const [newItem, setNewItem] = useState<InvoiceItem>({
    type: "SERVICE",
    name: "",
    quantity: 1,
    unitPrice: 0,
    taxRate: 20,
    discountRate: 0,
    sortOrder: 0,
  });

  const getCustomerName = (c: Customer) =>
    c.companyName || [c.firstName, c.lastName].filter(Boolean).join(" ") || "—";

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(val);

  const handleAddItem = () => {
    if (!newItem.name || newItem.quantity <= 0 || newItem.unitPrice < 0) return;
    setItems([...items, { ...newItem, sortOrder: items.length }]);
    setNewItem({ type: "SERVICE", name: "", quantity: 1, unitPrice: 0, taxRate: 20, discountRate: 0, sortOrder: 0 });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totals = calculateInvoiceTotals(items);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!customerId) {
      setError("Lütfen bir müşteri seçin.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createInvoice({
        customerId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes: notes || undefined,
        items: items.map((item) => ({
          type: item.type,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          discountRate: item.discountRate,
          sortOrder: item.sortOrder,
        })),
      });

      if (result.success && result.data) {
        setSuccess("Fatura başarıyla oluşturuldu.");
        setTimeout(() => {
          router.push(`/dashboard/finance/invoices/${result.data!.invoiceId}`);
        }, 1000);
      } else {
        setError(result.error ?? "Fatura oluşturulamadı.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
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

      {/* Fatura Bilgileri */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Fatura Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Müşteri *</label>
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
            <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Vade Tarihi</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Notlar</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Fatura notları..."
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none resize-none"
          />
        </div>
      </div>

      {/* Kalem Ekleme */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Fatura Kalemleri</h2>

        {/* Yeni kalem formu */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-slate-500">Kalem Ekle</p>
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-12 md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tür</label>
              <select
                value={newItem.type}
                onChange={(e) => setNewItem({ ...newItem, type: e.target.value as "LABOR" | "PART" | "SERVICE" })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              >
                <option value="SERVICE">Hizmet</option>
                <option value="LABOR">İşçilik</option>
                <option value="PART">Parça</option>
              </select>
            </div>
            <div className="col-span-12 md:col-span-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Açıklama</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Kalem adı..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              />
            </div>
            <div className="col-span-4 md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Miktar</label>
              <input
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                min={0.01}
                step={0.01}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              />
            </div>
            <div className="col-span-4 md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Birim Fiyat</label>
              <input
                type="number"
                value={newItem.unitPrice}
                onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                min={0}
                step={0.01}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              />
            </div>
            <div className="col-span-4 md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">KDV %</label>
              <select
                value={newItem.taxRate}
                onChange={(e) => setNewItem({ ...newItem, taxRate: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              >
                <option value={0}>%0</option>
                <option value={1}>%1</option>
                <option value={8}>%8</option>
                <option value={10}>%10</option>
                <option value={20}>%20</option>
              </select>
            </div>
            <div className="col-span-12 md:col-span-1">
              <button
                onClick={handleAddItem}
                disabled={!newItem.name || newItem.quantity <= 0}
                className="w-full flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-xl text-sm font-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Kalem tablosu */}
        {items.length > 0 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">Açıklama</th>
                  <th className="px-4 py-3 text-center">Miktar</th>
                  <th className="px-4 py-3 text-center">Birim Fiyat</th>
                  <th className="px-4 py-3 text-center">KDV</th>
                  <th className="px-4 py-3 text-right">Satır Toplamı</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => {
                  const lineTotal = calculateLineTotal(item.quantity, item.unitPrice, item.discountRate, item.taxRate);
                  return (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-400">{item.type === "LABOR" ? "İşçilik" : item.type === "PART" ? "Parça" : "Hizmet"}</div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-700">{item.quantity}</td>
                      <td className="px-4 py-3 text-center text-slate-700">{formatMoney(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-center text-slate-600">%{item.taxRate}</td>
                      <td className="px-4 py-3 text-right font-black text-slate-900">{formatMoney(lineTotal)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Toplam */}
        {items.length > 0 && (
          <div className="bg-slate-900 text-white rounded-xl p-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Ara Toplam</span>
              <span className="font-bold">{formatMoney(totals.subTotal)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">İndirim</span>
                <span className="font-bold text-red-400">-{formatMoney(totals.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">KDV</span>
              <span className="font-bold">{formatMoney(totals.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-lg border-t border-slate-700 pt-2 mt-2">
              <span className="font-black text-amber-500">Genel Toplam</span>
              <span className="font-black text-amber-500">{formatMoney(totals.totalAmount)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <button
          onClick={() => router.push("/dashboard/finance/invoices")}
          className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
        >
          İptal
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !customerId}
          className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-black rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Oluşturuluyor...</>
          ) : (
            <><FileText className="w-4 h-4" />Fatura Oluştur</>
          )}
        </button>
      </div>
    </div>
  );
}
