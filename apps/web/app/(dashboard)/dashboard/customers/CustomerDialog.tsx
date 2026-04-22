"use client";

import { useState } from "react";
import { useForm as useRHForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createCustomerSchema } from "@/lib/validations/customers";
import { createCustomer } from "@/lib/actions/customer.actions";
import { X, Plus, AlertCircle } from "lucide-react";

export function CustomerDialog() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useRHForm<z.infer<typeof createCustomerSchema>>({
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
    },
  });

  const type = form.watch("type");

  async function onSubmit(data: z.infer<typeof createCustomerSchema>) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await createCustomer(data);
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
        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm font-medium">Yeni Müşteri Ekle</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">Yeni Müşteri Kaydı</h2>
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
                
                {/* Müşteri Tipi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri Tipi</label>
                  <select 
                    {...form.register("type")}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block"
                  >
                    <option value="INDIVIDUAL">Şahıs (Bireysel)</option>
                    <option value="CORPORATE">Firma (Kurumsal)</option>
                  </select>
                </div>

                {/* Dinamik Alanlar (Şahıs / Kurumsal) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {type === "INDIVIDUAL" ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ad *</label>
                        <input {...form.register("firstName")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="Adınız" />
                        {form.formState.errors.firstName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.firstName.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Soyad *</label>
                        <input {...form.register("lastName")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="Soyadınız" />
                        {form.formState.errors.lastName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.lastName.message}</p>}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Firma Ünvanı *</label>
                        <input {...form.register("companyName")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="Tam şirket ünvanı" />
                        {form.formState.errors.companyName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.companyName.message}</p>}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Yetkili Kişi</label>
                        <input {...form.register("contactPerson")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="İlgili kişi ad-soyad" />
                      </div>
                    </>
                  )}
                </div>

                {/* İletişim Bilgileri */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                    <input {...form.register("phone")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="05XX XXX XX XX" />
                    {form.formState.errors.phone && <p className="text-red-500 text-xs mt-1">{form.formState.errors.phone.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alternatif Telefon</label>
                    <input {...form.register("secondaryPhone")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="Opsiyonel" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-Posta</label>
                    <input type="email" {...form.register("email")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="ornek@mail.com" />
                    {form.formState.errors.email && <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>}
                  </div>
                </div>

                {/* Fatura/Adres Bilgileri */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vergi Dairesi</label>
                    <input {...form.register("taxOffice")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">VKN / TCKN</label>
                    <input {...form.register("taxNumber")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İl</label>
                    <input {...form.register("city")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İlçe</label>
                    <input {...form.register("district")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Açık Adres</label>
                    <textarea {...form.register("address")} rows={2} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="Mahalle, sokak, no..." />
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
