"use client";

import Link from "next/link";
import { ArrowLeft, Download, CheckCircle2, Calendar, CreditCard, FileText } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/tr";

interface PaymentInfo {
  id: string;
  customerName: string;
  amount: number;
  paymentMethod: string;
  paymentMethodLabel: string;
  paymentDate: string;
  serviceOrderId: string | null;
  serviceOrderNumber: number | null;
  invoiceNumber: string | null;
}

export default function MakbuzClient({ payment }: { payment: PaymentInfo }) {
  async function handlePdfDownload() {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Ödeme Makbuzu", 20, 25);
    doc.setFontSize(12);
    doc.text(`Müşteri: ${payment.customerName}`, 20, 45);
    doc.text(`Tutar: ₺${payment.amount.toLocaleString("tr-TR")}`, 20, 60);
    doc.text(`Yöntem: ${payment.paymentMethodLabel}`, 20, 75);
    doc.text(`Tarih: ${dayjs(payment.paymentDate).locale("tr").format("DD MMMM YYYY HH:mm")}`, 20, 90);
    if (payment.invoiceNumber) doc.text(`Fatura No: ${payment.invoiceNumber}`, 20, 105);
    if (payment.serviceOrderNumber) doc.text(`İş Emri: #${payment.serviceOrderNumber}`, 20, 120);
    doc.save(`makbuz-${payment.id.slice(0, 8)}.pdf`);
  }

  return (
    <div className="space-y-5 pb-8">
      <Link href="/m/musteri/odemeler" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Ödemelere Dön
      </Link>

      {/* Makbuz Hero */}
      <div className="bg-gradient-to-br from-[#006c49] to-green-700 rounded-2xl p-6 text-white text-center">
        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-white" />
        </div>
        <p className="text-green-200 text-xs font-bold uppercase tracking-widest mb-2">Ödeme Makbuzu</p>
        <p className="text-4xl font-black">₺{payment.amount.toLocaleString("tr-TR")}</p>
        <p className="text-green-200 text-sm mt-1">{payment.customerName}</p>
      </div>

      {/* Detaylar */}
      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        <div className="flex items-center gap-3 p-4">
          <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ödeme Yöntemi</p>
            <p className="text-sm font-bold text-gray-900">{payment.paymentMethodLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4">
          <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tarih</p>
            <p className="text-sm font-bold text-gray-900">
              {dayjs(payment.paymentDate).locale("tr").format("DD MMMM YYYY HH:mm")}
            </p>
          </div>
        </div>
        {payment.invoiceNumber && (
          <div className="flex items-center gap-3 p-4">
            <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fatura No</p>
              <p className="text-sm font-bold text-gray-900">{payment.invoiceNumber}</p>
            </div>
          </div>
        )}
        {payment.serviceOrderId && (
          <Link
            href={`/m/musteri/servis/${payment.serviceOrderId}`}
            className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-[#00236f]" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">İlgili Servis</p>
              <p className="text-sm font-bold text-[#00236f]">İş Emri #{payment.serviceOrderNumber}</p>
            </div>
            <ArrowLeft className="w-4 h-4 text-gray-300 rotate-180" />
          </Link>
        )}
      </div>

      <button
        onClick={handlePdfDownload}
        className="w-full flex items-center justify-center gap-2 py-4 border-2 border-[#006c49] text-[#006c49] rounded-xl text-sm font-bold hover:bg-green-50 transition-colors"
      >
        <Download className="w-4 h-4" />
        Makbuz İndir (PDF)
      </button>
    </div>
  );
}
