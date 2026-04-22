"use client";

import Link from "next/link";
import { ArrowLeft, Download, User, Banknote, CreditCard, Building2, Calendar, FileText } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/tr";

interface PaymentDetail {
  id: string;
  customerName: string;
  customerPhone: string | null;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  notes: string | null;
  serviceOrderId: string | null;
  serviceOrderNumber: number | null;
}

const METHOD_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  CASH: { label: "Nakit", icon: <Banknote className="w-5 h-5 text-green-600" /> },
  CREDIT_CARD: { label: "Kredi/Banka Kartı", icon: <CreditCard className="w-5 h-5 text-blue-600" /> },
  BANK_TRANSFER: { label: "Havale / EFT", icon: <Building2 className="w-5 h-5 text-purple-600" /> },
};

export default function TahsilatDetayClient({ payment }: { payment: PaymentDetail }) {
  const method = METHOD_CONFIG[payment.paymentMethod] ?? {
    label: payment.paymentMethod,
    icon: <Banknote className="w-5 h-5 text-gray-400" />,
  };

  async function handlePdfDownload() {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Ödeme Makbuzu", 20, 20);
    doc.setFontSize(12);
    doc.text(`Müşteri: ${payment.customerName}`, 20, 40);
    doc.text(`Tutar: ₺${payment.amount.toLocaleString("tr-TR")}`, 20, 55);
    doc.text(`Yöntem: ${method.label}`, 20, 70);
    doc.text(`Tarih: ${dayjs(payment.paymentDate).locale("tr").format("DD MMMM YYYY HH:mm")}`, 20, 85);
    if (payment.serviceOrderNumber) {
      doc.text(`İş Emri: #${payment.serviceOrderNumber}`, 20, 100);
    }
    if (payment.notes) {
      doc.text(`Not: ${payment.notes}`, 20, 115);
    }
    doc.save(`makbuz-${payment.id.slice(0, 8)}.pdf`);
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Geri */}
      <Link href="/m/firma/tahsilatlar" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Tahsilatlara Dön
      </Link>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#006c49] to-green-700 rounded-2xl p-6 text-white">
        <p className="text-green-200 text-xs font-bold uppercase tracking-widest mb-2">Tahsilat</p>
        <p className="text-4xl font-black">₺{payment.amount.toLocaleString("tr-TR")}</p>
        <p className="text-green-200 text-sm mt-1">
          {dayjs(payment.paymentDate).locale("tr").format("DD MMMM YYYY HH:mm")}
        </p>
      </div>

      {/* Detay Kartları */}
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Müşteri</p>
            <p className="text-sm font-bold text-gray-900">{payment.customerName}</p>
            {payment.customerPhone && (
              <p className="text-xs text-gray-500">{payment.customerPhone}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
            {method.icon}
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ödeme Yöntemi</p>
            <p className="text-sm font-bold text-gray-900">{method.label}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tarih</p>
            <p className="text-sm font-bold text-gray-900">
              {dayjs(payment.paymentDate).locale("tr").format("DD MMMM YYYY HH:mm")}
            </p>
          </div>
        </div>

        {payment.serviceOrderId && (
          <Link
            href={`/m/firma/servis-detay/${payment.serviceOrderId}`}
            className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-[#00236f]/30 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[#00236f]" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">İlgili Servis Emri</p>
              <p className="text-sm font-bold text-[#00236f]">#{payment.serviceOrderNumber}</p>
            </div>
            <ArrowLeft className="w-4 h-4 text-gray-300 rotate-180" />
          </Link>
        )}

        {payment.notes && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Not</p>
            <p className="text-sm text-gray-700">{payment.notes}</p>
          </div>
        )}
      </div>

      {/* PDF Makbuz */}
      <button
        onClick={handlePdfDownload}
        className="w-full flex items-center justify-center gap-2 py-4 border-2 border-[#00236f] text-[#00236f] rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors"
      >
        <Download className="w-4 h-4" />
        Makbuz İndir (PDF)
      </button>
    </div>
  );
}
