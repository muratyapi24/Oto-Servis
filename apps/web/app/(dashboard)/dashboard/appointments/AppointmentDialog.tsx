"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createAppointmentSchema } from "@/lib/validations/appointments";
import { createAppointment, updateAppointment } from "@/lib/actions/appointment.actions";
import { X, CalendarPlus, AlertCircle, Edit3 } from "lucide-react";

// 09:00'dan 18:00'a kadar yarım saatlik bloklar
const TIME_SLOTS = [
  "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", 
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"
];

const SERVICE_TYPES = [
  "Periyodik Bakım", "Genel Arıza", "Mekanik Onarım", 
  "Elektrik/Elektronik", "Fren Sistemi", "Lastik İşlemi", "Ekspertiz/Check-up", "Diğer"
];

export function AppointmentDialog({ 
  customers, 
  vehicles, 
  initialData,
  onClose 
}: { 
  customers: any[], 
  vehicles: any[], 
  initialData?: any,
  onClose?: () => void
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof createAppointmentSchema>>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      customerId: initialData?.customerId || "",
      vehicleId: initialData?.vehicleId || "",
      appointmentDate: initialData?.appointmentDate ? new Date(initialData.appointmentDate) : new Date(),
      appointmentTime: initialData?.appointmentTime || "09:00",
      type: initialData?.type || "Periyodik Bakım",
      notes: initialData?.notes || ""
    },
  });

  // Edit modunda veri değişirse formu güncelle (React Hook Form cache sorunu için)
  useEffect(() => {
    if (initialData && open) {
      form.reset({
        customerId: initialData.customerId,
        vehicleId: initialData.vehicleId || "",
        appointmentDate: new Date(initialData.appointmentDate),
        appointmentTime: initialData.appointmentTime,
        type: initialData.type,
        notes: initialData.notes
      });
    }
  }, [initialData, open, form]);

  const watchCustomerId = form.watch("customerId");
  const filteredVehicles = vehicles.filter((v: any) => v.customerId === watchCustomerId);

  async function onSubmit(data: z.infer<typeof createAppointmentSchema>) {
    setSubmitting(true);
    setError(null);
    try {
      let res;
      if (initialData?.id) {
        res = await updateAppointment({ ...data, id: initialData.id });
      } else {
        res = await createAppointment(data);
      }
      
      if (res?.error) setError(res.error);
      else {
        setOpen(false);
        if (onClose) onClose();
        form.reset();
      }
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  const handleClose = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  return (
    <>
      {initialData && (
        <button 
          onClick={() => setOpen(true)}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Randevuyu Düzenle"
        >
          <Edit3 className="w-5 h-5" />
        </button>
      )}

      {!initialData && (
        <button 
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-bold text-sm"
        >
          <CalendarPlus className="w-5 h-5" />
          Yeni Randevu
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 text-xl flex items-center gap-2">
                 {initialData ? <Edit3 className="w-6 h-6 text-blue-600" /> : <CalendarPlus className="w-6 h-6 text-blue-600" />} 
                 {initialData ? "Randevu Düzenle" : "Takvime Randevu Ekle"}
              </h2>
              <button type="button" onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              {error && <div className="text-red-500 text-sm mb-5 bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-3"><AlertCircle className="w-5 h-5" />{error}</div>}
              
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 flex flex-col h-full">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Müşteri Seçimi *</label>
                    <select {...form.register("customerId")} className="w-full p-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 rounded-xl text-sm transition-colors outline-none cursor-pointer" onChange={(e) => { form.setValue("customerId", e.target.value); form.setValue("vehicleId", ""); }}>
                      <option value="">-- Müşteri Arayın/Seçiniz --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {form.formState.errors.customerId && <span className="text-red-500 text-xs mt-1 block">{form.formState.errors.customerId.message}</span>}
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">İlgili Araç (Opsiyonel)</label>
                    <select {...form.register("vehicleId")} disabled={!watchCustomerId} className="w-full p-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 rounded-xl text-sm transition-colors outline-none cursor-pointer disabled:opacity-50">
                      <option value="">-- Müşterinin Aracı Yok veya Sonra Gelecek --</option>
                      {filteredVehicles.map((v: any) => (
                        <option key={v.id} value={v.id}>{v.plate} ({v.brand} {v.model})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1.5">Randevu Tarihi *</label>
                     <input type="date" {...form.register("appointmentDate", { valueAsDate: true })} className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm" />
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1.5">Seans / Saat *</label>
                     <select {...form.register("appointmentTime")} className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm">
                       {TIME_SLOTS.map(t => (
                         <option key={t} value={t}>{t}</option>
                       ))}
                     </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1.5">Hizmet Türü</label>
                     <select {...form.register("type")} className="w-full p-3 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl text-sm">
                       {SERVICE_TYPES.map(t => (
                         <option key={t} value={t}>{t}</option>
                       ))}
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1.5">Açıklama / Not</label>
                     <input {...form.register("notes")} className="w-full p-3 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl text-sm" placeholder="Müşterinin belirttiği kısa şikayet..." />
                   </div>
                </div>

                <div className="pt-5 mt-2 flex justify-end gap-3 border-t border-gray-100">
                  <button type="button" onClick={handleClose} className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">İptal</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50">
                    {submitting ? "Kaydediliyor..." : (initialData ? "Güncelle" : "Takvime Ekle")}
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
