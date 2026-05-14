"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import { ChevronLeft, ChevronRight, CreditCard, Search } from "lucide-react";

dayjs.locale("tr");

type PaymentCustomer = {
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
};

export type PaymentListItem = {
  id: string;
  amount: number | string;
  paymentMethod: string;
  paymentDate: Date | string;
  customer?: PaymentCustomer | null;
  invoice?: { invoiceNumber?: string | null } | null;
};

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

export default function PaymentListClient({
  payments,
  total,
}: {
  payments: PaymentListItem[];
  total: number;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const formatMoney = (val: number | string) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(val) || 0);

  const getCustomerName = (customer?: PaymentCustomer | null) => {
    if (!customer) return "-";
    return customer.companyName || [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "-";
  };

  const filtered = useMemo(() => {
    return payments.filter((payment) => {
      return (
        !searchTerm ||
        getCustomerName(payment.customer).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.invoice?.invoiceNumber ?? "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [payments, searchTerm]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setPage(1);
            }}
            placeholder="Müşteri veya fatura no ara..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-gray-800/50 text-slate-500 font-bold border-b border-slate-100">
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
                    <CreditCard className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-400 dark:text-slate-500 font-medium">Ödeme bulunamadı.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 dark:bg-gray-800/50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-gray-300">{getCustomerName(payment.customer)}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{payment.invoice?.invoiceNumber ?? "-"}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold bg-slate-100 dark:bg-gray-700 text-slate-600 px-2 py-1 rounded-lg">
                        {METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-emerald-600">{formatMoney(payment.amount)}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{dayjs(payment.paymentDate).format("DD MMM YYYY")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-gray-700 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filtered.length} / {total} kayıt
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-gray-800/50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 dark:text-gray-300">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-gray-800/50 disabled:opacity-40"
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
