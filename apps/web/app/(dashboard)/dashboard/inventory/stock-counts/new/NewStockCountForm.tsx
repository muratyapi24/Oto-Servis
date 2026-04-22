"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Loader2, Info } from "lucide-react";
import { createStockCount } from "@/lib/actions/stock-count.actions";

interface Location {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface NewStockCountFormProps {
  locations: Location[];
  categories: Category[];
}

export default function NewStockCountForm({
  locations,
  categories,
}: NewStockCountFormProps) {
  const router = useRouter();
  const [locationId, setLocationId] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        router.push(
          `/dashboard/inventory/stock-counts/${result.data.countId}`
        );
      } else {
        setError(result.error || "Sayım başlatılamadı.");
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
        <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">
          Sayım Kapsamı
        </h2>

        <div>
          <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">
            Lokasyon{" "}
            <span className="text-slate-400 font-normal normal-case">
              (opsiyonel)
            </span>
          </label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
          >
            <option value="">Tüm Lokasyonlar</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400 mt-1.5">
            Boş bırakırsanız tüm lokasyonlardaki parçalar sayıma dahil edilir.
          </p>
        </div>

        {/* Kategori Filtresi */}
        {categories.length > 0 && (
          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">
              Kategori Filtresi{" "}
              <span className="text-slate-400 font-normal normal-case">
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
            {selectedCategoryIds.length > 0 ? (
              <p className="text-xs text-blue-600 mt-1.5 font-medium">
                {selectedCategoryIds.length} kategori seçildi — yalnızca bu
                kategorilerdeki parçalar sayıma dahil edilecek.
              </p>
            ) : (
              <p className="text-xs text-slate-400 mt-1.5">
                Seçim yapılmazsa tüm kategoriler dahil edilir.
              </p>
            )}
          </div>
        )}
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
          placeholder="Sayım hakkında notlar, açıklamalar..."
          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none resize-none"
        />
      </div>

      {/* Bilgi Kutusu */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700 leading-relaxed space-y-1">
          <p className="font-bold">Sayım nasıl çalışır?</p>
          <ul className="space-y-0.5 list-disc list-inside text-blue-600">
            <li>
              Seçilen filtrelerle eşleşen tüm aktif parçalar listeye eklenir.
            </li>
            <li>
              Sistem miktarları sayım başlangıcında anlık olarak kaydedilir.
            </li>
            <li>
              Fiili miktarları girdikten sonra sayımı onaylayarak stok
              düzeltmesi yapabilirsiniz.
            </li>
            <li>
              Aynı lokasyonda zaten açık bir sayım varsa yeni sayım
              başlatılamaz.
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
    </form>
  );
}
