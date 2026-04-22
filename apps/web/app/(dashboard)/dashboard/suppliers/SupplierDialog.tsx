"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supplierSchema, SupplierInput } from "@/lib/validations/suppliers";
import { createSupplier, updateSupplier } from "@/lib/actions/supplier.actions";
import { 
  X, 
  Plus, 
  Building2, 
  Phone, 
  Mail, 
  User, 
  MapPin, 
  FileText,
  AlertCircle 
} from "lucide-react";

interface SupplierDialogProps {
  initialData?: any;
  trigger?: React.ReactNode;
}

export function SupplierDialog({ initialData, trigger }: SupplierDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: initialData?.name || "",
      contactPerson: initialData?.contactPerson || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      taxOffice: initialData?.taxOffice || "",
      taxNumber: initialData?.taxNumber || "",
      address: initialData?.address || "",
      notes: initialData?.notes || "",
    },
  });

  async function onSubmit(data: SupplierInput) {
    setSubmitting(true);
    setError(null);
    try {
      const res = initialData 
        ? await updateSupplier(initialData.id, data)
        : await createSupplier(data);

      if (res.error) {
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
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary-dark transition-all shadow-sm font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          Yeni Tedarikçi Ekle
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 text-xl flex items-center gap-2">
                <Building2 className="w-6 h-6 text-primary" />
                {initialData ? "Tedarikçi Düzenle" : "Yeni Tedarikçi Tanımla"}
              </h2>
              <button 
                type="button" 
                onClick={() => setOpen(false)} 
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3 mb-6">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" /> Firma / Tedarikçi Adı *
                    </label>
                    <input
                      {...form.register("name")}
                      placeholder="Örn: ABC Otomotiv Yedek Parça Ltd. Şti."
                      className="w-full p-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary rounded-xl text-sm transition-all outline-none"
                    />
                    {form.formState.errors.name && (
                      <span className="text-red-500 text-xs mt-1 block">{form.formState.errors.name.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" /> Yetkili Kişi
                    </label>
                    <input
                      {...form.register("contactPerson")}
                      placeholder="Ad Soyad"
                      className="w-full p-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary rounded-xl text-sm transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" /> Telefon Numarası *
                    </label>
                    <input
                      {...form.register("phone")}
                      placeholder="05xx xxx xx xx"
                      className="w-full p-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary rounded-xl text-sm transition-all outline-none"
                    />
                    {form.formState.errors.phone && (
                      <span className="text-red-500 text-xs mt-1 block">{form.formState.errors.phone.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" /> E-posta Adresi
                    </label>
                    <input
                      {...form.register("email")}
                      placeholder="info@firma.com"
                      className="w-full p-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary rounded-xl text-sm transition-all outline-none"
                    />
                    {form.formState.errors.email && (
                      <span className="text-red-500 text-xs mt-1 block">{form.formState.errors.email.message}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 col-span-1 md:col-span-2">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" /> Vergi Dairesi
                      </label>
                      <input
                        {...form.register("taxOffice")}
                        className="w-full p-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary rounded-xl text-sm transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                         <FileText className="w-4 h-4 text-gray-400" /> Vergi No
                      </label>
                      <input
                        {...form.register("taxNumber")}
                        className="w-full p-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary rounded-xl text-sm transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" /> Adres Bilgisi
                    </label>
                    <textarea
                      {...form.register("address")}
                      rows={2}
                      className="w-full p-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary rounded-xl text-sm transition-all outline-none resize-none"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Notlar / Özel Durumlar</label>
                    <textarea
                      {...form.register("notes")}
                      rows={2}
                      className="w-full p-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary rounded-xl text-sm transition-all outline-none resize-none"
                      placeholder="Tedarikçi ile ilgili ek notlar..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-sm"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-md disabled:opacity-50 text-sm"
                  >
                    {submitting ? "Kaydediliyor..." : initialData ? "Güncelle" : "Tedarikçiyi Kaydet"}
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
