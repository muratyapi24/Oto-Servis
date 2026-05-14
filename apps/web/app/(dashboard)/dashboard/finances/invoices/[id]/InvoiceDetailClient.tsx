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
import {
  DASHBOARD_ACTIONS,
  DASHBOARD_DETAIL,
  DASHBOARD_FORMS,
  DASHBOARD_MODAL,
  dashboardStatusBadgeClass,
  type DashboardStatusTone,
} from "@/lib/dashboard-ui-standards";

const STATUS_MAP: Record<string, { label: string; tone: DashboardStatusTone; icon: React.ReactNode }> = {
  DRAFT:     { label: "Taslak",    tone: "neutral", icon: <Clock className="w-3.5 h-3.5" /> },
  SENT:      { label: "Gönderildi", tone: "info",    icon: <Receipt className="w-3.5 h-3.5" /> },
  PAID:      { label: "Ödendi",     tone: "success", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  CANCELLED: { label: "İptal",      tone: "danger",  icon: <XCircle className="w-3.5 h-3.5" /> },
};

const METHOD_MAP: Record<string, string> = {
  CASH: "Nakit", CREDIT_CARD: "Kredi Kartı", BANK_TRANSFER: "Banka Transferi",
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, tone: "neutral" as const, icon: null };
  return (
    <span className={dashboardStatusBadgeClass(s.tone)}>
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
        <div className={DASHBOARD_MODAL.backdrop}>
          <div className={DASHBOARD_MODAL.dialog}>
            <div className={DASHBOARD_MODAL.header}>
              <h3 className={DASHBOARD_MODAL.title}>
                <CreditCard className={DASHBOARD_MODAL.titleIcon} /> Online Ödeme
              </h3>
              <button onClick={() => setOnlinePayModal(null)} className={DASHBOARD_MODAL.closeButton}>
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div
              className={DASHBOARD_MODAL.content}
              dangerouslySetInnerHTML={{ __html: onlinePayModal.content }}
            />
          </div>
        </div>
      )}
      
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/finances" className={DASHBOARD_ACTIONS.backLink}>
            <ArrowLeft className="w-3.5 h-3.5" /> Geri
          </Link>
          <div>
            <h1 className={DASHBOARD_ACTIONS.pageTitle}>Fatura {invoice.invoiceNumber ?? `#${invoice.id.slice(0,8)}`}</h1>
            <p className={DASHBOARD_ACTIONS.pageSubtitle}>{dayjs(invoice.issueDate).locale("tr").format("DD MMMM YYYY")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={invoice.status} />
          <button onClick={() => window.print()} className={DASHBOARD_ACTIONS.secondaryButton}>
            <Printer className={DASHBOARD_ACTIONS.icon} /> Yazdır
          </button>
          <button onClick={handleDownloadPdf} className={DASHBOARD_ACTIONS.inverseButton}>
            <Download className={DASHBOARD_ACTIONS.icon} /> PDF İndir
          </button>
          {!isReadOnly && remaining > 0 && (
            <button
              onClick={handleOnlinePayment}
              disabled={onlinePayLoading}
              className={DASHBOARD_ACTIONS.primaryButton}
            >
              <CreditCard className={DASHBOARD_ACTIONS.icon} />
              {onlinePayLoading ? "Yönlendiriliyor..." : "Online Öde"}
            </button>
          )}
        </div>
      </div>

      {/* Print başlığı */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">Fatura {invoice.invoiceNumber ?? ""}</h1>
        <p className="text-sm text-on-surface-variant">{dayjs(invoice.issueDate).format("DD.MM.YYYY")}</p>
      </div>

      {/* Üst Grid */}
      <div className={DASHBOARD_DETAIL.financeInfoGrid}>
        {/* Müşteri/Tedarikçi */}
        <div className={DASHBOARD_DETAIL.infoCardWide}>
          <h3 className={DASHBOARD_DETAIL.sectionTitleRow}>
            {invoice.customer?.type === "CORPORATE" ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
            {invoice.type === "PURCHASE" ? "Tedarikçi" : "Müşteri"}
          </h3>
          <p className={`${DASHBOARD_DETAIL.infoValueLarge} font-bold`}>{customerName}</p>
          {invoice.customer?.phone && <p className={DASHBOARD_DETAIL.infoMeta}>{invoice.customer.phone}</p>}
          {invoice.customer?.email && <p className={DASHBOARD_DETAIL.infoMeta}>{invoice.customer.email}</p>}
          {invoice.serviceOrder && (
            <div className={DASHBOARD_DETAIL.relatedBlock}>
              <p className={DASHBOARD_DETAIL.relatedLabel}><Wrench className="w-3.5 h-3.5" /> İlgili Servis Emri</p>
              <Link href={`/dashboard/services/${invoice.serviceOrder.id}`} className={DASHBOARD_DETAIL.relatedLink}>
                İş Emri #{invoice.serviceOrder.orderNumber}
              </Link>
            </div>
          )}
          {invoice.dueDate && (
            <p className={`${DASHBOARD_DETAIL.infoMeta} flex items-center gap-1.5 mt-2`}>
              <Clock className="w-4 h-4" /> Vade: {dayjs(invoice.dueDate).locale("tr").format("DD MMMM YYYY")}
            </p>
          )}
        </div>

        {/* Finansal Özet */}
        <div className={DASHBOARD_DETAIL.infoCard}>
          <h3 className={`${DASHBOARD_DETAIL.sectionTitleRow} mb-4`}>
            <CreditCard className="w-4 h-4" /> Finansal Özet
          </h3>
          <div className={DASHBOARD_DETAIL.financeSummaryBody}>
            <div className={DASHBOARD_DETAIL.financeSummaryRow}><span>Ara Toplam</span><span className="font-mono">₺{invoice.subTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span></div>
            {invoice.discountAmount > 0 && <div className={DASHBOARD_DETAIL.financeSummaryDiscountRow}><span>İndirim</span><span className="font-mono">-₺{invoice.discountAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span></div>}
            <div className={DASHBOARD_DETAIL.financeSummaryRow}><span>KDV</span><span className="font-mono">₺{invoice.taxAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span></div>
            <div className={DASHBOARD_DETAIL.financeSummaryTotalRow}><span>Genel Toplam</span><span className="font-mono">₺{invoice.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span></div>
            <div className={DASHBOARD_DETAIL.financeSummaryPaidRow}><span>Ödenen</span><span className="font-mono">₺{invoice.paidAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span></div>
            <div className={remaining > 0 ? DASHBOARD_DETAIL.financeSummaryBalanceDueRow : DASHBOARD_DETAIL.financeSummaryBalancePaidRow}>
              <span>Kalan</span><span className="font-mono">₺{remaining.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ödeme Geçmişi */}
      <div className={DASHBOARD_DETAIL.tableShell}>
        <div className={DASHBOARD_DETAIL.tableToolbarRow}>
          <CreditCard className={DASHBOARD_DETAIL.tableTitleIcon} />
          <h3 className={DASHBOARD_DETAIL.tableTitle}>Ödeme Geçmişi</h3>
          <span className={DASHBOARD_DETAIL.tableCount}>{invoice.payments.length} kayıt</span>
        </div>
        {invoice.payments.length === 0 ? (
          <div className={`${DASHBOARD_DETAIL.tableEmpty} text-sm`}><CreditCard className={DASHBOARD_DETAIL.tableEmptyIcon} />Ödeme kaydı bulunmuyor.</div>
        ) : (
          <div className={DASHBOARD_DETAIL.paymentList}>
            {invoice.payments.map((p: any) => (
              <div key={p.id} className={DASHBOARD_DETAIL.paymentRow}>
                <div className="flex items-center gap-3">
                  <div className={DASHBOARD_DETAIL.paymentIcon}><CreditCard className={DASHBOARD_DETAIL.paymentIconGlyph} /></div>
                  <div>
                    <p className={`${DASHBOARD_DETAIL.infoMeta} font-bold text-on-surface`}>{METHOD_MAP[p.paymentMethod] ?? p.paymentMethod}</p>
                    {p.notes && <p className={DASHBOARD_DETAIL.tableCellMeta}>{p.notes}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-tertiary">₺{p.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</p>
                  <p className={DASHBOARD_DETAIL.tableCellMeta}>{dayjs(p.paymentDate).locale("tr").format("DD MMM YYYY")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ödeme Formu */}
      {!isReadOnly && (
        <div className={`${DASHBOARD_DETAIL.infoCard} print:hidden`}>
          <h3 className={`${DASHBOARD_DETAIL.tableTitle} border-b border-outline-variant/20 pb-3 mb-4 flex items-center gap-2`}>
            <FileText className="w-4 h-4" /> Ödeme Kaydet
          </h3>
          {error && <div className={DASHBOARD_FORMS.alertError}><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          {success && <div className={DASHBOARD_FORMS.alertSuccess}><CheckCircle2 className="w-4 h-4 shrink-0" />{success}</div>}
          <form onSubmit={handlePayment} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={DASHBOARD_FORMS.label}>Tutar (₺) *</label>
              <input type="number" step="0.01" min="0.01" max={remaining} value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Max: ₺${remaining.toFixed(2)}`} className={DASHBOARD_FORMS.control} required />
            </div>
            <div>
              <label className={DASHBOARD_FORMS.label}>Ödeme Yöntemi *</label>
              <select value={method} onChange={e => setMethod(e.target.value as any)} className={DASHBOARD_FORMS.select}>
                <option value="CASH">Nakit</option>
                <option value="CREDIT_CARD">Kredi Kartı</option>
                <option value="BANK_TRANSFER">Banka Transferi</option>
              </select>
            </div>
            <div>
              <label className={DASHBOARD_FORMS.label}>Tarih *</label>
              <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className={DASHBOARD_FORMS.control} required />
            </div>
            <div>
              <label className={DASHBOARD_FORMS.label}>Not</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opsiyonel" className={DASHBOARD_FORMS.control} />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button type="submit" disabled={submitting} className={DASHBOARD_FORMS.primaryButton}>
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
