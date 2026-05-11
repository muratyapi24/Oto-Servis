"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { updateCheckPaymentStatus } from "@/lib/actions/payment.actions";

dayjs.locale("tr");

type CheckStatus = "PENDING" | "COLLECTED" | "BOUNCED";

type CheckPaymentRow = {
  id: string;
  paymentId: string;
  checkNumber: string;
  bankName: string;
  dueDate: Date | string;
  status: CheckStatus | string;
  payment?: {
    amount?: number | string | null;
    customer?: {
      firstName?: string | null;
      lastName?: string | null;
      companyName?: string | null;
    } | null;
  } | null;
};

const STATUS_CONFIG: Record<CheckStatus, { label: string; className: string }> = {
  PENDING: { label: "Bekliyor", className: "bg-amber-50 text-amber-700 border border-amber-200" },
  COLLECTED: { label: "Tahsil Edildi", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  BOUNCED: { label: "Karşılıksız", className: "bg-red-50 text-red-700 border border-red-200" },
};

export default function ChecksClient({
  checks,
  upcomingCount,
}: {
  checks: CheckPaymentRow[];
  upcomingCount: number;
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatMoney = (val?: number | string | null) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(val) || 0);

  const resolveCustomerName = (check: CheckPaymentRow) => {
    const customer = check.payment?.customer;
    if (!customer) return "-";
    return customer.companyName || [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "-";
  };

  const handleStatusUpdate = async (paymentId: string, status: "COLLECTED" | "BOUNCED") => {
    setError(null);
    setLoadingId(paymentId);
    try {
      const result = await updateCheckPaymentStatus(paymentId, status);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "İşlem başarısız.");
      }
    } finally {
      setLoadingId(null);
    }
  };

  const pendingChecks = checks.filter((check) => check.status === "PENDING");
  const today = new Date();
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bekleyen</span>
          <span className="text-3xl font-black text-amber-600 block mt-1">{pendingChecks.length}</span>
        </div>
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">3 Gün İçinde</span>
          <span className="text-3xl font-black text-red-600 block mt-1">{upcomingCount}</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Toplam</span>
          <span className="text-3xl font-black text-slate-900 block mt-1">{checks.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Çek/Senet No</th>
                <th className="px-6 py-4">Müşteri</th>
                <th className="px-6 py-4">Banka</th>
                <th className="px-6 py-4">Tutar</th>
                <th className="px-6 py-4">Vade</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {checks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                    Çek/senet kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                checks.map((check) => {
                  const status = check.status as CheckStatus;
                  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
                  const dueDate = new Date(check.dueDate);
                  const isOverdue = check.status === "PENDING" && dueDate < today;
                  const isDueSoon = check.status === "PENDING" && dueDate >= today && dueDate <= threeDaysLater;

                  return (
                    <tr
                      key={check.id}
                      className={`hover:bg-slate-50/50 transition-colors ${isOverdue ? "bg-red-50/30" : isDueSoon ? "bg-amber-50/30" : ""}`}
                    >
                      <td className="px-6 py-4 font-black text-slate-900">{check.checkNumber}</td>
                      <td className="px-6 py-4 text-slate-700">{resolveCustomerName(check)}</td>
                      <td className="px-6 py-4 text-slate-600">{check.bankName}</td>
                      <td className="px-6 py-4 font-black text-slate-900">{formatMoney(check.payment?.amount)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {(isOverdue || isDueSoon) && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                          <span className={isOverdue ? "text-red-600 font-bold" : isDueSoon ? "text-amber-600 font-bold" : "text-slate-600"}>
                            {dayjs(check.dueDate).format("DD MMM YYYY")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black ${statusCfg.className}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {check.status === "PENDING" && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleStatusUpdate(check.paymentId, "COLLECTED")}
                              disabled={loadingId === check.paymentId}
                              className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                            >
                              {loadingId === check.paymentId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              Tahsil
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(check.paymentId, "BOUNCED")}
                              disabled={loadingId === check.paymentId}
                              className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                            >
                              {loadingId === check.paymentId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                              Karşılıksız
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
