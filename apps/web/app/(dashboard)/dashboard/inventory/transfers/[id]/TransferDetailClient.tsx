"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  ArrowRightLeft,
  MapPin,
  Package,
  Clock,
  Lock,
} from "lucide-react";
import {
  approveStockTransfer,
  rejectStockTransfer,
} from "@/lib/actions/stock-transfer.actions";

dayjs.locale("tr");

interface StockTransferItem {
  id: string;
  partId: string;
  quantity: number | string;
  part: {
    id: string;
    name: string;
    partNumber: string;
    unit: string;
  };
}

interface StockTransfer {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  notes?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  approvedAt?: string | null;
  completedAt?: string | null;
  fromLocation: {
    id: string;
    name: string;
  };
  toLocation: {
    id: string;
    name: string;
  };
  items: StockTransferItem[];
}

interface TransferDetailClientProps {
  transfer: StockTransfer;
}

const STATUS_CONFIG = {
  PENDING: {
    label: "Bekliyor",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
    icon: Clock,
  },
  APPROVED: {
    label: "Onaylandı",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Reddedildi",
    className: "bg-red-50 text-red-700 border border-red-200",
    icon: XCircle,
  },
  COMPLETED: {
    label: "Tamamlandı",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    icon: CheckCircle,
  },
};

export default function TransferDetailClient({
  transfer,
}: TransferDetailClientProps) {
  const router = useRouter();
  const isPending = transfer.status === "PENDING";

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleApprove = async () => {
    setActionError(null);
    setIsApproving(true);
    try {
      const result = await approveStockTransfer(transfer.id);
      if (result.success) {
        setActionSuccess("Transfer başarıyla onaylandı ve tamamlandı.");
        router.refresh();
      } else {
        setActionError(result.error || "Transfer onaylanamadı.");
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setActionError("Red nedeni giriniz.");
      return;
    }
    setActionError(null);
    setIsRejecting(true);
    try {
      const result = await rejectStockTransfer(transfer.id, rejectionReason);
      if (result.success) {
        setActionSuccess("Transfer reddedildi.");
        setShowRejectForm(false);
        router.refresh();
      } else {
        setActionError(result.error || "Transfer reddedilemedi.");
      }
    } finally {
      setIsRejecting(false);
    }
  };

  const statusCfg = STATUS_CONFIG[transfer.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="space-y-6">
      {/* Durum + Aksiyon Başlığı */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border ${statusCfg.className}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {statusCfg.label}
          </span>
          <span className="text-sm text-slate-400">
            {dayjs(transfer.createdAt).format("DD MMM YYYY, HH:mm")}
          </span>
        </div>

        {isPending && !actionSuccess && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowRejectForm(true);
                setActionError(null);
              }}
              disabled={isApproving || isRejecting}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Reddet
            </button>
            <button
              onClick={handleApprove}
              disabled={isApproving || isRejecting}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Onaylanıyor...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Onayla
                </>
              )}
            </button>
          </div>
        )}

        {!isPending && (
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 text-sm font-bold rounded-xl">
            <Lock className="w-4 h-4" />
            Salt Okunur
          </div>
        )}
      </div>

      {/* Başarı Mesajı */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {actionSuccess}
        </div>
      )}

      {/* Hata Mesajı */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {actionError}
        </div>
      )}

      {/* Red Formu */}
      {showRejectForm && isPending && !actionSuccess && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-black text-red-700 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Transfer Reddetme
          </h3>
          <div>
            <label className="block text-xs font-black text-red-600 uppercase tracking-widest mb-1.5">
              Red Nedeni <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="Transferi neden reddediyorsunuz?"
              className="w-full px-3 py-2.5 bg-white border border-red-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/50 outline-none resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowRejectForm(false);
                setRejectionReason("");
                setActionError(null);
              }}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-black rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Reddediliyor...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Reddet
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Red Nedeni (reddedilmişse) */}
      {transfer.status === "REJECTED" && transfer.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
          <span className="font-black text-red-700">Red Nedeni: </span>
          <span className="text-red-600">{transfer.rejectionReason}</span>
        </div>
      )}

      {/* Notlar */}
      {transfer.notes && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600">
          <span className="font-bold text-slate-700">Not: </span>
          {transfer.notes}
        </div>
      )}

      {/* Transfer Bilgileri */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kaynak Lokasyon */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Kaynak Lokasyon
              </p>
              <p className="text-base font-black text-slate-900">
                {transfer.fromLocation.name}
              </p>
            </div>
          </div>
        </div>

        {/* Hedef Lokasyon */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
              <MapPin className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Hedef Lokasyon
              </p>
              <p className="text-base font-black text-slate-900">
                {transfer.toLocation.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Zaman Çizelgesi */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4">
          Zaman Çizelgesi
        </h3>
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Talep Tarihi
            </p>
            <p className="text-sm font-bold text-slate-700">
              {dayjs(transfer.createdAt).format("DD MMM YYYY, HH:mm")}
            </p>
          </div>
          {transfer.approvedAt && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Onay Tarihi
              </p>
              <p className="text-sm font-bold text-slate-700">
                {dayjs(transfer.approvedAt).format("DD MMM YYYY, HH:mm")}
              </p>
            </div>
          )}
          {transfer.completedAt && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Tamamlanma Tarihi
              </p>
              <p className="text-sm font-bold text-emerald-600">
                {dayjs(transfer.completedAt).format("DD MMM YYYY, HH:mm")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Kalemleri */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-black text-slate-700">
            Transfer Kalemleri ({transfer.items.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Parça</th>
                <th className="px-6 py-4">Parça No</th>
                <th className="px-6 py-4 text-center">Miktar</th>
                <th className="px-6 py-4">Birim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfer.items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="font-bold text-slate-900">
                        {item.part.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                      {item.part.partNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-black text-slate-900 text-base">
                      {Number(item.quantity)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500 font-medium">
                      {item.part.unit}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
