"use client";

import Link from "next/link";
import { ArrowLeft, Download, CheckCircle2, Clock, XCircle, FileText } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/tr";

interface InvoiceItem {
  id: string;
  name: string;
  itemType: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  totalPrice: number;
}

interface InvoiceDetail {
  id: string;
  invoiceNumber: string | null;
  status: string;
  issueDate: string;
  dueDate: string | null;
  customerName: string;
  customerPhone: string | null;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  serviceOrderId: string | null;
  serviceOrderNumber: number | null;
  items: InvoiceItem[];
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Taslak", cls: "bg-gray-100 text-gray-600", icon: <Clock className="w-3.5 h-3.5" /> },
  SENT: { label: "Gönderildi", cls: "bg-blue-100 text-blue-700", icon: <FileText className="w-3.5 h-3.5" /> },
  PAID: { label: "Ödendi", cls: "bg-green-100 text-green-700", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  CANCELLED: { label: "İptal", cls: "bg-red-100 text-red-700", icon: <XCircle className="w-3.5 h-3.5" /> },
};

function fmt(val: number) {
  return `₺${val.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`;
}

export default function FaturaDetayClient({ invoice }: { invoice: InvoiceDetail }) {
  const statusObj = STATUS_CONFIG[invoice.status] || { label: "Taslak", cls: "bg-gray-100 text-gray-600", icon: <Clock className="w-3.5 h-3.5" /> };

  async function handlePdfDownload() {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Fatura", 20, 20);
    doc.setFontSize(12);
    if (invoice.invoiceNumber) doc.text(`Fatura No: ${invoice.invoiceNumber}`, 20, 35);
    doc.text(`Müşteri: ${invoice.customerName}`, 20, 50);
    doc.text(`Tarih: ${dayjs(invoice.issueDate).locale("tr").format("DD MMMM YYYY")}`, 20, 65);
    doc.text(`Ara Toplam: ${fmt(invoice.subTotal)}`, 20, 80);
    doc.text(`KDV: ${fmt(invoice.taxAmount)}`, 20, 95);
    doc.text(`Toplam: ${fmt(invoice.totalAmount)}`, 20, 110);
    doc.text(`Ödenen: ${fmt(invoice.paidAmount)}`, 20, 125);
    doc.save(`fatura-${invoice.invoiceNumber ?? invoice.id.slice(0, 8)}.pdf`);
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Geri */}
      <Link href="/m/firma/finans" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Finansa Dön
      </Link>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#00236f] to-[#1e3a8a] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Fatura</p>
            <p className="text-xl font-black">{invoice.invoiceNumber ?? `#${invoice.id.slice(0, 8)}`}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${statusObj.cls}`}>
            {statusObj.icon} {statusObj.label}
          </span>
        </div>
        <p className="text-blue-200 text-sm">{invoice.customerName}</p>
        <p className="text-blue-300 text-xs mt-0.5">
          {dayjs(invoice.issueDate).locale("tr").format("DD MMMM YYYY")}
        </p>
      </div>

      {/* Servis Emri Linki */}
      {invoice.serviceOrderId && (
        <Link
          href={`/m/firma/servis-detay/${invoice.serviceOrderId}`}
          className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-[#00236f]/30 transition-colors"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[#00236f]" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">İlgili Servis Emri</p>
            <p className="text-sm font-bold text-[#00236f]">#{invoice.serviceOrderNumber}</p>
          </div>
          <ArrowLeft className="w-4 h-4 text-gray-300 rotate-180" />
        </Link>
      )}

      {/* Kalem Listesi */}
      {invoice.items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Kalemler</p>
          </div>
          <div className="divide-y divide-gray-100">
            {invoice.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">
                    {item.itemType === "PART" ? "Parça" : "İşçilik"} · {item.quantity}x ·
                    {fmt(item.unitPrice)} · %{item.taxRate} KDV
                    {item.discount > 0 && ` · -${fmt(item.discount)}`}
                  </p>
                </div>
                <p className="text-sm font-bold text-gray-900 font-mono ml-3 shrink-0">
                  {fmt(item.totalPrice)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toplamlar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Ara Toplam</span>
          <span className="font-mono">{fmt(invoice.subTotal)}</span>
        </div>
        {invoice.discountAmount > 0 && (
          <div className="flex justify-between text-sm text-red-600">
            <span>İndirim</span>
            <span className="font-mono">-{fmt(invoice.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-gray-600">
          <span>KDV</span>
          <span className="font-mono">{fmt(invoice.taxAmount)}</span>
        </div>
        <div className="flex justify-between text-base font-black text-gray-900 border-t pt-2 mt-2">
          <span>Genel Toplam</span>
          <span className="font-mono">{fmt(invoice.totalAmount)}</span>
        </div>
        {invoice.paidAmount > 0 && (
          <div className="flex justify-between text-sm text-green-700">
            <span>Ödenen</span>
            <span className="font-mono">{fmt(invoice.paidAmount)}</span>
          </div>
        )}
        {invoice.totalAmount - invoice.paidAmount > 0 && (
          <div className="flex justify-between text-sm font-bold text-red-600">
            <span>Kalan</span>
            <span className="font-mono">{fmt(invoice.totalAmount - invoice.paidAmount)}</span>
          </div>
        )}
      </div>

      {/* PDF */}
      <button
        onClick={handlePdfDownload}
        className="w-full flex items-center justify-center gap-2 py-4 border-2 border-[#00236f] text-[#00236f] rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors"
      >
        <Download className="w-4 h-4" />
        Fatura PDF İndir
      </button>
    </div>
  );
}
