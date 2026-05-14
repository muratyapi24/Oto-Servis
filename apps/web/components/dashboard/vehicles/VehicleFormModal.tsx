"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/ui/Modal";
import { createVehicleSchema, CreateVehicleInput } from "@/lib/validations/vehicles";
import { createVehicle, updateVehicle } from "@/lib/actions/vehicle.actions";
import { AlertCircle } from "lucide-react";

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleData?: any; 
  customers: any[];
}

export default function VehicleFormModal({ isOpen, onClose, vehicleData, customers }: VehicleFormModalProps) {
  const isUpdate = !!vehicleData;
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const form = useForm<CreateVehicleInput>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: {
      customerId: "",
      plate: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      mileage: 0,
      chassisNo: "",
      engineNo: "",
      color: "",
      engineType: "",
      transmission: "",
      fuelType: "",
      notes: ""
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (vehicleData) {
        form.reset({
          customerId: vehicleData.customerId || "",
          plate: vehicleData.plate || "",
          brand: vehicleData.brand || "",
          model: vehicleData.model || "",
          year: vehicleData.year ? Number(vehicleData.year) : new Date().getFullYear(),
          mileage: vehicleData.mileage ? Number(vehicleData.mileage) : 0,
          chassisNo: vehicleData.chassisNo || "",
          engineNo: vehicleData.engineNo || "",
          color: vehicleData.color || "",
          engineType: vehicleData.engineType || "",
          transmission: vehicleData.transmission || "",
          fuelType: vehicleData.fuelType || "",
          notes: vehicleData.notes || ""
        });
      } else {
        form.reset({
          customerId: customers[0]?.id || "",
          plate: "",
          brand: "",
          model: "",
          year: new Date().getFullYear(),
          mileage: 0,
          chassisNo: "",
          engineNo: "",
          color: "",
          engineType: "",
          transmission: "",
          fuelType: "",
          notes: ""
        });
      }
      setErrorMsg(null);
    }
  }, [isOpen, vehicleData, form, customers]);

  const onSubmit = async (data: CreateVehicleInput) => {
    setErrorMsg(null);
    
    // Convert strings to undefined/null internally if empty
    const payload = { 
      ...data, 
      year: isNaN(data.year as number) ? undefined : data.year,
      mileage: isNaN(data.mileage as number) ? undefined : data.mileage
    };

    const res = isUpdate 
      ? await updateVehicle({ ...payload, id: vehicleData.id } as any)
      : await createVehicle(payload as any);
      
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isUpdate ? "Aracı Düzenle" : "Yeni Araç Kaydı"} maxWidth="max-w-xl">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm font-bold border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Araç Sahibi (Müşteri) *</label>
            <select {...form.register("customerId")} className="w-full bg-slate-50 dark:bg-gray-800/50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold">
              <option value="">-- Müşteri Seçin --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {form.formState.errors.customerId && <p className="text-red-500 text-xs mt-1">{form.formState.errors.customerId.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Araç Plakası *</label>
              <input {...form.register("plate")} placeholder="34 ABC 123" className="w-full bg-slate-50 dark:bg-gray-800/50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold uppercase" />
              {form.formState.errors.plate && <p className="text-red-500 text-xs mt-1">{form.formState.errors.plate.message}</p>}
            </div>
            
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Marka *</label>
              <input {...form.register("brand")} placeholder="Örn: Volkswagen" className="w-full bg-slate-50 dark:bg-gray-800/50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold capitalize" />
              {form.formState.errors.brand && <p className="text-red-500 text-xs mt-1">{form.formState.errors.brand.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Model *</label>
              <input {...form.register("model")} placeholder="Örn: Passat" className="w-full bg-slate-50 dark:bg-gray-800/50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold" />
              {form.formState.errors.model && <p className="text-red-500 text-xs mt-1">{form.formState.errors.model.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Üretim Yılı</label>
                <input type="number" {...form.register("year", { valueAsNumber: true })} className="w-full bg-slate-50 dark:bg-gray-800/50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Kilometre (Km)</label>
                <input type="number" {...form.register("mileage", { valueAsNumber: true })} className="w-full bg-slate-50 dark:bg-gray-800/50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex border-t border-slate-100 dark:border-gray-700 pt-4">
           <button 
             type="button" 
             onClick={() => setShowAdvanced(!showAdvanced)} 
             className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:underline"
           >
             {showAdvanced ? "- Ekstra Bilgileri Gizle" : "+ Ekstra Bilgiler (Şasi, Yakıt v.b)"}
           </button>
        </div>

        {showAdvanced && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-gray-800/50/50 p-4 rounded-xl border border-slate-100">
             <div className="space-y-1">
               <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Şasi Numarası</label>
               <input {...form.register("chassisNo")} className="w-full bg-white dark:bg-gray-800 border border-slate-200 px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-colors text-sm font-bold uppercase" />
             </div>
             <div className="space-y-1">
               <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Motor Numarası</label>
               <input {...form.register("engineNo")} className="w-full bg-white dark:bg-gray-800 border border-slate-200 px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-colors text-sm font-bold uppercase" />
             </div>
             
             <div className="space-y-1">
               <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Yakıt Tipi</label>
               <select {...form.register("fuelType")} className="w-full bg-white dark:bg-gray-800 border border-slate-200 px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-colors text-sm font-bold">
                 <option value="">Belirtilmemiş</option>
                 <option value="DİZEL">Dizel</option>
                 <option value="BENZİN">Benzin</option>
                 <option value="LPG">Otogaz (LPG)</option>
                 <option value="HIBRIT">Hibrit</option>
                 <option value="ELEKTRIK">Elektrik</option>
               </select>
             </div>
             <div className="space-y-1">
               <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Vites Tipi</label>
               <select {...form.register("transmission")} className="w-full bg-white dark:bg-gray-800 border border-slate-200 px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-colors text-sm font-bold">
                 <option value="">Belirtilmemiş</option>
                 <option value="MANUEL">Manuel</option>
                 <option value="OTOMATIK">Otomatik</option>
                 <option value="YARIOTOMATIK">Yarı Otomatik</option>
               </select>
             </div>
             
           </div>
        )}

        <div className="space-y-1">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Ön Notlar (Opsiyonel)</label>
          <textarea {...form.register("notes")} rows={2} placeholder="Araca dair hasar veya özel durum belirtin..." className="w-full bg-slate-50 dark:bg-gray-800/50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold resize-none" />
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
             className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-blue-600 shadow-[0_4px_15px_rgba(37,99,235,0.3)] hover:bg-blue-700 transition-all disabled:opacity-70 disabled:animate-pulse"
           >
             {form.formState.isSubmitting ? 'KAYDEDİLİYOR...' : (isUpdate ? 'GÜNCELLE' : 'ARACI KAYDET')}
           </button>
        </div>

      </form>
    </Modal>
  )
}
