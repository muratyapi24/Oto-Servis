"use client";

import { useState, useEffect } from "react";
import { useForm as useRHForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createServiceOrderSchema } from "@/lib/validations/services";
import { createServiceOrder } from "@/lib/actions/service.actions";
import { X, Plus, AlertCircle, Wrench } from "lucide-react";

type Customer = { id: string; name: string };
type Vehicle = { id: string; plate: string; customerId: string };
type Mechanic = { id: string; name: string };

export function ServiceOrderDialog({ 
  customers, 
  vehicles, 
  mechanics,
  defaultCustomerId,
  defaultVehicleId,
  trigger
}: { 
  customers: Customer[], 
  vehicles: Vehicle[], 
  mechanics: Mechanic[],
  defaultCustomerId?: string,
  defaultVehicleId?: string,
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useRHForm<z.infer<typeof createServiceOrderSchema>>({
    resolver: zodResolver(createServiceOrderSchema),
    defaultValues: {
      customerId: defaultCustomerId || "",
      vehicleId: defaultVehicleId || "",
      complaintDescription: "",
      inspectionNotes: "",
      internalNotes: "",
      assignedMechanicId: "",
      estimatedCost: 0,
    },
  });

  // Reset form when opened with default values
  useEffect(() => {
    if (open) {
      form.reset({
        customerId: defaultCustomerId || "",
        vehicleId: defaultVehicleId || "",
        complaintDescription: "",
        inspectionNotes: "",
        internalNotes: "",
        assignedMechanicId: "",
        estimatedCost: 0,
      });
    }
  }, [open, defaultCustomerId, defaultVehicleId, form]);

  const watchCustomerId = form.watch("customerId");
  const filteredVehicles = watchCustomerId 
    ? vehicles.filter(v => v.customerId === watchCustomerId)
    : vehicles;

  async function onSubmit(data: z.infer<typeof createServiceOrderSchema>) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await createServiceOrder(data);
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
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <button 
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Yeni İş Emri (Servis Kaydı) Aç</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2 text-gray-800">
                <Wrench className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">Yeni Servis İş Emri</h2>
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Müşteri Seçimi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri Seçimi *</label>
                    <select 
                      {...form.register("customerId")} 
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                      onChange={(e) => {
                         form.setValue("customerId", e.target.value);
                         form.setValue("vehicleId", ""); // Müşteri değiştiğinde aracı sıfırla
                      }}
                    >
                      <option value="">-- Müşteri Seçiniz --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {form.formState.errors.customerId && <p className="text-red-500 text-xs mt-1">{form.formState.errors.customerId.message}</p>}
                  </div>

                  {/* Araç Seçimi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Araç (Plaka) *</label>
                    <select 
                      {...form.register("vehicleId")} 
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                      disabled={!watchCustomerId}
                    >
                      <option value="">-- Araç Seçiniz --</option>
                      {filteredVehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.plate}</option>
                      ))}
                    </select>
                    {form.formState.errors.vehicleId && <p className="text-red-500 text-xs mt-1">{form.formState.errors.vehicleId.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri Şikayeti / Geliş Nedeni *</label>
                  <textarea 
                    {...form.register("complaintDescription")} 
                    rows={3} 
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" 
                    placeholder="Müşterinin belirttiği arıza veya bakım talebini detaylandırınız."
                  />
                  {form.formState.errors.complaintDescription && <p className="text-red-500 text-xs mt-1">{form.formState.errors.complaintDescription.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İlk Muayene / Servis Notları</label>
                    <textarea 
                      {...form.register("inspectionNotes")} 
                      rows={2} 
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" 
                      placeholder="Aracı teslim alırken gördüğünüz fiziksel hasarlar veya tespitler."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İç Notlar (Sadece Servis)</label>
                    <textarea 
                      {...form.register("internalNotes")} 
                      rows={2} 
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" 
                      placeholder="Ustalara özel teknik notlar veya gizli açıklamalar (faturaya yansımaz)."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Atanan Usta (Opsiyonel)</label>
                    <select 
                      {...form.register("assignedMechanicId")} 
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                    >
                      <option value="">-- Daha Sonra Belirle --</option>
                      {mechanics.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Müşteriye Verilen Tahmini Maliyet (₺)</label>
                    <input 
                      type="number" 
                      {...form.register("estimatedCost", { valueAsNumber: true })} 
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" 
                      placeholder="0.00" 
                    />
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
                  <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                    İptal
                  </button>
                  <button type="submit" disabled={submitting} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-70">
                    {submitting ? "Kayıt Oluşturuluyor..." : "İş Emrini Başlat"}
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
