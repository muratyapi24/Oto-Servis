"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Car,
  Clock,
  RefreshCw,
} from "lucide-react";

interface ApprovalOrder {
  id: string;
  orderNumber: number;
  totalAmount: number;
  isUrgent: boolean;
  receptionDate: string;
  vehicle: { plate: string; brand: string; model: string };
  customer: { name: string };
}

export default function OnayClient() {
  const [orders, setOrders] = useState<ApprovalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mobile/firma/onay");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yüklenemedi.");
      setOrders(data.orders ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function handleAction(orderId: string, action: "approve" | "reject", reason?: string) {
    setActionId(orderId);
    try {
      const res = await fetch(`/api/mobile/firma/onay/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "İşlem başarısız.");
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setRejectModal(null);
      setRejectReason("");
    } catch (e: any) {
      setRejectError(e.message);
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#00236f]">Onay Merkezi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Müşteri onayı bekleyen servis emirleri</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <p className="text-base font-bold text-gray-700">Bekleyen onay yok</p>
          <p className="text-sm text-gray-400">Tüm servis emirleri güncel.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                order.isUrgent ? "border-red-300" : "border-gray-200"
              }`}
            >
              {order.isUrgent && (
                <div className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3" /> ACİL
                </div>
              )}
              <div className="p-4 space-y-3">
                {/* Araç & Tutar */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Car className="w-5 h-5 text-[#00236f]" />
                    </div>
                    <div>
                      <p className="font-black text-[#00236f] font-mono text-lg">
                        {order.vehicle.plate}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.vehicle.brand} {order.vehicle.model}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-gray-900 font-mono">
                      ₺{Number(order.totalAmount).toLocaleString("tr-TR")}
                    </p>
                    <p className="text-xs text-gray-400">İş Emri #{order.orderNumber}</p>
                  </div>
                </div>

                {/* Müşteri & Tarih */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{order.customer.name}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(order.receptionDate).toLocaleDateString("tr-TR")}
                  </span>
                </div>

                {/* Detay Linki */}
                <Link
                  href={`/m/firma/servis-detay/${order.id}`}
                  className="text-xs text-[#00236f] font-medium hover:underline"
                >
                  Servis detayını gör →
                </Link>

                {/* Aksiyon Butonları */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => {
                      setRejectModal(order.id);
                      setRejectError(null);
                      setRejectReason("");
                    }}
                    disabled={actionId === order.id}
                    className="flex items-center justify-center gap-2 py-2.5 border-2 border-red-300 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reddet
                  </button>
                  <button
                    onClick={() => handleAction(order.id, "approve")}
                    disabled={actionId === order.id}
                    className="flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#006c49] to-green-600 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
                  >
                    {actionId === order.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Onayla
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Red Gerekçesi Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800">Red Gerekçesi</h3>
            <p className="text-sm text-gray-500">
              Müşteriye iletilecek red gerekçesini girin.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Örn: Müşteri onay vermedi, bütçe aşıldı..."
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-300 focus:border-red-400 resize-none outline-none"
            />
            {rejectError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {rejectError}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => handleAction(rejectModal, "reject", rejectReason)}
                disabled={actionId === rejectModal}
                className="py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {actionId === rejectModal ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Reddet"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
