"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, ShoppingCart, Loader2 } from "lucide-react";
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

interface PurchaseOrderDialogProps {
  parts: Part[];
  suppliers: Supplier[];
  open: boolean;
  onClose: () => void;
  onSuccess?: (poId: string, poNumber: string) => void;
}

export default function PurchaseOrderDialog({
  parts,
  suppliers,
  open,
  onClose,
  onSuccess,
}: PurchaseOrderDialogProps) {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Yeni kalem için geçici state
  const [selectedPartId, setSelectedPartId] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [newUnitPrice, setNewUnitPrice] = useState(0);
  const [newTaxRate, setNewTaxRate] = useState(20);

  useEffect(() => {
    if (!open) {
      // Dialog kapandığında formu sıfırla
      setSupplierId("");
      setExpectedDate("");
      setNotes("");
      setItems([]);
      setError(null);
      setSelectedPartId("");
      setNewQty(1);
      setNewUnitPrice(0);
      setNewTaxRate(20);
    }
  }, [open]);

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
    field: keyof OrderItem,
    value: number
  ) => {
    setItems(
      items.map((i) => (i.partId === partId ? { ...i, [field]: value } : i))
    );
  };

  // Toplam hesaplama
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
        onSuccess?.(result.data.poId, result.data.poNumber);
        onClose();
        router.refresh();
      } else {
        setError(result.error || "Sipariş oluşturulamadı.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Yeni Satın Alma Siparişi
              </h2>
              <p className="text-xs text-slate-500">
                Tedarikçi seçin ve kalemler ekleyin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Tedarikçi & Tarih */}
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

          {/* Notlar */}
          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">
              Notlar
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Sipariş notları..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none resize-none"
            />
          </div>

          {/* Kalem Ekleme */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">
              Kalem Ekle
            </h3>
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-12 md:col-span-4">
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
                <input
                  type="number"
                  value={newQty}
                  onChange={(e) => setNewQty(Number(e.target.value))}
                  min={1}
                  placeholder="Miktar"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
                />
              </div>
              <div className="col-span-4 md:col-span-3">
                <input
                  type="number"
                  value={newUnitPrice}
                  onChange={(e) => setNewUnitPrice(Number(e.target.value))}
                  min={0}
                  step={0.01}
                  placeholder="Birim Fiyat (₺)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
                />
              </div>
              <div className="col-span-4 md:col-span-2">
                <select
                  value={newTaxRate}
                  onChange={(e) => setNewTaxRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
                >
                  <option value={0}>%0 KDV</option>
                  <option value={1}>%1 KDV</option>
                  <option value={8}>%8 KDV</option>
                  <option value={10}>%10 KDV</option>
                  <option value={20}>%20 KDV</option>
                </select>
              </div>
              <div className="col-span-12 md:col-span-1">
                <button
                  onClick={handleAddItem}
                  disabled={!selectedPartId || newQty <= 0 || newUnitPrice <= 0}
                  className="w-full h-full flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed py-2"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Kalem Listesi */}
          {items.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">
                Sipariş Kalemleri ({items.length})
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-bold">
                    <tr>
                      <th className="px-4 py-3 text-left">Parça</th>
                      <th className="px-4 py-3 text-center">Miktar</th>
                      <th className="px-4 py-3 text-center">Birim Fiyat</th>
                      <th className="px-4 py-3 text-center">KDV</th>
                      <th className="px-4 py-3 text-right">Toplam</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => {
                      const lineTotal =
                        item.quantity *
                        item.unitPrice *
                        (1 + item.taxRate / 100);
                      return (
                        <tr key={item.partId}>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-800">
                              {item.partName}
                            </div>
                            <div className="text-xs text-slate-400">
                              {item.partNumber}
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
                          <td className="px-4 py-3 text-center text-slate-600">
                            %{item.taxRate}
                          </td>
                          <td className="px-4 py-3 text-right font-black text-slate-900">
                            {formatMoney(lineTotal)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleRemoveItem(item.partId)}
                              className="p-1 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
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

              {/* Toplam */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Ara Toplam</span>
                  <span className="font-bold">{formatMoney(subTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">KDV</span>
                  <span className="font-bold">{formatMoney(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-base border-t border-slate-700 pt-1.5 mt-1.5">
                  <span className="font-black text-amber-500">
                    Genel Toplam
                  </span>
                  <span className="font-black text-amber-500 text-lg">
                    {formatMoney(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !supplierId || items.length === 0}
            className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-black rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}
