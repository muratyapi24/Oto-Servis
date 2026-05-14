"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/ui/Modal";
import { createMechanicSchema, CreateMechanicInput } from "@/lib/validations/mechanics";
import { createMechanic, updateMechanic } from "@/lib/actions/mechanic.actions";
import { AlertCircle, X, Plus } from "lucide-react";
import {
  DASHBOARD_ACTIONS,
  DASHBOARD_FORMS,
  dashboardStatusBadgeClass,
} from "@/lib/dashboard-ui-standards";

interface MechanicFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mechanicData?: any; 
}

const fieldShellClass = "space-y-1";
const fieldErrorClass = "text-error text-xs mt-1";

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
          <div className={DASHBOARD_FORMS.alertError}>
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={fieldShellClass}>
            <label className={DASHBOARD_FORMS.label}>Personel Adı *</label>
            <input {...form.register("firstName")} className={DASHBOARD_FORMS.control} />
            {form.formState.errors.firstName && <p className={fieldErrorClass}>{form.formState.errors.firstName.message}</p>}
          </div>
          <div className={fieldShellClass}>
            <label className={DASHBOARD_FORMS.label}>Personel Soyadı *</label>
            <input {...form.register("lastName")} className={DASHBOARD_FORMS.control} />
            {form.formState.errors.lastName && <p className={fieldErrorClass}>{form.formState.errors.lastName.message}</p>}
          </div>
          <div className={fieldShellClass}>
            <label className={DASHBOARD_FORMS.label}>İletişim (Telefon)</label>
            <input {...form.register("phone")} className={DASHBOARD_FORMS.control} />
          </div>
          <div className={fieldShellClass}>
            <label className={DASHBOARD_FORMS.label}>E-Posta (Opsiyonel)</label>
            <input {...form.register("email")} className={DASHBOARD_FORMS.control} />
            {form.formState.errors.email && <p className={fieldErrorClass}>{form.formState.errors.email.message}</p>}
          </div>
        </div>
        
        <hr className="border-outline-variant/20" />
        
        {/* Professional Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={fieldShellClass}>
            <label className={DASHBOARD_FORMS.label}>Rol / Unvan *</label>
            <select {...form.register("role")} className={DASHBOARD_FORMS.select}>
              <option value="Usta">Usta</option>
              <option value="Teknisyen">Teknisyen</option>
              <option value="Muhasebe">Muhasebe</option>
              <option value="Yönetici">Yönetici</option>
              <option value="Resepsiyon">Resepsiyon</option>
            </select>
          </div>
          <div className={fieldShellClass}>
            <label className={DASHBOARD_FORMS.label}>Deneyim Yılı</label>
            <input type="number" {...form.register("experienceYears", { valueAsNumber: true })} className={DASHBOARD_FORMS.control} />
          </div>
          <div className={fieldShellClass}>
            <label className={DASHBOARD_FORMS.label}>Saatlik Ücret (₺)</label>
            <input type="number" {...form.register("hourlyRate", { valueAsNumber: true })} className={DASHBOARD_FORMS.control} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={fieldShellClass}>
            <label className={DASHBOARD_FORMS.label}>Vardiya Başlangıç</label>
            <input type="time" {...form.register("shiftStart")} className={DASHBOARD_FORMS.control} />
          </div>
          <div className={fieldShellClass}>
            <label className={DASHBOARD_FORMS.label}>Vardiya Bitiş</label>
            <input type="time" {...form.register("shiftEnd")} className={DASHBOARD_FORMS.control} />
          </div>
        </div>

        <div className={fieldShellClass}>
          <label className={DASHBOARD_FORMS.label}>Uzmanlık Alanları *</label>
          <div className="flex gap-2">
            <input 
               value={specialtyInput}
               onChange={(e) => setSpecialtyInput(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSpecialty(); } }}
               placeholder="Örn: Motor Mekaniği, Elektrik, Kaporta..."
               className={`${DASHBOARD_FORMS.control} flex-1`}
            />
            <button 
              type="button" 
              onClick={addSpecialty}
              className={DASHBOARD_ACTIONS.iconButtonPrimary}
            >
               <Plus className="w-4 h-4" />
            </button>
          </div>
          {form.formState.errors.specialties && <p className={fieldErrorClass}>{form.formState.errors.specialties.message}</p>}
          
          <div className="flex flex-wrap gap-2 mt-3">
             {specialtiesList.map(spec => (
                <span key={spec} className={dashboardStatusBadgeClass("info", "px-3 py-1 text-[10px] uppercase tracking-widest")}>
                  {spec}
                  <button type="button" onClick={() => removeSpecialty(spec)} className="hover:text-error">
                     <X className="w-3 h-3" />
                  </button>
                </span>
             ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
           <input type="checkbox" id="isActive" {...form.register("isActive")} className="w-4 h-4 rounded text-primary focus:ring-primary" />
           <label htmlFor="isActive" className="text-sm font-bold text-on-surface cursor-pointer">
              Şu an sahada / vardiyada aktif olarak çalışıyor
           </label>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/20">
           <button 
             type="button"
             onClick={onClose}
             className={DASHBOARD_ACTIONS.secondaryButton}
           >
             İPTAL
           </button>
           <button 
             type="submit"
             disabled={form.formState.isSubmitting}
             className={DASHBOARD_FORMS.primaryButton}
           >
             {form.formState.isSubmitting ? 'KAYDEDİLİYOR...' : 'KAYDET'}
           </button>
        </div>

      </form>
    </Modal>
  )
}
