"use client";

import { useState } from "react";
import { useForm as useRHForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createPartCategorySchema } from "@/lib/validations/inventory";
import { deletePartCategory, updatePartCategory, createPartCategory } from "@/lib/actions/inventory.actions";
import { X, Plus, AlertCircle, Tags, Trash2, Edit } from "lucide-react";

export function CategoryDialog({ categories = [] }: { categories?: any[] }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useRHForm<z.infer<typeof createPartCategorySchema>>({
    resolver: zodResolver(createPartCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  async function onSubmit(data: z.infer<typeof createPartCategorySchema>) {
    setSubmitting(true);
    setError(null);
    try {
      let res;
      if (editingId) {
        res = await updatePartCategory({ ...data, id: editingId });
      } else {
        res = await createPartCategory(data);
      }

      if (res?.error) {
        setError(res.error);
      } else {
        setEditingId(null);
        form.reset();
      }
    } catch (err) {
      setError("Beklenmeyen bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if(confirm("Kategoriyi silmek istiyor musunuz?")) {
      const res = await deletePartCategory(id);
      if(res?.error) setError(res.error);
    }
  }

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 whitespace-nowrap bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
      >
        <Tags className="w-4 h-4" />
        <span>Yeni Kategori Ekle</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2 text-gray-800">
                <Tags className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">Stok Kategorisi Ekle</h2>
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

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Adı *</label>
                  <input {...form.register("name")} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="Madeni Yağlar, Akü vb." />
                  {form.formState.errors.name && <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <textarea {...form.register("description")} rows={3} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary" placeholder="Opsiyonel kategori notları" />
                </div>

                <div className="pt-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white mt-8">
                  <button type="button" onClick={() => { setOpen(false); setEditingId(null); form.reset(); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                    {editingId ? "İptal" : "Kapat"}
                  </button>
                  <button type="submit" disabled={submitting} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-70">
                    {submitting ? "İşleniyor..." : (editingId ? "Güncelle" : "Ekle")}
                  </button>
                </div>
              </form>

              {/* Category List */}
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Mevcut Kategoriler</h3>
                <div className="space-y-2">
                  {categories.length === 0 ? (
                    <p className="text-xs text-slate-500">Kategori bulunmuyor.</p>
                  ) : (
                    categories.map(c => (
                      <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{c.name}</p>
                          {c.description && <p className="text-xs text-slate-500">{c.description}</p>}
                        </div>
                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                          <button 
                             onClick={() => {
                               setEditingId(c.id);
                               form.reset({ name: c.name, description: c.description || "", isActive: c.isActive });
                             }} 
                             className="p-1.5 text-slate-400 hover:text-primary hover:bg-white rounded-md transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                             onClick={() => handleDelete(c.id)} 
                             className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-md transition-colors"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
