"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import {
  Send, XCircle, CheckCircle2, Loader2, AlertCircle, Download,
  FileText, CreditCard, RefreshCw, Zap
} from "lucide-react";
import { updateInvoiceStatus, getInvoicePdfUrl } from "@/lib/actions/invoice.actions";
import { sendEInvoice, sendEArchiveInvoice } from "@/lib/actions/e-invoice.actions";
import { syncInvoiceToParasut } from "@/lib/actions/parasut.actions";
import { formatTurkishCurrency, formatTurkishDate } from "@/lib/invoice-utils";

dayjs.locale("tr");

const STATUS_CONFIG = {
  DRAFT: { label: "Taslak", className: "bg-slate-100 text-slate-600 border border-slate-200" },
  SENT: { label: "Gönderildi", className: "bg-blue-50 text-blue-700 border border-blue-200" },
  PAID: { label: "Ödendi", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  CANCELLED: { label: "İptal", className: "bg-red-50 text-red-600 border border-red-200" },
};

const E_INVOICE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Bekliyor", color: "text-amber-600" },
  SENT: { label: "Gönderildi", color: "text-blue-600" },
  ACCEPTED: { label: "Kabul Edildi", color: "text-emerald-600" },
  REJECTED: { label: "Reddedildi", color: "text-red-600" },
  CANCELLED: { label: "İptal", color: "text-slate-500" },
};

export default function InvoiceDetailClient({ invoice }: { invoice: any }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const statusCfg = STATUS_CONFIG[invoice.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.DRAFT;
  const eInvoiceStatusCfg = invoice.eInvoiceStatus
    ? E_INVOICE_STATUS_CONFIG[invoice.eInvoiceStatus]
    : null;

  const formatMoney = (val: number | string) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(val) || 0);

  const handleAction = async (action: string, fn: () => Promise<any>) => {
    setError(null);
    setSuccessMsg(null);
    setIsLoading(action);
    try {
      const result = await fn();
      if (result.success) {
        setSuccessMsg("İşlem başarıyla tamamlandı.");
        router.refresh();
      } else {
        setError(result.error ?? "İşlem başarısız.");
      }
    } finally {
      setIsLoading(null);
    }
  };

  const handleDownloadPdf = async () => {
    setIsLoading("pdf");
    try {
      const result = await getInvoicePdfUrl(invoice.id);
      if (result.success && result.data?.url) {
        window.open(result.data.url, "_blank");
      } else {
        setError(result.error ?? "PDF hazırlanıyor, lütfen bekleyin.");
      }
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Aksiyon Butonları */}
      <div className="flex flex-wrap items-center gap-3">
        {invoice.status === "DRAFT" && (
          <button
            onClick={() => handleAction("send", () => updateInvoiceStatus(invoice.id, "SENT"))}
            disabled={!!isLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-black transition-colors disabled:opacity-50"
          >
            {isLoading === "send" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Faturayı Gönder
          </button>
        )}
        {invoice.status === "SENT" && (
          <button
            onClick={() => handleAction("pay", () => updateInvoiceStatus(invoice.id, "PAID"))}
            disabled={!!isLoading}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-black transition-colors disabled:opacity-50"
          >
            {isLoading === "pay" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            Ödendi İşaretle
          </button>
        )}
        {(invoice.status === "DRAFT" || invoice.status === "SENT") && (
          <button
            onClick={() => handleAction("cancel", () => updateInvoiceStatus(invoice.id, "CANCELLED"))}
            disabled={!!isLoading}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-black transition-colors disabled:opacity-50"
          >
            {isLoading === "cancel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            İptal Et
          </button>
        )}
        {invoice.status === "SENT" && !invoice.eInvoiceStatus && (
          <>
            <button
              onClick={() => handleAction("einvoice", () => sendEInvoice(invoice.id))}
              disabled={!!isLoading}
              className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-4 py-2.5 rounded-xl text-sm font-black transition-colors disabled:opacity-50"
            >
              {isLoading === "einvoice" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              e-Fatura Gönder
            </button>
            <button
              onClick={() => handleAction("earchive", () => sendEArchiveInvoice(invoice.id))}
              disabled={!!isLoading}
              className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2.5 rounded-xl text-sm font-black transition-colors disabled:opacity-50"
            >
              {isLoading === "earchive" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              e-Arşiv Gönder
            </button>
          </>
        )}
        <button
          onClick={() => handleAction("parasut", () => syncInvoiceToParasut(invoice.id))}
          disabled={!!isLoading}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
        >
          {isLoading === "parasut" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Paraşüt Sync
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={!!isLoading}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ml-auto"
        >
          {isLoading === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          PDF İndir
        </button>
      </div>

      {/* Fatura Başlık Kartı */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-2xl font-black text-slate-900">{invoice.invoiceNumber ?? "TASLAK"}</h2>
              <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-black ${statusCfg.className}`}>
                {statusCfg.label}
              </span>
              {eInvoiceStatusCfg && (
                <span className={`text-xs font-bold ${eInvoiceStatusCfg.color}`}>
                  e-Fatura: {eInvoiceStatusCfg.label}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Düzenleme</span>
                <p className="font-bold text-slate-700">{dayjs(invoice.issueDate).format("DD MMM YYYY")}</p>
              </div>
              {invoice.dueDate && (
                <div>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Vade</span>
                  <p className="font-bold text-slate-700">{dayjs(invoice.dueDate).format("DD MMM YYYY")}</p>
                </div>
              )}
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 min-w-[200px]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Müşteri</p>
            <p className="font-black text-slate-900">
              {invoice.customer?.companyName ||
                [invoice.customer?.firstName, invoice.customer?.lastName].filter(Boolean).join(" ") ||
                "—"}
            </p>
            {invoice.customer?.phone && (
              <p className="text-xs text-slate-500 mt-1">{invoice.customer.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Kalemler */}
      {invoice.items?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-black text-slate-900">Fatura Kalemleri ({invoice.items.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left">Açıklama</th>
                  <th className="px-6 py-3 text-center">Miktar</th>
                  <th className="px-6 py-3 text-center">Birim Fiyat</th>
                  <th className="px-6 py-3 text-center">KDV</th>
                  <th className="px-6 py-3 text-right">Satır Toplamı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{item.name}</div>
                      <div className="text-xs text-slate-400">
                        {item.type === "LABOR" ? "İşçilik" : item.type === "PART" ? "Parça" : "Hizmet"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-700">{Number(item.quantity)}</td>
                    <td className="px-6 py-4 text-center text-slate-600">{formatMoney(item.unitPrice)}</td>
                    <td className="px-6 py-4 text-center text-slate-600">%{Number(item.taxRate)}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">{formatMoney(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
            <div className="flex flex-col items-end gap-1 text-sm">
              <div className="flex gap-8">
                <span className="text-slate-500">Ara Toplam</span>
                <span className="font-bold text-slate-700 w-28 text-right">{formatMoney(invoice.subTotal)}</span>
              </div>
              <div className="flex gap-8">
                <span className="text-slate-500">KDV</span>
                <span className="font-bold text-slate-700 w-28 text-right">{formatMoney(invoice.taxAmount)}</span>
              </div>
              <div className="flex gap-8 text-base border-t border-slate-200 pt-2 mt-1">
                <span className="font-black text-slate-900">Genel Toplam</span>
                <span className="font-black text-amber-600 w-28 text-right">{formatMoney(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ödeme Geçmişi */}
      {invoice.payments?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-black text-slate-900">Ödeme Geçmişi ({invoice.payments.length})</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {invoice.payments.map((payment: any) => (
              <div key={payment.id} className="px-6 py-3 flex items-center gap-4">
                <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0">
                  ₺
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{formatMoney(payment.amount)}</p>
                  <p className="text-xs text-slate-400">
                    {payment.paymentMethod} · {dayjs(payment.paymentDate).format("DD MMM YYYY")}
                  </p>
                </div>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">TAHSİLAT</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paraşüt Sync Logları */}
      {invoice.parasutSyncLogs?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-black text-slate-900">Paraşüt Senkronizasyon Geçmişi</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {invoice.parasutSyncLogs.map((log: any) => (
              <div key={log.id} className="px-6 py-3 flex items-center gap-4">
                <span className={`w-2 h-2 rounded-full shrink-0 ${log.status === "SUCCESS" ? "bg-emerald-500" : "bg-red-500"}`} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{log.operation}</p>
                  {log.errorMessage && <p className="text-xs text-red-500">{log.errorMessage}</p>}
                </div>
                <span className="text-xs text-slate-400">{dayjs(log.attemptedAt).format("DD MMM HH:mm")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
