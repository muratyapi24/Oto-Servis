"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, ClipboardList, Loader2 } from "lucide-react";
import { createStockCount } from "@/lib/actions/stock-count.actions";

interface Location {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface StockCountDialogProps {
  locations: Location[];
  categories: Category[];
  open: boolean;
  onClose: () => void;
  onSuccess?: (countId: string) => void;
}

export default function StockCountDialog({
  locations,
  categories,
  open,
  onClose,
  onSuccess,
}: StockCountDialogProps) {
  const router = useRouter();
  const [locationId, setLocationId] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setLocationId("");
      setSelectedCategoryIds([]);
      setNotes("");
      setError(null);
    }
  }, [open]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await createStockCount({
        locationId: locationId || undefined,
        categoryIds:
          selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
        notes: notes || undefined,
      });

      if (result.success && result.data) {
        onSuccess?.(result.data.countId);
        onClose();
        router.push(`/dashboard/inventory/stock-counts/${result.data.countId}`);
      } else {
        setError(result.error || "Sayım başlatılamadı.");
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
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Yeni Stok Sayımı
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lokasyon ve kategori seçerek sayım başlatın
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Lokasyon Seçimi */}
          <div>
            <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">
              Lokasyon{" "}
              <span className="text-slate-400 dark:text-slate-500 font-normal normal-case">
                (opsiyonel)
              </span>
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
            >
              <option value="">Tüm Lokasyonlar</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
              Boş bırakırsanız tüm lokasyonlardaki parçalar sayıma dahil edilir.
            </p>
          </div>

          {/* Kategori Filtresi */}
          {categories.length > 0 && (
            <div>
              <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">
                Kategori Filtresi{" "}
                <span className="text-slate-400 dark:text-slate-500 font-normal normal-case">
                  (opsiyonel, çoklu seçim)
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryToggle(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        isSelected
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
              {selectedCategoryIds.length > 0 && (
                <p className="text-xs text-blue-600 mt-1.5 font-medium">
                  {selectedCategoryIds.length} kategori seçildi
                </p>
              )}
              {selectedCategoryIds.length === 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                  Seçim yapılmazsa tüm kategoriler dahil edilir.
                </p>
              )}
            </div>
          )}

          {/* Notlar */}
          <div>
            <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">
              Notlar
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Sayım hakkında notlar..."
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none resize-none"
            />
          </div>

          {/* Bilgi Kutusu */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 rounded-xl p-4">
            <p className="text-xs text-blue-700 dark:text-blue-400 font-medium leading-relaxed">
              Sayım başlatıldığında seçilen filtrelerle eşleşen tüm aktif
              parçalar listeye eklenir. Sistem miktarları anlık olarak
              kaydedilir.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:bg-gray-700 rounded-xl transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-black rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Başlatılıyor...
              </>
            ) : (
              <>
                <ClipboardList className="w-4 h-4" />
                Sayımı Başlat
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
