"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ShoppingCart,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { createPurchaseOrder } from "@/lib/actions/purchase-order.actions";

interface Part {
  id: string;
  name: string;
  partNumber: string;
  unit: string;
  purchasePrice: number;
}

interface Supplier {
  id: string;
  name: string;
  email?: string | null;
}

interface OrderItem {
  partId: string;
  partName: string;
  partNumber: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

interface NewPurchaseOrderFormProps {
  parts: Part[];
  suppliers: Supplier[];
}

export default function NewPurchaseOrderForm({
  parts,
  suppliers,
}: NewPurchaseOrderFormProps) {
  const router = useRouter();

  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Yeni kalem için geçici state
  const [selectedPartId, setSelectedPartId] = useState("");
  const [newQty, setNewQty] = useState<number>(1);
  const [newUnitPrice, setNewUnitPrice] = useState<number>(0);
  const [newTaxRate, setNewTaxRate] = useState<number>(20);

  const handlePartSelect = (partId: string) => {
    setSelectedPartId(partId);
    const part = parts.find((p) => p.id === partId);
    if (part) {
      setNewUnitPrice(part.purchasePrice);
    }
  };

  const handleAddItem = () => {
    if (!selectedPartId || newQty <= 0 || newUnitPrice <= 0) return;

    const part = parts.find((p) => p.id === selectedPartId);
    if (!part) return;

    const existing = items.findIndex((i) => i.partId === selectedPartId);
    if (existing >= 0) {
      const updated = [...items];
      const existingItem = updated[existing];
      if (existingItem) {
        updated[existing] = {
          ...existingItem,
          quantity: existingItem.quantity + newQty,
        };
      }
      setItems(updated);
    } else {
      const newItem: OrderItem = {
        partId: part.id,
        partName: part.name,
        partNumber: part.partNumber,
        unit: part.unit,
        quantity: newQty,
        unitPrice: newUnitPrice,
        taxRate: newTaxRate,
      };
      setItems([...items, newItem]);
    }

    setSelectedPartId("");
    setNewQty(1);
    setNewUnitPrice(0);
    setNewTaxRate(20);
  };

  const handleRemoveItem = (partId: string) => {
    setItems(items.filter((i) => i.partId !== partId));
  };

  const handleUpdateItem = (
    partId: string,
    field: "quantity" | "unitPrice" | "taxRate",
    value: number
  ) => {
    setItems(
      items.map((i) => (i.partId === partId ? { ...i, [field]: value } : i))
    );
  };

  const subTotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const taxAmount = items.reduce(
    (sum, item) =>
      sum + (item.quantity * item.unitPrice * item.taxRate) / 100,
    0
  );
  const totalAmount = subTotal + taxAmount;

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(val);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!supplierId) {
      setError("Lütfen bir tedarikçi seçin.");
      return;
    }
    if (items.length === 0) {
      setError("En az bir kalem eklemelisiniz.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createPurchaseOrder({
        supplierId,
        expectedDate: expectedDate ? new Date(expectedDate) : undefined,
        notes: notes || undefined,
        items: items.map((i) => ({
          partId: i.partId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          taxRate: i.taxRate,
        })),
      });

      if (result.success && result.data) {
        setSuccess(
          `Sipariş başarıyla oluşturuldu: ${result.data.poNumber}`
        );
        setTimeout(() => {
          router.push("/dashboard/inventory/purchase-orders");
        }, 1500);
      } else {
        setError(result.error || "Sipariş oluşturulamadı.");
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

      {/* Tedarikçi & Tarih */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">
          Sipariş Bilgileri
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">
              Tedarikçi *
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
            >
              <option value="">Tedarikçi seçin...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {suppliers.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Henüz tedarikçi eklenmemiş.
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">
              Beklenen Teslim Tarihi
            </label>
            <input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">
            Notlar
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Sipariş notları, özel talepler..."
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none resize-none"
          />
        </div>
      </div>

      {/* Kalem Ekleme */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">
          Sipariş Kalemleri
        </h2>

        {/* Yeni kalem formu */}
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs font-bold text-slate-500 mb-3">Kalem Ekle</p>
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-12 md:col-span-4">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Parça
              </label>
              <select
                value={selectedPartId}
                onChange={(e) => handlePartSelect(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              >
                <option value="">Parça seçin...</option>
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.partNumber})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-4 md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Miktar
              </label>
              <input
                type="number"
                value={newQty}
                onChange={(e) => setNewQty(Number(e.target.value))}
                min={1}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              />
            </div>
            <div className="col-span-4 md:col-span-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Birim Fiyat (₺)
              </label>
              <input
                type="number"
                value={newUnitPrice}
                onChange={(e) => setNewUnitPrice(Number(e.target.value))}
                min={0}
                step={0.01}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              />
            </div>
            <div className="col-span-4 md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                KDV Oranı
              </label>
              <select
                value={newTaxRate}
                onChange={(e) => setNewTaxRate(Number(e.target.value))}
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
                disabled={
                  !selectedPartId || newQty <= 0 || newUnitPrice <= 0
                }
                className="w-full flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-xl text-sm font-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span className="md:hidden">Ekle</span>
              </button>
            </div>
          </div>
        </div>

        {/* Kalem tablosu */}
        {items.length > 0 ? (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">Parça</th>
                  <th className="px-4 py-3 text-center">Miktar</th>
                  <th className="px-4 py-3 text-center">Birim Fiyat</th>
                  <th className="px-4 py-3 text-center">KDV</th>
                  <th className="px-4 py-3 text-right">Satır Toplamı</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const lineTotal =
                    item.quantity * item.unitPrice * (1 + item.taxRate / 100);
                  return (
                    <tr key={item.partId} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">
                          {item.partName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {item.partNumber} · {item.unit}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.partId,
                              "quantity",
                              Number(e.target.value)
                            )
                          }
                          min={1}
                          className="w-16 text-center px-2 py-1 border border-slate-200 rounded-lg text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.partId,
                              "unitPrice",
                              Number(e.target.value)
                            )
                          }
                          min={0}
                          step={0.01}
                          className="w-24 text-center px-2 py-1 border border-slate-200 rounded-lg text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={item.taxRate}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.partId,
                              "taxRate",
                              Number(e.target.value)
                            )
                          }
                          className="px-2 py-1 border border-slate-200 rounded-lg text-sm"
                        >
                          <option value={0}>%0</option>
                          <option value={1}>%1</option>
                          <option value={8}>%8</option>
                          <option value={10}>%10</option>
                          <option value={20}>%20</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-900">
                        {formatMoney(lineTotal)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemoveItem(item.partId)}
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
        ) : (
          <div className="text-center py-8 text-slate-400">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">
              Henüz kalem eklenmedi. Yukarıdan parça seçin.
            </p>
          </div>
        )}

        {/* Toplam */}
        {items.length > 0 && (
          <div className="bg-slate-900 text-white rounded-xl p-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Ara Toplam</span>
              <span className="font-bold">{formatMoney(subTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">KDV Toplamı</span>
              <span className="font-bold">{formatMoney(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-lg border-t border-slate-700 pt-2 mt-2">
              <span className="font-black text-amber-500">Genel Toplam</span>
              <span className="font-black text-amber-500">
                {formatMoney(totalAmount)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <button
          onClick={() => router.push("/dashboard/inventory/purchase-orders")}
          className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
        >
          İptal
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !supplierId || items.length === 0}
          className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-black rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Oluşturuluyor...
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              Sipariş Oluştur
            </>
          )}
        </button>
      </div>
    </div>
  );
}
