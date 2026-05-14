"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Modal from "@/components/ui/Modal";
import { createServiceOrderSchema } from "@/lib/validations/services";
import { createServiceOrder } from "@/lib/actions/service.actions";
import { AlertCircle } from "lucide-react";

interface ServiceOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: any[];
  vehicles: any[];
  mechanics: any[];
  defaultCustomerId?: string;
  defaultVehicleId?: string;
}

export default function ServiceOrderFormModal({ 
  isOpen, 
  onClose, 
  customers, 
  vehicles, 
  mechanics,
  defaultCustomerId,
  defaultVehicleId
}: ServiceOrderFormModalProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<z.infer<typeof createServiceOrderSchema>>({
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

  useEffect(() => {
    if (isOpen) {
      form.reset({
        customerId: defaultCustomerId || "",
        vehicleId: defaultVehicleId || "",
        complaintDescription: "",
        inspectionNotes: "",
        internalNotes: "",
        assignedMechanicId: "",
        estimatedCost: 0,
      });
      setErrorMsg(null);
    }
  }, [isOpen, defaultCustomerId, defaultVehicleId, form]);

  const watchCustomerId = form.watch("customerId");
  const filteredVehicles = watchCustomerId 
    ? vehicles.filter(v => v.customerId === watchCustomerId)
    : vehicles;

  const onSubmit = async (data: z.infer<typeof createServiceOrderSchema>) => {
    setErrorMsg(null);
    
    // RHF ile boş olan assignedMechanicId'yi undefine/null tipine handle etmesi için düzeltmeler:
    const payload = {
      ...data,
      assignedMechanicId: data.assignedMechanicId === "" ? undefined : data.assignedMechanicId,
      estimatedCost: isNaN(Number(data.estimatedCost)) ? undefined : Number(data.estimatedCost)
    };

    const res = await createServiceOrder(payload);
    
    if (res?.error) {
      setErrorMsg(res.error);
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yeni Servis İş Emri Oluştur" maxWidth="max-w-2xl">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm font-bold border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Müşteri Seçimi *</label>
            <select 
              {...form.register("customerId")} 
              onChange={(e) => {
                 form.setValue("customerId", e.target.value);
                 form.setValue("vehicleId", ""); // Araç sıfırlansın
              }}
              className="w-full bg-slate-50 dark:bg-gray-800/50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold"
            >
              <option value="">-- Müşteri Seçin --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {form.formState.errors.customerId && <p className="text-red-500 text-xs mt-1">{form.formState.errors.customerId.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Araç Plakası *</label>
            <select 
              {...form.register("vehicleId")} 
              disabled={!watchCustomerId}
              className="w-full bg-slate-50 dark:bg-gray-800/50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold disabled:opacity-50"
            >
              <option value="">-- Araç Seçin --</option>
              {filteredVehicles.map(v => (
                <option key={v.id} value={v.id}>{v.plate}</option>
              ))}
            </select>
            {form.formState.errors.vehicleId && <p className="text-red-500 text-xs mt-1">{form.formState.errors.vehicleId.message}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Müşteri Şikayeti / Geliş Nedeni *</label>
          <textarea 
            {...form.register("complaintDescription")} 
            rows={3} 
            placeholder="Arıza veya bakım talebi detayları..."
            className="w-full bg-slate-50 dark:bg-gray-800/50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold resize-none"
          />
          {form.formState.errors.complaintDescription && <p className="text-red-500 text-xs mt-1">{form.formState.errors.complaintDescription.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-gray-800/50/50 p-4 rounded-xl border border-slate-100">
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">İlk Kontrol & Notlar</label>
            <textarea 
              {...form.register("inspectionNotes")} 
              rows={2} 
              placeholder="Araçta fiziksel göçük, eksik vb..."
              className="w-full bg-white dark:bg-gray-800 border border-slate-200 px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-colors text-sm font-bold resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">İç Notlar (Sadece Servis)</label>
            <textarea 
              {...form.register("internalNotes")} 
              rows={2} 
              placeholder="Ustalara özel gizli/teknik açıklamalar..."
              className="w-full bg-white dark:bg-gray-800 border border-slate-200 px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-colors text-sm font-bold resize-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Atanan Usta (Opsiyonel)</label>
            <select 
              {...form.register("assignedMechanicId")} 
              className="w-full bg-slate-50 dark:bg-gray-800/50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold"
            >
              <option value="">-- Daha Sonra Belirle --</option>
              {mechanics.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Tahmini Başlangıç Maliyeti (₺)</label>
            <input 
              type="number" 
              {...form.register("estimatedCost", { valueAsNumber: true })} 
              className="w-full bg-slate-50 dark:bg-gray-800/50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-gray-700">
           <button 
             type="button"
             onClick={onClose}
             className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200:bg-slate-700 transition-colors"
           >
             İPTAL
           </button>
           <button 
             type="submit"
             disabled={form.formState.isSubmitting}
             className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-blue-600 shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-70 disabled:animate-pulse"
           >
             {form.formState.isSubmitting ? 'OLUŞTURULUYOR...' : 'İŞ EMRİNİ AÇ'}
           </button>
        </div>
      </form>
    </Modal>
  )
}
