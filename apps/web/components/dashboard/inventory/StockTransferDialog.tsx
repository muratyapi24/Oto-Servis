"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  Plus,
  Trash2,
  Loader2,
  X,
  Package,
  MapPin,
  Info,
} from "lucide-react";
import { createStockTransfer } from "@/lib/actions/stock-transfer.actions";

interface Location {
  id: string;
  name: string;
}

interface Part {
  id: string;
  name: string;
  partNumber: string;
  unit: string;
  currentStock: number;
}

interface TransferItem {
  partId: string;
  quantity: number;
}

interface StockTransferDialogProps {
  locations: Location[];
  parts: Part[];
  onClose?: () => void;
  onSuccess?: (transferId: string) => void;
}

export default function StockTransferDialog({
  locations,
  parts,
  onClose,
  onSuccess,
}: StockTransferDialogProps) {
  const router = useRouter();
  const [fromLocationId, setFromLocationId] = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<TransferItem[]>([
    { partId: "", quantity: 1 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableToLocations = locations.filter(
    (l) => l.id !== fromLocationId
  );

  const getPartById = (partId: string) =>
    parts.find((p) => p.id === partId);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { partId: "", quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof TransferItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fromLocationId) {
      setError("Kaynak lokasyon seçiniz.");
      return;
    }
    if (!toLocationId) {
      setError("Hedef lokasyon seçiniz.");
      return;
    }
    if (fromLocationId === toLocationId) {
      setError("Kaynak ve hedef lokasyon aynı olamaz.");
      return;
    }

    const validItems = items.filter((i) => i.partId && i.quantity > 0);
    if (validItems.length === 0) {
      setError("En az bir parça eklemelisiniz.");
      return;
    }

    // Stok yeterliliği kontrolü (client-side)
    for (const item of validItems) {
      const part = getPartById(item.partId);
      if (part && part.currentStock < item.quantity) {
        setError(
          `"${part.name}" için yetersiz stok. Mevcut: ${part.currentStock}, Talep: ${item.quantity}`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const result = await createStockTransfer({
        fromLocationId,
        toLocationId,
        notes: notes || undefined,
        items: validItems.map((i) => ({
          partId: i.partId,
          quantity: i.quantity,
        })),
      });

      if (result.success && result.data) {
        if (onSuccess) {
          onSuccess(result.data.transferId);
        } else {
          router.push("/dashboard/inventory/transfers");
        }
      } else {
        setError(result.error || "Transfer talebi oluşturulamadı.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-blue-500" />
            <h2 className="text-base font-black text-slate-900">
              Yeni Transfer Talebi
            </h2>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Lokasyon Seçimi */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Lokasyonlar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-1.5">
                  Kaynak Lokasyon <span className="text-red-500">*</span>
                </label>
                <select
                  value={fromLocationId}
                  onChange={(e) => {
                    setFromLocationId(e.target.value);
                    if (e.target.value === toLocationId) {
                      setToLocationId("");
                    }
                  }}
                  required
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                >
                  <option value="">Lokasyon seçin...</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-1.5">
                  Hedef Lokasyon <span className="text-red-500">*</span>
                </label>
                <select
                  value={toLocationId}
                  onChange={(e) => setToLocationId(e.target.value)}
                  required
                  disabled={!fromLocationId}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Lokasyon seçin...</option>
                  {availableToLocations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                {!fromLocationId && (
                  <p className="text-xs text-slate-400 mt-1">
                    Önce kaynak lokasyon seçin.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Parça Listesi */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                Transfer Kalemleri
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Parça Ekle
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => {
                const selectedPart = getPartById(item.partId);
                return (
                  <div
                    key={index}
                    className="flex items-start gap-2 bg-slate-50 rounded-xl p-3"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <select
                          value={item.partId}
                          onChange={(e) =>
                            handleItemChange(index, "partId", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                        >
                          <option value="">Parça seçin...</option>
                          {parts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.partNumber}) — Stok: {p.currentStock}{" "}
                              {p.unit}
                            </option>
                          ))}
                        </select>
                        {selectedPart && (
                          <p className="text-xs text-slate-400 mt-1 pl-1">
                            Mevcut stok:{" "}
                            <span className="font-bold text-slate-600">
                              {selectedPart.currentStock} {selectedPart.unit}
                            </span>
                          </p>
                        )}
                      </div>
                      <div>
                        <input
                          type="number"
                          min={1}
                          max={selectedPart?.currentStock ?? undefined}
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantity",
                              parseInt(e.target.value, 10) || 1
                            )
                          }
                          placeholder="Miktar"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                        />
                        {selectedPart && item.quantity > selectedPart.currentStock && (
                          <p className="text-xs text-red-500 mt-1 pl-1">
                            Stok yetersiz!
                          </p>
                        )}
                      </div>
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notlar */}
          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-1.5">
              Notlar{" "}
              <span className="text-slate-400 font-normal normal-case">
                (opsiyonel)
              </span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Transfer hakkında notlar..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none resize-none"
            />
          </div>

          {/* Bilgi */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Transfer talebi oluşturulduktan sonra yönetici onayına gönderilir.
              Onaylandığında stok hareketleri otomatik olarak gerçekleştirilir.
            </p>
          </div>

          {/* Butonlar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                İptal
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-black rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  Transfer Talebi Oluştur
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
