"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import {
  Search,
  Download,
  Filter,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  ArrowUpRight,
  Plus,
  ChevronRight
} from "lucide-react";

dayjs.locale("tr");

const InvoiceFormModal = dynamic(() => import("./InvoiceFormModal"), {
  ssr: false,
  loading: () => null,
});

interface InvoiceListClientProps {
  invoices: any[];
  customers: any[];
}

const statusMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  DRAFT: { label: "Taslak", color: "text-slate-600", bg: "bg-slate-100", icon: FileText },
  SENT: { label: "Kesildi", color: "text-blue-600", bg: "bg-blue-50", icon: ArrowUpRight },
  PAID: { label: "Ödendi", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
  CANCELLED: { label: "İptal", color: "text-red-500", bg: "bg-red-50", icon: XCircle },
};

const typeMap: Record<string, { label: string; color: string }> = {
  SALES: { label: "Satış", color: "text-blue-700" },
  PURCHASE: { label: "Alış", color: "text-orange-600" },
};

export default function InvoiceListClient({ invoices, customers }: InvoiceListClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(val);

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      !searchTerm ||
      inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === "ALL" || inv.status === statusFilter;
    const matchType = typeFilter === "ALL" || inv.type === typeFilter;

    return matchSearch && matchStatus && matchType;
  });

  // Stats
  const totalSales = invoices.filter(i => i.type === "SALES").reduce((s, i) => s + i.totalAmount, 0);
  const totalPurchase = invoices.filter(i => i.type === "PURCHASE").reduce((s, i) => s + i.totalAmount, 0);
  const paidCount = invoices.filter(i => i.status === "PAID").length;
  const unpaidCount = invoices.filter(i => i.status === "SENT" || i.status === "DRAFT").length;

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-slate-100 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Toplam Satış</p>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-2">{formatMoney(totalSales)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{invoices.filter(i => i.type === "SALES").length} fatura</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-slate-100 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Toplam Alış</p>
          <p className="text-2xl font-black text-orange-600 mt-2">{formatMoney(totalPurchase)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{invoices.filter(i => i.type === "PURCHASE").length} fatura</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-slate-100 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Ödenen</p>
          <p className="text-2xl font-black text-emerald-600 mt-2">{paidCount}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">tamamlanmış fatura</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-slate-100 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Bekleyen</p>
          <p className="text-2xl font-black text-amber-600 mt-2">{unpaidCount}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ödeme bekleyen fatura</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/30 outline-none"
              placeholder="Fatura No, Müşteri, Not ara..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="DRAFT">Taslak</option>
            <option value="SENT">Kesildi</option>
            <option value="PAID">Ödendi</option>
            <option value="CANCELLED">İptal</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none"
          >
            <option value="ALL">Tüm Tipler</option>
            <option value="SALES">Satış</option>
            <option value="PURCHASE">Alış</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/finances"
            className="flex items-center gap-2 bg-white dark:bg-gray-800 text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all"
          >
            <Receipt className="w-4 h-4" /> Kasa Paneli
          </Link>
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Yeni Fatura
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-gray-700">
                <th className="text-left px-5 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Fatura No</th>
                <th className="text-left px-5 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Müşteri / Tedarikçi</th>
                <th className="text-left px-5 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tür</th>
                <th className="text-left px-5 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tarih</th>
                <th className="text-left px-5 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vade</th>
                <th className="text-right px-5 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tutar</th>
                <th className="text-right px-5 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ödenen</th>
                <th className="text-center px-5 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Durum</th>
                <th className="text-center px-5 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500">Hiç fatura bulunamadı.</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Filtreleri değiştirin veya yeni bir fatura oluşturun.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => {
                  const st = statusMap[inv.status] || { label: "Taslak", color: "text-slate-600", bg: "bg-slate-100", icon: FileText };
                  const tp = typeMap[inv.type] || { label: "Satış", color: "text-blue-700" };
                  const remaining = inv.totalAmount - inv.paidAmount;
                  const pastDue = inv.dueDate && dayjs().isAfter(dayjs(inv.dueDate)) && inv.status !== "PAID" && inv.status !== "CANCELLED";
                  const StatusIcon = st.icon;

                  return (
                    <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50 dark:bg-gray-800/50/50 transition-colors group">
                      <td className="px-5 py-4">
                        <Link href={`/dashboard/finances/invoices/${inv.id}`} className="text-sm font-black text-slate-900 dark:text-white hover:text-blue-600 transition-colors">
                          {inv.invoiceNumber || "—"}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-slate-700 dark:text-gray-300">
                          {inv.customerName || inv.supplierName || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold ${tp.color}`}>{tp.label}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{dayjs(inv.issueDate).format("DD MMM YYYY")}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium ${pastDue ? "text-red-600 font-bold" : "text-slate-500"}`}>
                          {inv.dueDate ? dayjs(inv.dueDate).format("DD MMM YYYY") : "—"}
                          {pastDue && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-sm font-black text-slate-900 dark:text-white">{formatMoney(inv.totalAmount)}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`text-sm font-bold ${inv.paidAmount >= inv.totalAmount ? "text-emerald-600" : "text-slate-500"}`}>
                          {formatMoney(inv.paidAmount)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${st.bg} ${st.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Link
                          href={`/dashboard/finances/invoices/${inv.id}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 dark:text-slate-500 hover:text-blue-600"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isInvoiceModalOpen && (
        <InvoiceFormModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          customers={customers}
        />
      )}
    </div>
  );
}
