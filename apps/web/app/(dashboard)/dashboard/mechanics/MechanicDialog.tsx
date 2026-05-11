"use client";

import { useState } from "react";
import { useForm as useRHForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createMechanicSchema } from "@/lib/validations/mechanics";
import { createMechanic } from "@/lib/actions/mechanic.actions";
import { X, Plus, AlertCircle, Wrench } from "lucide-react";

export function MechanicDialog() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useRHForm<z.infer<typeof createMechanicSchema>>({
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
      role: "Usta",
      shiftStart: "08:00",
      shiftEnd: "18:00",
    },
  });

  const watchSpecialties = form.watch("specialties");

  const availableSpecialties = [
    "Motor", "Mekanik", "Elektrik", "Elektronik", "Kaporta", "Boya", "Lastik", "Klima", "Genel Bakım"
  ];

  const handleToggleSpecialty = (sp: string) => {
    const current = watchSpecialties || [];
    if (current.includes(sp)) {
      form.setValue("specialties", current.filter(s => s !== sp));
    } else {
      form.setValue("specialties", [...current, sp]);
    }
  };

  async function onSubmit(data: z.infer<typeof createMechanicSchema>) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await createMechanic(data);
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
        <span className="text-sm font-medium">Yeni Usta Ekle</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2 text-gray-800">
                <Wrench className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">Yeni Servis Ustası Kaydı</h2>
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

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ad *</label>
                    <input {...form.register("firstName")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="Ustanın Adı" />
                    {form.formState.errors.firstName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Soyad *</label>
                    <input {...form.register("lastName")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="Ustanın Soyadı" />
                    {form.formState.errors.lastName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.lastName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <input {...form.register("phone")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="05XX XXX XX XX" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-Posta</label>
                    <input type="email" {...form.register("email")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="ornek@mail.com" />
                    {form.formState.errors.email && <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Uzmanlık Alanları *</label>
                  <div className="flex flex-wrap gap-2">
                    {availableSpecialties.map(sp => (
                      <button
                        key={sp}
                        type="button"
                        onClick={() => handleToggleSpecialty(sp)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                          watchSpecialties?.includes(sp) 
                            ? "bg-primary text-white border-primary" 
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary/50 hover:bg-primary/5"
                        }`}
                      >
                        {sp}
                      </button>
                    ))}
                  </div>
                  {form.formState.errors.specialties && <p className="text-red-500 text-xs mt-2">{form.formState.errors.specialties.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deneyim (Yıl)</label>
                    <input type="number" {...form.register("experienceYears", { valueAsNumber: true })} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="Örn: 5" />
                    {form.formState.errors.experienceYears && <p className="text-red-500 text-xs mt-1">{form.formState.errors.experienceYears.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dakika/Saatlik Ücret (Taban Maliyet)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₺</span>
                      <input type="number" step="0.01" {...form.register("hourlyRate", { valueAsNumber: true })} className="w-full pl-8 p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol / Unvan *</label>
                    <select {...form.register("role")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary">
                      <option value="Usta">Usta</option>
                      <option value="Teknisyen">Teknisyen</option>
                      <option value="Muhasebe">Muhasebe</option>
                      <option value="Yönetici">Yönetici</option>
                      <option value="Resepsiyon">Resepsiyon</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vardiya Başlangıç</label>
                    <input type="time" {...form.register("shiftStart")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vardiya Bitiş</label>
                    <input type="time" {...form.register("shiftEnd")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="isActive" {...form.register("isActive")} className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                  <label htmlFor="isActive" className="text-sm cursor-pointer text-gray-700 font-medium">Usta şu an aktif (servis veriyor)</label>
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
