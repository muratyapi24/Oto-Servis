"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/ui/Modal";
import { createAppointmentSchema, CreateAppointmentInput } from "@/lib/validations/appointments";
import { createAppointment, updateAppointment } from "@/lib/actions/appointment.actions";
import { AlertCircle } from "lucide-react";

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentData?: any; 
  customers: any[];
  vehicles: any[];
}

export default function AppointmentFormModal({ isOpen, onClose, appointmentData, customers, vehicles }: AppointmentFormModalProps) {
  const isUpdate = !!appointmentData;
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const form = useForm<CreateAppointmentInput>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      customerId: "",
      vehicleId: "",
      appointmentDate: new Date(),
      appointmentTime: "09:00",
      type: "BAKIM",
      notes: ""
    }
  });

  const selectedCustomerId = form.watch("customerId");

  // Filter vehicles specifically for the selected customer
  const filteredVehicles = useMemo(() => {
    if (!selectedCustomerId) return [];
    return vehicles.filter(v => v.customerId === selectedCustomerId);
  }, [selectedCustomerId, vehicles]);

  useEffect(() => {
    if (isOpen) {
      if (appointmentData) {
        form.reset({
          customerId: appointmentData.customerId || "",
          vehicleId: appointmentData.vehicleId || "",
          appointmentDate: new Date(appointmentData.appointmentDate),
          appointmentTime: appointmentData.appointmentTime || "09:00",
          type: appointmentData.type || "BAKIM",
          notes: appointmentData.notes || ""
        });
      } else {
        form.reset({
          customerId: customers[0]?.id || "",
          vehicleId: "",
          appointmentDate: new Date(),
          appointmentTime: "09:00",
          type: "BAKIM",
          notes: ""
        });
      }
      setErrorMsg(null);
    }
  }, [isOpen, appointmentData, form, customers]);

  const onSubmit = async (data: CreateAppointmentInput) => {
    setErrorMsg(null);
    const payload = { ...data, vehicleId: data.vehicleId === "null" || !data.vehicleId ? undefined : data.vehicleId };

    const res = isUpdate 
      ? await updateAppointment({ ...payload, id: appointmentData.id })
      : await createAppointment(payload);
      
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isUpdate ? "Randevuyu Düzenle" : "Yeni Randevu Oluştur"} maxWidth="max-w-lg">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm font-bold border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Müşteri Seçimi *</label>
            <select {...form.register("customerId")} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold">
              <option value="">-- Müşteri Seçin --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {form.formState.errors.customerId && <p className="text-red-500 text-xs mt-1">{form.formState.errors.customerId.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Araç Seçimi (Opsiyonel)</label>
            <select {...form.register("vehicleId")} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold disabled:opacity-50">
              <option value="">Araç Belirtilmedi</option>
              {filteredVehicles.map(v => (
                <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>
              ))}
            </select>
            {selectedCustomerId && filteredVehicles.length === 0 && (
              <p className="text-orange-500 text-xs mt-1 font-medium">Bu müşteriye ait kayıtlı araç bulunmuyor.</p>
            )}
          </div>
        </div>
        
        <hr className="border-slate-100" />
        
        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Tarih *</label>
            <input type="date" {...form.register("appointmentDate", { valueAsDate: true })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold" />
            {form.formState.errors.appointmentDate && <p className="text-red-500 text-xs mt-1">{form.formState.errors.appointmentDate.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Saat *</label>
            <input type="time" {...form.register("appointmentTime")} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold" />
            {form.formState.errors.appointmentTime && <p className="text-red-500 text-xs mt-1">{form.formState.errors.appointmentTime.message}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Servis Tipi *</label>
          <select {...form.register("type")} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold">
            <option value="BAKIM">Periyodik Bakım</option>
            <option value="ARIZA">Arıza & Onarım</option>
            <option value="MUAYENE">Muayene Hazırlık</option>
            <option value="EXPERTIZ">Oto Ekspertiz</option>
            <option value="DIGER">Diğer</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Notlar / Şikayet (Opsiyonel)</label>
          <textarea {...form.register("notes")} rows={3} placeholder="Müşterinin belirttiği ön şikayet veya notlar..." className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold resize-none" />
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
           <button 
             type="button"
             onClick={onClose}
             className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200:bg-slate-700 transition-colors"
           >
             İPTAL
           </button>
           <button 
             type="submit"
             disabled={form.formState.isSubmitting}
             className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-blue-600 shadow-[0_4px_15px_rgba(37,99,235,0.3)] hover:bg-blue-700 transition-all disabled:opacity-70 disabled:animate-pulse"
           >
             {form.formState.isSubmitting ? 'İŞLENİYOR...' : 'RANDEVU OLUŞTUR'}
           </button>
        </div>

      </form>
    </Modal>
  )
}
