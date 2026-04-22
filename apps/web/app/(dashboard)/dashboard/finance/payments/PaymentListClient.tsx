"use client";

import { useState, useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import { CreditCard, Search, ChevronLeft, ChevronRight } from "lucide-react";

dayjs.locale("tr");

const METHOD_LABELS: Record<string, string> = {
  CASH: "Nakit",
  CREDIT_CARD: "Kredi Kartı",
  BANK_TRANSFER: "Havale/EFT",
  IYZICO: "iyzico",
  PAYTR: "PayTR",
  CHECK: "Çek",
  PROMISSORY_NOTE: "Senet",
};

const PAGE_SIZE = 20;

export default function PaymentListClient({ payments, total }: { payments: any[]; total: number }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const formatMoney = (val: number | string) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(val) || 0);

  const getCustomerName = (customer: any) => {
    if (!customer) return "—";
    return customer.companyName || [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "—";
  };

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      return (
        !searchTerm ||
        getCustomerName(p.customer).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.invoice?.invoiceNumber ?? "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [payments, searchTerm]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            placeholder="Müşteri veya fatura no ara..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Müşteri</th>
                <th className="px-6 py-4">Fatura</th>
                <th className="px-6 py-4">Yöntem</th>
                <th className="px-6 py-4">Tutar</th>
                <th className="px-6 py-4">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <CreditCard className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-400 font-medium">Ödeme bulunamadı.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">{getCustomerName(p.customer)}</td>
                    <td className="px-6 py-4 text-slate-600">{p.invoice?.invoiceNumber ?? "—"}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                        {METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-emerald-600">{formatMoney(p.amount)}</td>
                    <td className="px-6 py-4 text-slate-600">{dayjs(p.paymentDate).format("DD MMM YYYY")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">{filtered.length} kayıt</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
