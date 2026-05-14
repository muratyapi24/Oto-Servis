"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createInvoiceSchema, CreateInvoiceInput } from "@/lib/validations/finance";
import Modal from "@/components/ui/Modal";
import { createInvoice } from "@/lib/actions/finance.actions";

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: any[];
}

export default function InvoiceFormModal({ isOpen, onClose, customers }: InvoiceFormModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      type: "SALES",
      status: "SENT",
      subTotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 0,
      issueDate: new Date().toLocaleDateString('sv-SE')
    }
  });

  const onSubmit = async (data: CreateInvoiceInput) => {
    setIsPending(true);
    setErrorMessage("");
    try {
      const res = await createInvoice(data);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        alert(res.success || "Fatura başarıyla oluşturuldu.");
        onClose();
        reset();
      }
    } catch (err) {
      setErrorMessage("Beklenmeyen hata.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Yeni Borçlandırma / Fatura Fişi"
      maxWidth="max-w-[550px]"
    >
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-600 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-gray-300">Cari Hesap (Müşteri)</label>
              <select 
                className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("customerId")}
              >
                <option value="">Seçiniz...</option>
                {customers?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.type === "CORPORATE" ? c.companyName : `${c.firstName} ${c.lastName}`}
                  </option>
                ))}
              </select>
              {errors.customerId && <p className="text-xs text-red-500">{errors.customerId.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-gray-300">Türü</label>
              <select 
                className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("type")}
              >
                <option value="SALES">Satış (Alacaklandırma)</option>
                <option value="PURCHASE">Alış (Giderleştirme)</option>
              </select>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-gray-300">Fatura Tarihi</label>
            <input 
              type="date" 
              className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("issueDate")} 
            />
            {errors.issueDate && <p className="text-xs text-red-500">{errors.issueDate.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-gray-300">Vade Tarihi</label>
            <input 
              type="date" 
              className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("dueDate")} 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-gray-300">Vergisiz Tutar (SubTotal)</label>
              <input 
                type="number" 
                step="0.01" 
                className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("subTotal", { valueAsNumber: true })} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-gray-300">KDV Tutarı</label>
              <input 
                type="number" 
                step="0.01" 
                className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("taxAmount", { valueAsNumber: true })} 
              />
            </div>
        </div>

        <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-gray-300">Genel Toplam Tutar (₺)</label>
            <input 
              type="number" 
              step="0.01" 
              className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-lg text-sm font-black text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("totalAmount", { valueAsNumber: true })} 
            />
            {errors.totalAmount && <p className="text-xs text-red-500">{errors.totalAmount.message}</p>}
        </div>

        <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-gray-300">Açıklama / Notlar</label>
            <textarea 
              rows={2} 
              className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("notes")} 
              placeholder="Hizmet detayı vb." 
            />
        </div>

        <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isPending}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 dark:bg-gray-800/50 transition-colors"
            >
              İptal
            </button>
            <button 
              type="submit" 
              disabled={isPending} 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
            >
              {isPending ? "Kaydediliyor..." : "Oluştur"}
            </button>
        </div>

      </form>
    </Modal>
  );
}
