"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Car, Wrench, AlertCircle } from "lucide-react";

interface ServiceOrderData {
  id: string;
  orderNumber: number;
  status: string;
  complaintDescription: string;
  estimatedCost: number | null;
  totalAmount: number;
  vehicle: { plate: string; brand: string; model: string };
  customer: { firstName: string | null; lastName: string | null; companyName: string | null; type: string };
  items: { name: string; itemType: string; quantity: number; unitPrice: number; totalPrice: number }[];
}

interface Props {
  token: string;
  serviceOrder: ServiceOrderData;
}

export default function ApprovalClient({ token, serviceOrder }: Props) {
  const [step, setStep] = useState<"view" | "reject" | "done">("view");
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: string; error?: string } | null>(null);
  const [action, setAction] = useState<"approved" | "rejected" | null>(null);

  const customerName = serviceOrder.customer.type === "CORPORATE"
    ? serviceOrder.customer.companyName
    : `${serviceOrder.customer.firstName ?? ""} ${serviceOrder.customer.lastName ?? ""}`.trim();

  async function handleAction(act: "APPROVE" | "REJECT") {
    setLoading(true);
    const res = await fetch(`/api/approval/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: act, reason: rejectReason }),
    });
    const data = await res.json();
    setLoading(false);
    setResult(data);
    if (!data.error) {
      setAction(act === "APPROVE" ? "approved" : "rejected");
      setStep("done");
    }
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${action === "approved" ? "bg-green-100" : "bg-red-100"}`}>
            {action === "approved" ? <CheckCircle2 className="w-8 h-8 text-green-600" /> : <XCircle className="w-8 h-8 text-red-600" />}
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {action === "approved" ? "Onaylandı!" : "Reddedildi"}
          </h1>
          <p className="text-gray-500 text-sm">{result?.success}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Wrench className="w-6 h-6 text-blue-700" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Servis Onay Talebi</h1>
          <p className="text-sm text-gray-500 mt-1">İş Emri #{serviceOrder.orderNumber} — {customerName}</p>
        </div>

        {/* Araç Bilgisi */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <Car className="w-5 h-5 text-gray-500" />
            <h2 className="font-bold text-gray-800">Araç Bilgisi</h2>
          </div>
          <p className="text-lg font-bold text-blue-900 font-mono">{serviceOrder.vehicle.plate}</p>
          <p className="text-sm text-gray-600">{serviceOrder.vehicle.brand} {serviceOrder.vehicle.model}</p>
          <div className="mt-3 p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 font-medium">Şikayet / Talep:</p>
            <p className="text-sm text-gray-800 mt-1">{serviceOrder.complaintDescription}</p>
          </div>
        </div>

        {/* İşlem Kalemleri */}
        {serviceOrder.items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-gray-800 mb-3">Yapılacak İşlemler</h2>
            <div className="space-y-2">
              {serviceOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.quantity} × ₺{item.unitPrice.toLocaleString("tr-TR")}</p>
                  </div>
                  <span className="font-bold text-sm font-mono">₺{item.totalPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 font-bold text-lg">
              <span>Toplam Tutar</span>
              <span className="font-mono text-blue-900">₺{serviceOrder.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        {/* Hata mesajı */}
        {result?.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />{result.error}
          </div>
        )}

        {/* Red nedeni */}
        {step === "reject" && (
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
            <h2 className="font-bold text-gray-800">Red Nedeni</h2>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Neden reddettiğinizi belirtin..."
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-red-500 focus:border-red-500"
            />
            <div className="flex gap-3">
              <button onClick={() => setStep("view")} className="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50">Geri</button>
              <button onClick={() => handleAction("REJECT")} disabled={loading || !rejectReason.trim()} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-70">
                {loading ? "İşleniyor..." : "Reddet"}
              </button>
            </div>
          </div>
        )}

        {/* Aksiyon Butonları */}
        {step === "view" && (
          <div className="flex gap-3">
            <button onClick={() => setStep("reject")} className="flex-1 py-4 border-2 border-red-200 text-red-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors">
              <XCircle className="w-5 h-5" /> Reddet
            </button>
            <button onClick={() => handleAction("APPROVE")} disabled={loading} className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-70 shadow-lg shadow-green-600/20">
              <CheckCircle2 className="w-5 h-5" /> {loading ? "İşleniyor..." : "Onayla"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
