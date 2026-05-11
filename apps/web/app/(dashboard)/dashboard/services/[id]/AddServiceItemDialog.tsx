"use client";

import { useState } from "react";
import { useForm as useRHForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addServiceItemSchema } from "@/lib/validations/services";
import { addServiceItem } from "@/lib/actions/service.actions";
import { X, Plus, Cog, Wrench } from "lucide-react";

type ItemOption = { id: string; name: string; price: number; currentStock?: number };

export function AddServiceItemDialog({ 
  serviceOrderId, 
  parts, 
  mechanics 
}: { 
  serviceOrderId: string; 
  parts: ItemOption[]; 
  mechanics: ItemOption[]; 
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useRHForm<z.infer<typeof addServiceItemSchema>>({
    resolver: zodResolver(addServiceItemSchema),
    defaultValues: {
      serviceOrderId,
      itemType: "PART",
      name: "",
      description: "",
      partId: "",
      mechanicId: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 20,
      discount: 0,
    },
  });

  const watchItemType = form.watch("itemType");

  const onSelectPart = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    form.setValue("partId", val);
    const p = parts.find(x => x.id === val);
    if(p) {
      form.setValue("name", p.name);
      form.setValue("unitPrice", p.price);
    }
  };

  const onSelectMechanic = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    form.setValue("mechanicId", val);
    const m = mechanics.find(x => x.id === val);
    if(m) {
      form.setValue("name", `İşçilik: ${m.name}`);
      form.setValue("unitPrice", m.price || 500); // Varsayılan fiyat, hourlyRate değilse
      form.setValue("mechanicId", m.id);
    }
  };

  async function onSubmit(data: z.infer<typeof addServiceItemSchema>) {
    if (data.itemType === "PART") {
      const selectedPart = parts.find(p => p.id === data.partId);
      if (selectedPart && selectedPart.currentStock !== undefined) {
        if (data.quantity > selectedPart.currentStock) {
          setError(`Yetersiz Stok! Sadece ${selectedPart.currentStock} adet mevcut.`);
          return;
        }
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await addServiceItem(data);
      if (res?.error) setError(res.error);
      else {
        setOpen(false);
        form.reset({ ...data, partId: "", mechanicId: "", name: "", unitPrice: 0, quantity: 1, discount: 0 }); 
      }
    } catch {
      setError("Beklenmeyen hata");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        Parça veya İşçilik Ekle
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="font-bold text-gray-800 text-xl">Kalem Ekle (Faturaya Yansır)</h2>
              <button onClick={() => setOpen(false)}><X className="w-6 h-6 text-gray-500 hover:text-gray-800 transition-colors" /></button>
            </div>
            
            <div className="p-6">
              {error && <div className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
              
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* TİP SEÇİMİ */}
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${watchItemType === 'PART' ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <input type="radio" value="PART" {...form.register("itemType")} className="sr-only" />
                    <Cog className="w-5 h-5" /> Stok Parçası
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${watchItemType === 'LABOR' ? 'border-green-500 bg-green-50 text-green-700 font-bold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <input type="radio" value="LABOR" {...form.register("itemType")} className="sr-only" />
                    <Wrench className="w-5 h-5" /> İşçilik Emeği
                  </label>
                </div>

                {/* DİNAMİK ALAN (PARÇA VEYA USTA SEÇİMİ) */}
                {watchItemType === "PART" && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Stoktan Parça Seçimi *</label>
                    <select className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-sm" onChange={onSelectPart}>
                      <option value="">-- Parça Lütfen Seçiniz --</option>
                      {parts.map(p => (
                        <option key={p.id} value={p.id} disabled={p.currentStock === 0}>
                          {p.name} (Satış: {p.price}₺) - Stok: {p.currentStock}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {watchItemType === "LABOR" && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Görevli Usta Seçimi *</label>
                    <select className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-sm" onChange={onSelectMechanic}>
                      <option value="">-- Usta Seçiniz veya Manuel Girin --</option>
                      {mechanics.map(m => (
                        <option key={m.id} value={m.id}>{m.name} (Ücret: {m.price}₺/Saat)</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* GENEL FORM */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Kalem/İşlem Görünen Adı (Faturada Çıkacak) *</label>
                    <input {...form.register("name")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-blue-500" placeholder="Örn: Motor Yağı 5W-30" />
                    {form.formState.errors.name && <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Miktar / Saat *</label>
                    <input type="number" step="0.01" {...form.register("quantity", { valueAsNumber: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Birim Fiyat (KDV Hariç ₺) *</label>
                    <input type="number" step="0.01" {...form.register("unitPrice", { valueAsNumber: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-bold text-blue-900" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">KDV Oranı (%)</label>
                    <select {...form.register("taxRate", { valueAsNumber: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm">
                      <option value={20}>%20</option>
                      <option value={10}>%10</option>
                      <option value={1}>%1</option>
                      <option value={0}>Muhf (%0)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Satır İndirimi (Net ₺)</label>
                    <input type="number" step="0.01" {...form.register("discount", { valueAsNumber: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-red-600 font-bold" />
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end gap-3 rounded-b-xl">
                  <button type="button" onClick={() => setOpen(false)} className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">İptal</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                    {submitting ? "Kayıt..." : "Hizmet/Parça Ekle"}
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
