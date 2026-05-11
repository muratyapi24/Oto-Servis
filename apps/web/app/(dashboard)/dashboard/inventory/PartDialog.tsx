"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useForm as useRHForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createPartSchema, updatePartSchema } from "@/lib/validations/inventory";
import { createPart, updatePart } from "@/lib/actions/inventory.actions";
import { X, Plus, AlertCircle, PackagePlus, Edit, ChevronDown, Search } from "lucide-react";

interface PartDialogProps {
  categories: { id: string; name: string }[];
  suppliers?: { id: string; name: string }[];
  existingParts?: any[];
  initialData?: any;
}

/* ── Searchable Dropdown Bileşeni ── */
function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Seçiniz...",
  searchPlaceholder = "Ara...",
  emptyMessage = "Sonuç bulunamadı",
  className = "",
}: {
  options: { value: string; label: string; sub?: string }[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = options.filter(
    (o) =>
      o.label.toLowerCase().includes(search.toLowerCase()) ||
      (o.sub && o.sub.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-left flex items-center justify-between focus:ring-primary focus:border-primary"
      >
        <span className={selectedLabel ? "text-gray-900" : "text-gray-400"}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={searchPlaceholder}
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-44">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">{emptyMessage}</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-primary/5 transition-colors flex flex-col ${value === opt.value ? "bg-primary/10 font-semibold text-primary" : "text-gray-700"
                    }`}
                >
                  <span>{opt.label}</span>
                  {opt.sub && <span className="text-[11px] text-gray-400">{opt.sub}</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function PartDialog({ categories, suppliers = [], existingParts = [], initialData }: PartDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useRHForm<z.infer<typeof createPartSchema>>({
    resolver: zodResolver(createPartSchema),
    defaultValues: {
      categoryId: initialData?.categoryId || "",
      partNumber: initialData?.partNumber || "",
      name: initialData?.name || "",
      description: initialData?.description || "",
      brand: initialData?.brand || "",
      unit: initialData?.unit || "adet",
      purchasePrice: initialData ? Number(initialData.purchasePrice) : 0,
      sellingPrice: initialData ? Number(initialData.sellingPrice) : 0,
      taxRate: initialData ? Number(initialData.taxRate) : 20,
      minStockLevel: initialData?.minStockLevel || 0,
      currentStock: initialData?.currentStock || 0,
      location: initialData?.location || "",
      supplierName: initialData?.supplierName || "",
      isActive: initialData ? initialData.isActive : true,
    },
  });

  const watchCategoryId = form.watch("categoryId");

  // Seçili kategoriye göre mevcut parçaları filtrele (suggestion dropdown için)
  const categoryParts = useMemo(() => {
    if (!watchCategoryId) return [];
    return existingParts.filter((p) => p.categoryId === watchCategoryId);
  }, [watchCategoryId, existingParts]);

  // Parça suggestion seçildiğinde formu otomatik doldur
  function handlePartSuggestionSelect(partId: string) {
    const part = existingParts.find((p) => p.id === partId);
    if (!part) return;
    form.setValue("name", part.name);
    form.setValue("partNumber", part.partNumber || "");
    form.setValue("brand", part.brand || "");
    form.setValue("description", part.description || "");
    form.setValue("purchasePrice", Number(part.purchasePrice) || 0);
    form.setValue("sellingPrice", Number(part.sellingPrice) || 0);
    form.setValue("taxRate", Number(part.taxRate) || 20);
    form.setValue("unit", part.unit || "adet");
    form.setValue("supplierName", part.supplierName || "");
    form.setValue("location", part.location || "");
    form.setValue("minStockLevel", part.minStockLevel || 0);
  }

  // Supplier dropdown seçenekleri
  const supplierOptions = useMemo(
    () => suppliers.map((s) => ({ value: s.name, label: s.name })),
    [suppliers]
  );

  // Kategori dropdown seçenekleri
  const categorySelectOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories]
  );

  // Parça suggestion seçenekleri
  const partSuggestionOptions = useMemo(
    () =>
      categoryParts.map((p) => ({
        value: p.id,
        label: p.name,
        sub: `${p.partNumber || "—"} · ${p.brand || ""} · ₺${Number(p.sellingPrice).toFixed(2)}`,
      })),
    [categoryParts]
  );

  async function onSubmit(data: z.infer<typeof createPartSchema>) {
    setSubmitting(true);
    setError(null);
    try {
      let res;
      if (initialData) {
        res = await updatePart({ ...data, id: initialData.id });
      } else {
        res = await createPart(data);
      }

      if (res?.error) {
        setError(res.error);
      } else {
        setOpen(false);
        if (!initialData) form.reset();
      }
    } catch (err) {
      setError("Beklenmeyen bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {initialData ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-2"
        >
          <Edit className="w-4 h-4" /> Düzenle
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 whitespace-nowrap bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-200 transition-all"
        >
          <PackagePlus className="w-4 h-4" />
          <span>Yeni Parça Ekle</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2 text-gray-800">
                {initialData ? <Edit className="w-6 h-6 text-primary" /> : <PackagePlus className="w-6 h-6 text-primary" />}
                <h2 className="text-xl font-bold">{initialData ? "Stok Kartı Düzenle" : "Yeni Stok (Parça) Kartı"}</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-800 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm border border-red-100">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Parça Tanımı */}
                <div>
                  <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-4 uppercase tracking-wider">Parça Tanımı</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Kategori — Searchable Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                      <SearchableSelect
                        options={categorySelectOptions}
                        value={form.watch("categoryId")}
                        onChange={(val) => {
                          form.setValue("categoryId", val);
                          // Kategori değiştiğinde parça alanlarını temizle (sadece yeni kayıtta)
                          if (!initialData) {
                            form.setValue("name", "");
                            form.setValue("partNumber", "");
                            form.setValue("brand", "");
                            form.setValue("purchasePrice", 0);
                            form.setValue("sellingPrice", 0);
                          }
                        }}
                        placeholder="-- Kategori Seçiniz --"
                        searchPlaceholder="Kategori ara..."
                        emptyMessage="Kategori bulunamadı"
                      />
                      {form.formState.errors.categoryId && <p className="text-red-500 text-xs mt-1">{form.formState.errors.categoryId.message}</p>}
                    </div>

                    {/* OEM / Parça / Barkod No */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Oem/Parça/Barkod No *</label>
                      <input {...form.register("partNumber")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary uppercase" placeholder="Örn: 90915-YZZD2" />
                      {form.formState.errors.partNumber && <p className="text-red-500 text-xs mt-1">{form.formState.errors.partNumber.message}</p>}
                    </div>

                    {/* Mevcut Parçalardan Seç (Suggestion) — sadece kategori seçiliyken ve yeni kayıtta */}
                    {!initialData && watchCategoryId && categoryParts.length > 0 && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-amber-600 mb-1">
                          💡 Bu kategoride {categoryParts.length} kayıtlı parça var — birini seçerek formu otomatik doldurun:
                        </label>
                        <SearchableSelect
                          options={partSuggestionOptions}
                          value=""
                          onChange={handlePartSuggestionSelect}
                          placeholder="Mevcut parçadan seç (opsiyonel)..."
                          searchPlaceholder="Parça adı veya barkod ara..."
                          emptyMessage="Eşleşen parça yok"
                        />
                      </div>
                    )}

                    {/* Ürün Adı */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı *</label>
                      <input {...form.register("name")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="Yağ Filtresi vb." />
                      {form.formState.errors.name && <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>}
                    </div>

                    {/* Parça Markası */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parça Markası / Üretici</label>
                      <input {...form.register("brand")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="Bosch, Mann vb." />
                    </div>

                    {/* Açıklama */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama / Not</label>
                      <input {...form.register("description")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="Araç uyum bilgisi vs." />
                    </div>
                  </div>
                </div>

                {/* Ticari Bilgiler */}
                <div>
                  <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-4 uppercase tracking-wider">Ticari Bilgiler</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Alış Fiyatı (₺)</label>
                      <input type="number" step="0.01" {...form.register("purchasePrice", { valueAsNumber: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="0.00" />
                      {form.formState.errors.purchasePrice && <p className="text-red-500 text-xs mt-1">{form.formState.errors.purchasePrice.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Satış Fiyatı (₺)</label>
                      <input type="number" step="0.01" {...form.register("sellingPrice", { valueAsNumber: true })} className="w-full p-2.5 text-blue-900 font-bold bg-blue-50 border border-blue-200 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="0.00" />
                      {form.formState.errors.sellingPrice && <p className="text-red-500 text-xs mt-1">{form.formState.errors.sellingPrice.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">KDV Oranı (%)</label>
                      <select {...form.register("taxRate", { valueAsNumber: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary">
                        <option value={1}>%1</option>
                        <option value={10}>%10</option>
                        <option value={20}>%20</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Stok Birimi</label>
                      <select {...form.register("unit")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary">
                        <option value="adet">Adet</option>
                        <option value="litre">Litre (Lt)</option>
                        <option value="kutu">Kutu</option>
                        <option value="metre">Metre (m)</option>
                        <option value="set">Set/Takım</option>
                      </select>
                    </div>
                  </div>

                  {/* Kâr Marjı Bilgisi */}
                  {form.watch("sellingPrice") > 0 && form.watch("purchasePrice") > 0 && (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-emerald-700 font-medium">Kâr Marjı:</span>
                        <span className="text-emerald-800 font-bold">
                          ₺{(form.watch("sellingPrice") - form.watch("purchasePrice")).toFixed(2)}
                          {" "}
                          <span className="text-emerald-600 text-xs">
                            (%{(((form.watch("sellingPrice") - form.watch("purchasePrice")) / form.watch("purchasePrice")) * 100).toFixed(1)})
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Miktar / Depo */}
                <div>
                  <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-4 uppercase tracking-wider">Miktar / Depo</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Eldeki Başlangıç Stoğu</label>
                      <input type="number" {...form.register("currentStock", { valueAsNumber: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary font-bold text-center" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Kritik Stok Uyarı Seviyesi</label>
                      <input type="number" {...form.register("minStockLevel", { valueAsNumber: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary text-center" placeholder="5" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Depo Raf/Konum</label>
                      <input {...form.register("location")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary uppercase" placeholder="Örn: A-10-R3" />
                    </div>

                    {/* Tedarikçi — Searchable Dropdown */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tedarikçi / Toptancı Adı (Opsiyonel)</label>
                      {suppliers.length > 0 ? (
                        <SearchableSelect
                          options={[
                            { value: "", label: "— Seçilmedi —" },
                            ...supplierOptions,
                          ]}
                          value={form.watch("supplierName") || ""}
                          onChange={(val) => form.setValue("supplierName", val)}
                          placeholder="Tedarikçi seçiniz..."
                          searchPlaceholder="Tedarikçi adı ara..."
                          emptyMessage="Tedarikçi bulunamadı"
                        />
                      ) : (
                        <input {...form.register("supplierName")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="Toptancı firmayı yazınız" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white mt-8">
                  <button type="button" onClick={() => setOpen(false)} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                    İptal
                  </button>
                  <button type="submit" disabled={submitting} className="px-8 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-70 shadow-md">
                    {submitting ? "Kaydediliyor..." : (initialData ? "Değişiklikleri Kaydet" : "Stok Kartını Oluştur")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
