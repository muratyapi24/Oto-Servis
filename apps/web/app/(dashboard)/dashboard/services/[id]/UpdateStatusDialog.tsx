"use client";

import { useState } from "react";
import { useForm as useRHForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateOrderStatusSchema } from "@/lib/validations/services";
import { updateOrderStatus } from "@/lib/actions/service.actions";
import { X, RefreshCcw, AlertCircle } from "lucide-react";

export function UpdateStatusDialog({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useRHForm<z.infer<typeof updateOrderStatusSchema>>({
    resolver: zodResolver(updateOrderStatusSchema),
    defaultValues: {
      orderId,
      status: currentStatus as any,
    },
  });

  async function onSubmit(data: z.infer<typeof updateOrderStatusSchema>) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await updateOrderStatus(data);
      if (res?.error) setError(res.error);
      else setOpen(false);
    } catch {
      setError("Beklenmeyen hata");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="text-xs bg-white text-gray-700 border border-gray-300 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-50 transition-colors"
      >
        <RefreshCcw className="w-3.5 h-3.5" />
        Durum Güncelle
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-bold text-gray-800">Sipariş Durumu</h2>
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-4">
              {error && <div className="text-red-500 text-sm mb-3">{error}</div>}
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <select 
                  {...form.register("status")}
                  className="w-full p-2.5 border rounded-lg focus:ring-primary"
                >
                  <option value="PENDING">Bekliyor (PENDING)</option>
                  <option value="IN_PROGRESS">İşlemde (IN PROGRESS)</option>
                  <option value="WAITING_APPROVAL">Onay Bekliyor (WAITING APPROVAL)</option>
                  <option value="COMPLETED">Tamamlandı (COMPLETED)</option>
                  <option value="CANCELLED">İptal Edildi (CANCELLED)</option>
                </select>
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 text-sm text-gray-600">İptal</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark">
                    {submitting ? "Kayıt..." : "Güncelle"}
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
