"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  Plus,
  Trash2,
  Loader2,
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

interface NewTransferFormProps {
  locations: Location[];
  parts: Part[];
}

export default function NewTransferForm({
  locations,
  parts,
}: NewTransferFormProps) {
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
        router.push("/dashboard/inventory/transfers");
      } else {
        setError(result.error || "Transfer talebi oluşturulamadı.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Lokasyon Seçimi */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-500" />
          Lokasyonlar
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">
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
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
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
            <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">
              Hedef Lokasyon <span className="text-red-500">*</span>
            </label>
            <select
              value={toLocationId}
              onChange={(e) => setToLocationId(e.target.value)}
              required
              disabled={!fromLocationId}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Lokasyon seçin...</option>
              {availableToLocations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            {!fromLocationId && (
              <p className="text-xs text-slate-400 mt-1.5">
                Önce kaynak lokasyon seçin.
              </p>
            )}
          </div>
        </div>

        {fromLocationId && toLocationId && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
            <ArrowRightLeft className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-sm text-blue-700 font-bold">
              {locations.find((l) => l.id === fromLocationId)?.name} →{" "}
              {locations.find((l) => l.id === toLocationId)?.name}
            </span>
          </div>
        )}
      </div>

      {/* Parça Listesi */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-500" />
            Transfer Kalemleri
          </h2>
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Parça Ekle
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => {
            const selectedPart = getPartById(item.partId);
            const isOverStock =
              selectedPart !== undefined &&
              item.quantity > selectedPart.currentStock;

            return (
              <div
                key={index}
                className={`flex items-start gap-2 rounded-xl p-3 border transition-colors ${
                  isOverStock
                    ? "bg-red-50 border-red-200"
                    : "bg-slate-50 border-slate-100"
                }`}
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
                          {p.name} ({p.partNumber})
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
                      className={`w-full px-3 py-2 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none ${
                        isOverStock ? "border-red-300" : "border-slate-200"
                      }`}
                    />
                    {isOverStock && (
                      <p className="text-xs text-red-500 mt-1 pl-1 font-medium">
                        Stok yetersiz! Maks: {selectedPart?.currentStock}
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">
          Notlar
        </h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Transfer hakkında notlar, açıklamalar..."
          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none resize-none"
        />
      </div>

      {/* Bilgi Kutusu */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700 leading-relaxed space-y-1">
          <p className="font-bold">Transfer nasıl çalışır?</p>
          <ul className="space-y-0.5 list-disc list-inside text-blue-600">
            <li>
              Transfer talebi oluşturulduktan sonra yönetici onayına gönderilir.
            </li>
            <li>
              Onaylandığında stok hareketleri otomatik olarak gerçekleştirilir.
            </li>
            <li>
              Kaynak lokasyonda yeterli stok olmadığında talep oluşturulamaz.
            </li>
            <li>
              Reddedilen transferler için stok hareketi yapılmaz.
            </li>
          </ul>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          İptal
        </button>
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
  );
}
