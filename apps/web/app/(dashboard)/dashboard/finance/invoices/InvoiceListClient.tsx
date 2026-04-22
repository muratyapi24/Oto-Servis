"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import {
  FileText,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Loader2,
} from "lucide-react";

dayjs.locale("tr");

interface Invoice {
  id: string;
  invoiceNumber: string | null;
  status: "DRAFT" | "SENT" | "PAID" | "CANCELLED";
  issueDate: string;
  dueDate?: string | null;
  totalAmount: number | string;
  paidAmount: number | string;
  customer?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    companyName?: string | null;
  } | null;
  pdfUrl?: string | null;
}

interface InvoiceListClientProps {
  invoices: Invoice[];
  total: number;
}

const STATUS_CONFIG = {
  DRAFT: { label: "Taslak", className: "bg-slate-100 text-slate-600 border border-slate-200" },
  SENT: { label: "Gönderildi", className: "bg-blue-50 text-blue-700 border border-blue-200" },
  PAID: { label: "Ödendi", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  CANCELLED: { label: "İptal", className: "bg-red-50 text-red-600 border border-red-200" },
};

const PAGE_SIZE = 15;

export default function InvoiceListClient({ invoices, total }: InvoiceListClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const formatMoney = (val: number | string) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(val) || 0);

  const getCustomerName = (customer: Invoice["customer"]) => {
    if (!customer) return "—";
    return customer.companyName || [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "—";
  };

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        !searchTerm ||
        (inv.invoiceNumber ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCustomerName(inv.customer).toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDownloadPdf = async (invoiceId: string) => {
    setDownloadingId(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pdf`);
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.open(data.url, "_blank");
        }
      }
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtreler */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder="Fatura no veya müşteri ara..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
            >
              <option value="ALL">Tüm Durumlar</option>
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Fatura No</th>
                <th className="px-6 py-4">Müşteri</th>
                <th className="px-6 py-4">Tarih</th>
                <th className="px-6 py-4">Vade</th>
                <th className="px-6 py-4">Toplam</th>
                <th className="px-6 py-4">Ödenen</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-400 font-medium">Fatura bulunamadı.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((inv) => {
                  const statusCfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.DRAFT;
                  const totalAmount = Number(inv.totalAmount);
                  const paidAmount = Number(inv.paidAmount);
                  const isOverdue =
                    inv.status === "SENT" &&
                    inv.dueDate &&
                    new Date(inv.dueDate) < new Date();

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="font-black text-slate-900">
                            {inv.invoiceNumber ?? "TASLAK"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {getCustomerName(inv.customer)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {dayjs(inv.issueDate).format("DD MMM YYYY")}
                      </td>
                      <td className="px-6 py-4">
                        {inv.dueDate ? (
                          <span className={isOverdue ? "text-red-600 font-bold" : "text-slate-600"}>
                            {dayjs(inv.dueDate).format("DD MMM YYYY")}
                            {isOverdue && " ⚠️"}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900">
                        {formatMoney(totalAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={paidAmount >= totalAmount ? "text-emerald-600 font-bold" : "text-slate-600"}>
                          {formatMoney(paidAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black ${statusCfg.className}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.pdfUrl && (
                            <button
                              onClick={() => handleDownloadPdf(inv.id)}
                              disabled={downloadingId === inv.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
                              title="PDF İndir"
                            >
                              {downloadingId === inv.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <Link
                            href={`/dashboard/finance/invoices/${inv.id}`}
                            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Detay
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              {filtered.length} sonuçtan {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} gösteriliyor
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
