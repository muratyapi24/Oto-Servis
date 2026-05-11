"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/ui/Modal";
import { createMechanicSchema, CreateMechanicInput, updateMechanicSchema } from "@/lib/validations/mechanics";
import { createMechanic, updateMechanic } from "@/lib/actions/mechanic.actions";
import { AlertCircle, X, Plus } from "lucide-react";

interface MechanicFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mechanicData?: any; 
}

export default function MechanicFormModal({ isOpen, onClose, mechanicData }: MechanicFormModalProps) {
  const isUpdate = !!mechanicData;
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [specialtiesList, setSpecialtiesList] = useState<string[]>([]);
  
  const form = useForm<CreateMechanicInput>({
    resolver: zodResolver(createMechanicSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      specialties: [],
      experienceYears: 0,
      hourlyRate: 0,
      isActive: true,
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (mechanicData) {
        form.reset({
          firstName: mechanicData.firstName || "",
          lastName: mechanicData.lastName || "",
          phone: mechanicData.phone || "",
          email: mechanicData.email || "",
          specialties: mechanicData.specialties || [],
          experienceYears: Number(mechanicData.experienceYears) || 0,
          hourlyRate: Number(mechanicData.hourlyRate) || 0,
          isActive: mechanicData.isActive ?? true,
          role: mechanicData.role || "Usta",
          shiftStart: mechanicData.shiftStart || "08:00",
          shiftEnd: mechanicData.shiftEnd || "18:00",
        });
        setSpecialtiesList(mechanicData.specialties || []);
      } else {
        form.reset({
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          specialties: [],
          experienceYears: 0, // NaN olmaması için form defaults düzeltildi
          hourlyRate: 0,
          isActive: true,
          role: "Usta",
          shiftStart: "08:00",
          shiftEnd: "18:00",
        });
        setSpecialtiesList([]);
      }
      setErrorMsg(null);
      setSpecialtyInput("");
    }
  }, [isOpen, mechanicData, form]);

  const addSpecialty = () => {
    if(specialtyInput.trim() && !specialtiesList.includes(specialtyInput.trim())) {
      const newSpecs = [...specialtiesList, specialtyInput.trim()];
      setSpecialtiesList(newSpecs);
      form.setValue("specialties", newSpecs);
      setSpecialtyInput("");
    }
  };

  const removeSpecialty = (spec: string) => {
    const newSpecs = specialtiesList.filter(s => s !== spec);
    setSpecialtiesList(newSpecs);
    form.setValue("specialties", newSpecs);
  };

  const onSubmit = async (data: CreateMechanicInput) => {
    setErrorMsg(null);
    
    // Explicit array ataması güvencesi
    data.specialties = specialtiesList;

    const res = isUpdate 
      ? await updateMechanic({ ...data, id: mechanicData.id })
      : await createMechanic(data);
      
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isUpdate ? "Personeli Düzenle" : "Yeni Personel Ekle"} maxWidth="max-w-xl">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm font-bold border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Personel Adı *</label>
            <input {...form.register("firstName")} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold" />
            {form.formState.errors.firstName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.firstName.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Personel Soyadı *</label>
            <input {...form.register("lastName")} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold" />
            {form.formState.errors.lastName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.lastName.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">İletişim (Telefon)</label>
            <input {...form.register("phone")} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">E-Posta (Opsiyonel)</label>
            <input {...form.register("email")} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold" />
            {form.formState.errors.email && <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>}
          </div>
        </div>
        
        <hr className="border-slate-100" />
        
        {/* Professional Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Rol / Unvan *</label>
            <select {...form.register("role")} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold">
              <option value="Usta">Usta</option>
              <option value="Teknisyen">Teknisyen</option>
              <option value="Muhasebe">Muhasebe</option>
              <option value="Yönetici">Yönetici</option>
              <option value="Resepsiyon">Resepsiyon</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Deneyim Yılı</label>
            <input type="number" {...form.register("experienceYears", { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Saatlik Ücret (₺)</label>
            <input type="number" {...form.register("hourlyRate", { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Vardiya Başlangıç</label>
            <input type="time" {...form.register("shiftStart")} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Vardiya Bitiş</label>
            <input type="time" {...form.register("shiftEnd")} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Uzmanlık Alanları *</label>
          <div className="flex gap-2">
            <input 
               value={specialtyInput}
               onChange={(e) => setSpecialtyInput(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSpecialty(); } }}
               placeholder="Örn: Motor Mekaniği, Elektrik, Kaporta..."
               className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold" 
            />
            <button 
              type="button" 
              onClick={addSpecialty}
              className="bg-slate-200 text-slate-700 font-bold px-4 rounded-xl hover:bg-slate-300 transition"
            >
               <Plus className="w-4 h-4" />
            </button>
          </div>
          {form.formState.errors.specialties && <p className="text-red-500 text-xs mt-1">{form.formState.errors.specialties.message}</p>}
          
          <div className="flex flex-wrap gap-2 mt-3">
             {specialtiesList.map(spec => (
                <span key={spec} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-100">
                  {spec}
                  <button type="button" onClick={() => removeSpecialty(spec)} className="hover:text-red-500">
                     <X className="w-3 h-3" />
                  </button>
                </span>
             ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
           <input type="checkbox" id="isActive" {...form.register("isActive")} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
           <label htmlFor="isActive" className="text-sm font-bold text-slate-700 cursor-pointer">
              Şu an sahada / vardiyada aktif olarak çalışıyor
           </label>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
           <button 
             type="button"
             onClick={onClose}
             className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
           >
             İPTAL
           </button>
           <button 
             type="submit"
             disabled={form.formState.isSubmitting}
             className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-blue-600 shadow-[0_4px_15px_rgba(37,99,235,0.3)] hover:bg-blue-700 transition-all disabled:opacity-70 disabled:animate-pulse"
           >
             {form.formState.isSubmitting ? 'KAYDEDİLİYOR...' : 'KAYDET'}
           </button>
        </div>

      </form>
    </Modal>
  )
}
