"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recordPaymentSchema, RecordPaymentInput } from "@/lib/validations/finance";
import Modal from "@/components/ui/Modal";
import { recordPayment } from "@/lib/actions/finance.actions";

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: any | null;
  customers: any[];
}

export default function PaymentFormModal({ isOpen, onClose, invoice, customers }: PaymentFormModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<RecordPaymentInput>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: "CASH",
      paymentType: "INCOMING",
      paymentDate: new Date().toISOString().split("T")[0]
    }
  });

  useEffect(() => {
    if (invoice && isOpen) {
      if(invoice.id) setValue("invoiceId", invoice.id);
      if(invoice.customer?.id || invoice.customerId) setValue("customerId", invoice.customer?.id || invoice.customerId);
      setValue("paymentType", invoice.type === "OUTGOING" ? "OUTGOING" : "INCOMING");
      if(invoice.totalAmount) setValue("amount", Number(invoice.totalAmount) - Number(invoice.paidAmount));
      
      const todayLocal = new Date().toLocaleDateString('sv-SE');
      setValue("paymentDate", todayLocal);
    } else if (isOpen) {
      reset();
      const todayLocal = new Date().toLocaleDateString('sv-SE');
      setValue("paymentDate", todayLocal);
    }
  }, [invoice, isOpen, setValue, reset]);

  const onSubmit = async (data: RecordPaymentInput) => {
    setIsPending(true);
    setErrorMessage("");
    try {
      const res = await recordPayment({
        ...data,
        paymentDate: new Date(data.paymentDate)
      });
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        alert(res.success || "İşlem başarılı.");
        onClose();
        reset();
      }
    } catch (err) {
      setErrorMessage("Beklenmeyen bir hata oluştu.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={invoice?.invoiceNumber ? `${invoice.invoiceNumber} Tahsilat/Ödeme İşlemi` : "Yeni Kasa Hareketi"}
      maxWidth="max-w-[500px]"
    >
      <div className="mb-4 text-sm text-slate-500">
        {invoice?.invoiceNumber 
          ? `Kalan Bakiye: ₺${(Number(invoice.totalAmount) - Number(invoice.paidAmount)).toFixed(2)}` 
          : "Avans, gelir veya gider tanımlaması yapabilirsiniz."}
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-700">Cari Türü (Müşteri/Tedarikçi)</label>
          <select 
            disabled={!!invoice?.id} 
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register("customerId")}
          >
            <option value="">Seçiniz (Opsiyonel)</option>
            {customers?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.type === "CORPORATE" ? c.companyName : `${c.firstName} ${c.lastName}`}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">İşlem Yönü</label>
              <select 
                disabled={!!invoice?.id} 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("paymentType")}
              >
                <option value="INCOMING">Tahsilat (Giriş)</option>
                <option value="OUTGOING">Ödeme (Çıkış)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Ödeme Yöntemi</label>
              <select 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("paymentMethod")}
              >
                <option value="CASH">Nakit</option>
                <option value="CREDIT_CARD">Kredi Kartı</option>
                <option value="BANK_TRANSFER">Havale/EFT</option>
              </select>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Tutar (₺)</label>
              <input 
                type="number" 
                step="0.01" 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("amount", { valueAsNumber: true })} 
              />
              {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Ödeme Tarihi</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("paymentDate")} 
              />
              {errors.paymentDate && <p className="text-xs text-red-500">{errors.paymentDate.message}</p>}
            </div>
        </div>

        <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Açıklama</label>
            <textarea 
              rows={3} 
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("notes")} 
              placeholder="Dekont bilgisi, avans vb." 
            />
        </div>

        <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isPending}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              İptal
            </button>
            <button 
              type="submit" 
              disabled={isPending} 
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
            >
              {isPending ? "İşleniyor..." : "Kaydet"}
            </button>
        </div>
      </form>
    </Modal>
  );
}
