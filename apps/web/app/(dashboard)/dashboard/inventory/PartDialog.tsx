"use client";

import { useState } from "react";
import { useForm as useRHForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createPartSchema, updatePartSchema } from "@/lib/validations/inventory";
import { createPart, updatePart } from "@/lib/actions/inventory.actions";
import { X, Plus, AlertCircle, PackagePlus, Edit } from "lucide-react";

export function PartDialog({ categories, initialData }: { categories: { id: string, name: string }[], initialData?: any }) {
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
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
        >
          <PackagePlus className="w-4 h-4" />
          <span className="text-sm font-medium">Stok Kartı Aç (Yeni Parça Ekle)</span>
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
                
                {/* Temel Bilgiler */}
                <div>
                  <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-4 uppercase tracking-wider">Parça Tanımı</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                      <select 
                        {...form.register("categoryId")}
                        className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block"
                      >
                        <option value="">-- Grup Seçiniz --</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      {form.formState.errors.categoryId && <p className="text-red-500 text-xs mt-1">{form.formState.errors.categoryId.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Oem/Parça/Barkod No *</label>
                      <input {...form.register("partNumber")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary uppercase" placeholder="Örn: 90915-YZZD2" />
                      {form.formState.errors.partNumber && <p className="text-red-500 text-xs mt-1">{form.formState.errors.partNumber.message}</p>}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı *</label>
                      <input {...form.register("name")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="Yağ Filtresi vb." />
                      {form.formState.errors.name && <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parça Markası / Üretici</label>
                      <input {...form.register("brand")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="Bosch, Mann vb." />
                    </div>

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
                      <input type="number" {...form.register("taxRate", { valueAsNumber: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="20" />
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
                </div>

                {/* Stok ve Konum */}
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
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tedarikçi / Toptancı Adı (Opsiyonel)</label>
                      <input {...form.register("supplierName")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="Toptancı firmayı yazınız" />
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
