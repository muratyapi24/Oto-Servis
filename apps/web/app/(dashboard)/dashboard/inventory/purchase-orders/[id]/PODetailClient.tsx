"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  XCircle,
  PackageCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Download,
} from "lucide-react";
import {
  sendPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
} from "@/lib/actions/purchase-order.actions";
import { exportElementToPdf } from "@/lib/pdf-utils";

interface POItem {
  id: string;
  partId: string;
  quantity: number | string;
  unitPrice: number | string;
  taxRate: number | string;
  receivedQuantity: number | string;
  part: {
    id: string;
    name: string;
    partNumber: string;
    unit: string;
  };
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: "DRAFT" | "SENT" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";
  totalAmount: number | string;
  subTotal: number | string;
  taxAmount: number | string;
  expectedDate?: string | null;
  notes?: string | null;
  sentAt?: string | null;
  receivedAt?: string | null;
  createdAt: string;
  supplier: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  items: POItem[];
  stockMovements: Array<{
    id: string;
    type: string;
    quantity: number | string;
    reason?: string | null;
    createdAt: string;
    part: {
      id: string;
      name: string;
      partNumber: string;
    };
  }>;
}

interface PODetailClientProps {
  order: PurchaseOrder;
}

const STATUS_CONFIG = {
  DRAFT: {
    label: "Taslak",
    className: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  SENT: {
    label: "Gönderildi",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  PARTIALLY_RECEIVED: {
    label: "Kısmi Teslim",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  RECEIVED: {
    label: "Teslim Alındı",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  CANCELLED: {
    label: "İptal Edildi",
    className: "bg-red-50 text-red-600 border border-red-200",
  },
};

export default function PODetailClient({ order }: PODetailClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  // Teslim alım miktarları
  const [receiveQtys, setReceiveQtys] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    order.items.forEach((item) => {
      const remaining =
        Number(item.quantity) - Number(item.receivedQuantity);
      init[item.id] = remaining > 0 ? remaining : 0;
    });
    return init;
  });

  const formatMoney = (val: number | string) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(Number(val) || 0);

  const formatDate = (d?: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.DRAFT;

  const canSend = order.status === "DRAFT";
  const canReceive =
    order.status === "SENT" || order.status === "PARTIALLY_RECEIVED";
  const canCancel =
    order.status === "DRAFT" || order.status === "SENT";

  const handleSend = async () => {
    setError(null);
    setIsLoading("send");
    try {
      const result = await sendPurchaseOrder(order.id);
      if (result.success) {
        setSuccessMsg("Sipariş tedarikçiye gönderildi.");
        router.refresh();
      } else {
        setError(result.error || "Gönderme işlemi başarısız.");
      }
    } finally {
      setIsLoading(null);
    }
  };

  const handleReceive = async () => {
    setError(null);

    const itemsToReceive = order.items
      .map((item) => ({
        itemId: item.id,
        receivedQuantity: receiveQtys[item.id] ?? 0,
      }))
      .filter((i) => i.receivedQuantity > 0);

    if (itemsToReceive.length === 0) {
      setError("Teslim alınacak miktar girilmedi.");
      return;
    }

    setIsLoading("receive");
    try {
      const result = await receivePurchaseOrder(order.id, {
        items: itemsToReceive,
      });
      if (result.success) {
        setSuccessMsg(
          `Teslim alım tamamlandı. Durum: ${result.data?.status}`
        );
        router.refresh();
      } else {
        setError(result.error || "Teslim alım başarısız.");
      }
    } finally {
      setIsLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Bu siparişi iptal etmek istediğinize emin misiniz?")) return;
    setError(null);
    setIsLoading("cancel");
    try {
      const result = await cancelPurchaseOrder(order.id);
      if (result.success) {
        setSuccessMsg("Sipariş iptal edildi.");
        router.refresh();
      } else {
        setError(result.error || "İptal işlemi başarısız.");
      }
    } finally {
      setIsLoading(null);
    }
  };

  const handlePdfExport = async () => {
    setIsPdfLoading(true);
    try {
      await exportElementToPdf("po-detail-pdf", {
        filename: `${order.poNumber}.pdf`,
        orientation: "p",
        format: "a4",
        margin: 10,
      });
    } finally {
      setIsPdfLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bildirimler */}
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
        {canSend && (
          <button
            onClick={handleSend}
            disabled={isLoading === "send"}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-black transition-colors disabled:opacity-50"
          >
            {isLoading === "send" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Tedarikçiye Gönder
          </button>
        )}

        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={isLoading === "cancel"}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-black transition-colors disabled:opacity-50"
          >
            {isLoading === "cancel" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            Siparişi İptal Et
          </button>
        )}

        <button
          onClick={handlePdfExport}
          disabled={isPdfLoading}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ml-auto"
        >
          {isPdfLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          PDF İndir
        </button>
      </div>

      {/* PDF İçeriği (görünür kart + gizli export hedefi) */}
      <div id="po-detail-pdf" className="space-y-6 bg-white">
        {/* PO Başlık Kartı */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {order.poNumber}
                </h2>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-black ${statusCfg.className}`}
                >
                  {statusCfg.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                    Oluşturulma
                  </span>
                  <p className="font-bold text-slate-700">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                {order.expectedDate && (
                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                      Beklenen Teslim
                    </span>
                    <p className="font-bold text-slate-700">
                      {formatDate(order.expectedDate)}
                    </p>
                  </div>
                )}
                {order.sentAt && (
                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                      Gönderilme
                    </span>
                    <p className="font-bold text-slate-700">
                      {formatDate(order.sentAt)}
                    </p>
                  </div>
                )}
                {order.receivedAt && (
                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                      Teslim Alındı
                    </span>
                    <p className="font-bold text-emerald-600">
                      {formatDate(order.receivedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tedarikçi Bilgisi */}
            <div className="bg-slate-50 rounded-xl p-4 min-w-[200px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Tedarikçi
              </p>
              <p className="font-black text-slate-900">{order.supplier.name}</p>
              {order.supplier.email && (
                <p className="text-xs text-slate-500 mt-1">
                  {order.supplier.email}
                </p>
              )}
              {order.supplier.phone && (
                <p className="text-xs text-slate-500">{order.supplier.phone}</p>
              )}
              {order.supplier.address && (
                <p className="text-xs text-slate-500 mt-1">
                  {order.supplier.address}
                </p>
              )}
            </div>
          </div>

          {order.notes && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                Notlar
              </p>
              <p className="text-sm text-slate-600">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Kalemler Tablosu */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-black text-slate-900">
              Sipariş Kalemleri ({order.items.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left">Parça</th>
                  <th className="px-6 py-3 text-center">Sipariş Miktarı</th>
                  <th className="px-6 py-3 text-center">Teslim Alınan</th>
                  <th className="px-6 py-3 text-center">Birim Fiyat</th>
                  <th className="px-6 py-3 text-center">KDV</th>
                  <th className="px-6 py-3 text-right">Satır Toplamı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item) => {
                  const qty = Number(item.quantity);
                  const received = Number(item.receivedQuantity);
                  const remaining = qty - received;
                  const lineTotal =
                    qty *
                    Number(item.unitPrice) *
                    (1 + Number(item.taxRate) / 100);
                  const isFullyReceived = received >= qty;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">
                          {item.part.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {item.part.partNumber} · {item.part.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700">
                        {qty} {item.part.unit}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black ${
                            isFullyReceived
                              ? "bg-emerald-50 text-emerald-700"
                              : received > 0
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {received} / {qty}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600">
                        {formatMoney(item.unitPrice)}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600">
                        %{Number(item.taxRate)}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">
                        {formatMoney(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Toplam */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
            <div className="flex flex-col items-end gap-1 text-sm">
              <div className="flex gap-8">
                <span className="text-slate-500">Ara Toplam</span>
                <span className="font-bold text-slate-700 w-28 text-right">
                  {formatMoney(order.subTotal)}
                </span>
              </div>
              <div className="flex gap-8">
                <span className="text-slate-500">KDV</span>
                <span className="font-bold text-slate-700 w-28 text-right">
                  {formatMoney(order.taxAmount)}
                </span>
              </div>
              <div className="flex gap-8 text-base border-t border-slate-200 pt-2 mt-1">
                <span className="font-black text-slate-900">Genel Toplam</span>
                <span className="font-black text-amber-600 w-28 text-right">
                  {formatMoney(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Teslim Alım Formu */}
      {canReceive && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 bg-amber-50">
            <h3 className="font-black text-amber-800 flex items-center gap-2">
              <PackageCheck className="w-5 h-5" />
              Teslim Alım İşlemi
            </h3>
            <p className="text-xs text-amber-600 mt-1">
              Her kalem için teslim alınan miktarı girin.
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              {order.items.map((item) => {
                const qty = Number(item.quantity);
                const received = Number(item.receivedQuantity);
                const remaining = qty - received;
                if (remaining <= 0) return null;

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-sm">
                        {item.part.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        Kalan: {remaining} {item.part.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-500">
                        Teslim Alınan:
                      </label>
                      <input
                        type="number"
                        value={receiveQtys[item.id] ?? 0}
                        onChange={(e) =>
                          setReceiveQtys((prev) => ({
                            ...prev,
                            [item.id]: Math.min(
                              Number(e.target.value),
                              remaining
                            ),
                          }))
                        }
                        min={0}
                        max={remaining}
                        className="w-20 text-center px-2 py-1.5 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                      <span className="text-xs text-slate-400">
                        {item.part.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleReceive}
              disabled={isLoading === "receive"}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-colors disabled:opacity-50"
            >
              {isLoading === "receive" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PackageCheck className="w-4 h-4" />
              )}
              Teslim Alımı Kaydet
            </button>
          </div>
        </div>
      )}

      {/* Stok Hareketleri */}
      {order.stockMovements.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-black text-slate-900">
              Stok Hareketleri ({order.stockMovements.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {order.stockMovements.map((mov) => (
              <div
                key={mov.id}
                className="px-6 py-3 flex items-center gap-4 hover:bg-slate-50/50"
              >
                <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0">
                  +{Number(mov.quantity)}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">
                    {mov.part.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {mov.reason || "—"} ·{" "}
                    {new Date(mov.createdAt).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                  GİRİŞ
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
