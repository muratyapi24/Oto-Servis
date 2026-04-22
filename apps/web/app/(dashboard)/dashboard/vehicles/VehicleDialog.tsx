"use client";

import { useState } from "react";
import { useForm as useRHForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createVehicleSchema } from "@/lib/validations/vehicles";
import { createVehicle } from "@/lib/actions/vehicle.actions";
import { X, Plus, AlertCircle, Car } from "lucide-react";

export function VehicleDialog({ customers }: { customers: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useRHForm<z.infer<typeof createVehicleSchema>>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: {
      customerId: "",
      plate: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      fuelType: "",
      transmission: "",
      mileage: 0,
      chassisNo: "",
      engineNo: "",
      color: "",
      notes: ""
    },
  });

  async function onSubmit(data: z.infer<typeof createVehicleSchema>) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await createVehicle(data);
      if (res?.error) {
        setError(res.error);
      } else {
        setOpen(false);
        form.reset();
      }
    } catch (err) {
      setError("Beklenmeyen bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-700/20 active:scale-95 duration-150 text-sm"
      >
        <Plus className="w-5 h-5" />
        Yeni Araç
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2 text-gray-800">
                <Car className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">Yeni Araç Kaydı</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-800 transition-colors">
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

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                
                {/* Müşteri Seçimi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Araç Sahibi (Müşteri) *</label>
                  <select 
                    {...form.register("customerId")}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block"
                  >
                    <option value="">-- Müşteri Seçiniz --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {form.formState.errors.customerId && <p className="text-red-500 text-xs mt-1">{form.formState.errors.customerId.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plaka *</label>
                    <input {...form.register("plate")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary uppercase" placeholder="34 ABC 123" />
                    {form.formState.errors.plate && <p className="text-red-500 text-xs mt-1">{form.formState.errors.plate.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marka *</label>
                    <input {...form.register("brand")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="Örn: Volkswagen" />
                    {form.formState.errors.brand && <p className="text-red-500 text-xs mt-1">{form.formState.errors.brand.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                    <input {...form.register("model")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="Örn: Passat" />
                    {form.formState.errors.model && <p className="text-red-500 text-xs mt-1">{form.formState.errors.model.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Üretim Yılı</label>
                    <input type="number" {...form.register("year", { valueAsNumber: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="2020" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Güncel KM</label>
                    <input type="number" {...form.register("mileage", { valueAsNumber: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="100000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Yakıt Türü</label>
                    <select {...form.register("fuelType")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary">
                      <option value="">Seçiniz</option>
                      <option value="Benzin">Benzin</option>
                      <option value="Dizel">Dizel</option>
                      <option value="LPG">LPG / Hibrit</option>
                      <option value="Elektrik">Elektrik</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vites Tipi</label>
                    <select {...form.register("transmission")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary">
                      <option value="">Seçiniz</option>
                      <option value="Otomatik">Otomatik</option>
                      <option value="Manuel">Manuel</option>
                    </select>
                  </div>
                </div>

                {/* Teknik ve Adres Bilgileri */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Şase No (VIN)</label>
                    <input {...form.register("chassisNo")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="On yedi haneli VIN" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motor No</label>
                    <input {...form.register("engineNo")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Araç Notları</label>
                    <textarea {...form.register("notes")} rows={2} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="Hasar durumu, müşteri talepleri vb." />
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
                  <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                    İptal
                  </button>
                  <button type="submit" disabled={submitting} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-70">
                    {submitting ? "Kaydediliyor..." : "Kaydet"}
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
