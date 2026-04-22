"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/ui/Modal";
import { createCustomerSchema, CreateCustomerInput, UpdateCustomerInput } from "@/lib/validations/customers";
import { createCustomer, updateCustomer } from "@/lib/actions/customer.actions";
import { AlertCircle } from "lucide-react";

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerData?: any; // If null, mode is Create. If has data, mode is Update.
}

export default function CustomerFormModal({ isOpen, onClose, customerData }: CustomerFormModalProps) {
  const isUpdate = !!customerData;
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const form = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      type: "INDIVIDUAL",
      firstName: "",
      lastName: "",
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      secondaryPhone: "",
      taxOffice: "",
      taxNumber: "",
      city: "",
      district: "",
      address: "",
      notes: "",
    }
  });

  const watchType = form.watch("type");

  useEffect(() => {
    if (isOpen) {
      if (customerData) {
        form.reset({
          type: customerData.type,
          firstName: customerData.firstName || "",
          lastName: customerData.lastName || "",
          companyName: customerData.companyName || "",
          contactPerson: customerData.contactPerson || "",
          email: customerData.email || "",
          phone: customerData.phone || "",
          secondaryPhone: customerData.secondaryPhone || "",
          taxOffice: customerData.taxOffice || "",
          taxNumber: customerData.taxNumber || "",
          city: customerData.city || "",
          district: customerData.district || "",
          address: customerData.address || "",
          notes: customerData.notes || "",
        });
      } else {
        form.reset({
          type: "INDIVIDUAL",
          firstName: "",
          lastName: "",
          companyName: "",
          contactPerson: "",
          email: "",
          phone: "",
          secondaryPhone: "",
          taxOffice: "",
          taxNumber: "",
          city: "",
          district: "",
          address: "",
          notes: "",
        });
      }
      setErrorMsg(null);
    }
  }, [isOpen, customerData, form]);

  const onSubmit = async (data: CreateCustomerInput) => {
    setErrorMsg(null);
    const res = isUpdate 
      ? await updateCustomer({ ...data, id: customerData.id } as UpdateCustomerInput)
      : await createCustomer(data);
      
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isUpdate ? "Müşteriyi Düzenle" : "Yeni Müşteri Ekle"} maxWidth="max-w-2xl">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm font-bold border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}
        
        {/* Type Selection */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
           <button 
             type="button"
             onClick={() => form.setValue("type", "INDIVIDUAL")}
             className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${watchType === 'INDIVIDUAL' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Bireysel
           </button>
           <button 
             type="button"
             onClick={() => form.setValue("type", "CORPORATE")}
             className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${watchType === 'CORPORATE' ? 'bg-white shadow text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Kurumsal
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {watchType === "INDIVIDUAL" ? (
            <>
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Ad</label>
                <input {...form.register("firstName")} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold" />
                {form.formState.errors.firstName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.firstName.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Soyad</label>
                <input {...form.register("lastName")} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold" />
                {form.formState.errors.lastName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.lastName.message}</p>}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Firma Adı</label>
                <input {...form.register("companyName")} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold" />
                {form.formState.errors.companyName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.companyName.message}</p>}
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Yetkili Kişi (Opsiyonel)</label>
                <input {...form.register("contactPerson")} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold" />
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Telefon *</label>
            <input {...form.register("phone")} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold" />
            {form.formState.errors.phone && <p className="text-red-500 text-xs mt-1">{form.formState.errors.phone.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">E-Posta (Opsiyonel)</label>
            <input {...form.register("email")} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold" />
            {form.formState.errors.email && <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>}
          </div>

        </div>
        
        <hr className="border-slate-100" />
        
        {/* Billing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Vergi Dairesi</label>
            <input {...form.register("taxOffice")} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Vergi/TC No</label>
            <input {...form.register("taxNumber")} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Açık Adres</label>
            <textarea {...form.register("address")} rows={2} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold resize-none" />
          </div>
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
             {form.formState.isSubmitting ? 'KAYDEDİLİYOR...' : 'KAYDET'}
           </button>
        </div>

      </form>
    </Modal>
  )
}
