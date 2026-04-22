"use client";

import { useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import { FileText, Plus, Search, CheckCircle2, Clock, XCircle, Send, AlertCircle } from "lucide-react";
import QuoteFormModal from "./QuoteFormModal";
import { updateQuoteStatus } from "@/lib/actions/quote.actions";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  DRAFT:    { label: "Taslak",     className: "bg-gray-100 text-gray-700" },
  SENT:     { label: "Gönderildi", className: "bg-blue-100 text-blue-800" },
  ACCEPTED: { label: "Kabul",      className: "bg-green-100 text-green-800" },
  REJECTED: { label: "Red",        className: "bg-red-100 text-red-800" },
  EXPIRED:  { label: "Süresi Doldu", className: "bg-orange-100 text-orange-800" },
};

interface Props {
  quotes: any[];
  customers: any[];
  parts: any[];
}

export default function QuoteBoardClient({ quotes, customers, parts }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = quotes.filter((q) => {
    const customerName = q.customer?.type === "CORPORATE"
      ? q.customer?.companyName ?? ""
      : `${q.customer?.firstName ?? ""} ${q.customer?.lastName ?? ""}`.trim();
    const matchSearch = !search || customerName.toLowerCase().includes(search.toLowerCase()) || q.vehicle?.plate?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function handleSend(quoteId: string) {
    setUpdating(quoteId);
    await updateQuoteStatus({ quoteId, status: "SENT" });
    setUpdating(null);
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Müşteri veya plaka ara..." className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none">
            <option value="ALL">Tüm Durumlar</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Yeni Teklif
        </button>
      </div>

      {/* Teklif Listesi */}
      {filtered.length === 0 ? (
        <div className="p-12 border border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-center">
          <FileText className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-sm font-bold text-gray-500">Teklif bulunamadı.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left">Teklif No</th>
                <th className="px-5 py-3 text-left">Müşteri</th>
                <th className="px-5 py-3 text-left">Araç</th>
                <th className="px-5 py-3 text-left">Tarih</th>
                <th className="px-5 py-3 text-left">Durum</th>
                <th className="px-5 py-3 text-right">Tutar</th>
                <th className="px-5 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((q) => {
                const s = STATUS_MAP[q.status] ?? { label: q.status, className: "bg-gray-100 text-gray-700" };
                const customerName = q.customer?.type === "CORPORATE"
                  ? q.customer?.companyName
                  : `${q.customer?.firstName ?? ""} ${q.customer?.lastName ?? ""}`.trim();
                return (
                  <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/dashboard/quotes/${q.id}`} className="font-bold text-blue-700 hover:underline">
                        #{q.quoteNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-800">{customerName}</td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">{q.vehicle?.plate ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{dayjs(q.createdAt).locale("tr").format("DD MMM YYYY")}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${s.className}`}>{s.label}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-gray-800">
                      ₺{q.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {q.status === "DRAFT" && (
                        <button onClick={() => handleSend(q.id)} disabled={updating === q.id} className="flex items-center gap-1 ml-auto px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors disabled:opacity-50">
                          <Send className="w-3 h-3" /> {updating === q.id ? "..." : "Gönder"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <QuoteFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} customers={customers} parts={parts} />
    </div>
  );
}
