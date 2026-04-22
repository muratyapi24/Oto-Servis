"use client";

import { useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import {
  Receipt, CreditCard, FileText, Printer, CheckCircle2,
  Clock, XCircle, AlertCircle, ArrowLeft, Building2, User, Wrench, Download
} from "lucide-react";
import { addPaymentToInvoice } from "@/lib/actions/finance.actions";
import { initOnlinePayment } from "@/lib/actions/payment.actions";
import { exportElementToPdf } from "@/lib/pdf-utils";
import InvoicePdfTemplate from "@/components/dashboard/finances/InvoicePdfTemplate";

const STATUS_MAP: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  DRAFT:     { label: "Taslak",    className: "bg-gray-100 text-gray-700",    icon: <Clock className="w-3.5 h-3.5" /> },
  SENT:      { label: "Gönderildi", className: "bg-blue-100 text-blue-800",   icon: <Receipt className="w-3.5 h-3.5" /> },
  PAID:      { label: "Ödendi",    className: "bg-green-100 text-green-800",  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  CANCELLED: { label: "İptal",     className: "bg-red-100 text-red-800",      icon: <XCircle className="w-3.5 h-3.5" /> },
};

const METHOD_MAP: Record<string, string> = {
  CASH: "Nakit", CREDIT_CARD: "Kredi Kartı", BANK_TRANSFER: "Banka Transferi",
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, className: "bg-gray-100 text-gray-700", icon: null };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${s.className}`}>
      {s.icon}{s.label}
    </span>
  );
}

export default function InvoiceDetailClient({ invoice }: { invoice: any }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"CASH" | "CREDIT_CARD" | "BANK_TRANSFER">("CASH");
  const [payDate, setPayDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [notes, setNotes] = useState("");
  const [onlinePayLoading, setOnlinePayLoading] = useState(false);
  const [onlinePayModal, setOnlinePayModal] = useState<{ content: string } | null>(null);

  const remaining = invoice.totalAmount - invoice.paidAmount;
  const isReadOnly = invoice.status === "PAID" || invoice.status === "CANCELLED";

  const customerName = invoice.customer
    ? invoice.customer.type === "CORPORATE"
      ? invoice.customer.companyName
      : `${invoice.customer.firstName ?? ""} ${invoice.customer.lastName ?? ""}`.trim()
    : invoice.supplier?.name ?? "—";

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null);
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError("Geçerli bir tutar girin"); return; }
    if (amt > remaining) { setError("Tutar kalan bakiyeyi aşamaz"); return; }
    setSubmitting(true);
    const res = await addPaymentToInvoice({ invoiceId: invoice.id, amount: amt, paymentMethod: method, paymentDate: payDate, notes: notes || undefined });
    setSubmitting(false);
    if (res.error) { setError(res.error); } else { setSuccess(res.success ?? "Ödeme kaydedildi"); setAmount(""); setNotes(""); }
  }

  async function handleDownloadPdf() {
    await exportElementToPdf(`invoice-pdf-${invoice.id}`, {
      filename: `Fatura_${invoice.invoiceNumber ?? invoice.id.slice(0,8)}.pdf`,
      orientation: 'p',
    });
  }

  async function handleOnlinePayment() {
    setOnlinePayLoading(true);
    setError(null);
    const res = await initOnlinePayment(invoice.id);
    setOnlinePayLoading(false);
    if (!res.success || !res.data) {
      setError(res.error ?? "Online ödeme başlatılamadı.");
      return;
    }
    if (res.data.checkoutFormContent) {
      setOnlinePayModal({ content: res.data.checkoutFormContent });
    } else if ((res.data as any).iframeUrl) {
      window.open((res.data as any).iframeUrl, "_blank");
    }
  }

  return (
    <div className="space-y-6 print:space-y-4 relative">
      <InvoicePdfTemplate invoice={invoice} />

      {/* iyzico / Online ödeme modal */}
      {onlinePayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" /> Online Ödeme
              </h3>
              <button onClick={() => setOnlinePayModal(null)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div
              className="p-4"
              dangerouslySetInnerHTML={{ __html: onlinePayModal.content }}
            />
          </div>
        </div>
      )}
      
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/finances" className="text-sm font-bold text-gray-400 hover:text-gray-900 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Geri
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fatura {invoice.invoiceNumber ?? `#${invoice.id.slice(0,8)}`}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{dayjs(invoice.issueDate).locale("tr").format("DD MMMM YYYY")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={invoice.status} />
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
            <Printer className="w-4 h-4" /> Yazdır
          </button>
          <button onClick={handleDownloadPdf} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors">
            <Download className="w-4 h-4" /> PDF İndir
          </button>
          {!isReadOnly && remaining > 0 && (
            <button
              onClick={handleOnlinePayment}
              disabled={onlinePayLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-70 shadow-sm"
            >
              <CreditCard className="w-4 h-4" />
              {onlinePayLoading ? "Yönlendiriliyor..." : "Online Öde"}
            </button>
          )}
        </div>
      </div>

      {/* Print başlığı */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">Fatura {invoice.invoiceNumber ?? ""}</h1>
        <p className="text-sm text-gray-500">{dayjs(invoice.issueDate).format("DD.MM.YYYY")}</p>
      </div>

      {/* Üst Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Müşteri/Tedarikçi */}
        <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
            {invoice.customer?.type === "CORPORATE" ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
            {invoice.type === "PURCHASE" ? "Tedarikçi" : "Müşteri"}
          </h3>
          <p className="text-lg font-bold text-gray-900">{customerName}</p>
          {invoice.customer?.phone && <p className="text-sm text-gray-500">{invoice.customer.phone}</p>}
          {invoice.customer?.email && <p className="text-sm text-gray-500">{invoice.customer.email}</p>}
          {invoice.serviceOrder && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><Wrench className="w-3.5 h-3.5" /> İlgili Servis Emri</p>
              <Link href={`/dashboard/services/${invoice.serviceOrder.id}`} className="text-sm font-bold text-blue-700 hover:underline">
                İş Emri #{invoice.serviceOrder.orderNumber}
              </Link>
            </div>
          )}
          {invoice.dueDate && (
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-2">
              <Clock className="w-4 h-4" /> Vade: {dayjs(invoice.dueDate).locale("tr").format("DD MMMM YYYY")}
            </p>
          )}
        </div>

        {/* Finansal Özet */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Finansal Özet
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Ara Toplam</span><span className="font-mono">₺{invoice.subTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span></div>
            {invoice.discountAmount > 0 && <div className="flex justify-between text-red-600"><span>İndirim</span><span className="font-mono">-₺{invoice.discountAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">KDV</span><span className="font-mono">₺{invoice.taxAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span>Genel Toplam</span><span className="font-mono">₺{invoice.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between text-green-600"><span>Ödenen</span><span className="font-mono">₺{invoice.paidAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span></div>
            <div className={`flex justify-between font-bold text-lg border-t pt-2 mt-2 ${remaining > 0 ? "text-red-600" : "text-green-600"}`}>
              <span>Kalan</span><span className="font-mono">₺{remaining.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ödeme Geçmişi */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50">
          <CreditCard className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Ödeme Geçmişi</h3>
          <span className="ml-auto text-xs font-bold text-gray-400">{invoice.payments.length} kayıt</span>
        </div>
        {invoice.payments.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm"><CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-200" />Ödeme kaydı bulunmuyor.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {invoice.payments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0"><CreditCard className="w-4 h-4 text-green-700" /></div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{METHOD_MAP[p.paymentMethod] ?? p.paymentMethod}</p>
                    {p.notes && <p className="text-xs text-gray-400">{p.notes}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-green-700">₺{p.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-gray-400">{dayjs(p.paymentDate).locale("tr").format("DD MMM YYYY")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ödeme Formu */}
      {!isReadOnly && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 print:hidden">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest border-b pb-3 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Ödeme Kaydet
          </h3>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm border border-red-100"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 text-sm border border-green-100"><CheckCircle2 className="w-4 h-4 shrink-0" />{success}</div>}
          <form onSubmit={handlePayment} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Tutar (₺) *</label>
              <input type="number" step="0.01" min="0.01" max={remaining} value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Max: ₺${remaining.toFixed(2)}`} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Ödeme Yöntemi *</label>
              <select value={method} onChange={e => setMethod(e.target.value as any)} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500">
                <option value="CASH">Nakit</option>
                <option value="CREDIT_CARD">Kredi Kartı</option>
                <option value="BANK_TRANSFER">Banka Transferi</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Tarih *</label>
              <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Not</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opsiyonel" className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-70 shadow-sm">
                {submitting ? "Kaydediliyor..." : "Ödemeyi Kaydet"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Print CSS */}
      <style jsx global>{`
        @media print {
          nav, header, aside, .print\\:hidden { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}
