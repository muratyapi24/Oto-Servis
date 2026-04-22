"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Car,
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Star,
  Loader2,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/tr";

const STATUS_STEPS = [
  { key: "PENDING", label: "Araç Alındı" },
  { key: "IN_PROGRESS", label: "Servis Başladı" },
  { key: "WAITING_APPROVAL", label: "Onay Bekleniyor" },
  { key: "COMPLETED", label: "Tamamlandı" },
];

const STATUS_ORDER: Record<string, number> = {
  PENDING: 0, IN_PROGRESS: 1, WAITING_APPROVAL: 2, COMPLETED: 3, CANCELLED: -1,
};

interface OrderDetail {
  id: string;
  orderNumber: number;
  status: string;
  completionPercentage: number;
  complaintDescription: string;
  inspectionNotes: string | null;
  receptionDate: string;
  promisedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  totalAmount: number;
  vehicle: { plate: string; brand: string; model: string; year: number | null };
  mechanic: { name: string; avatarUrl: string | null } | null;
  documents: { id: string; name: string; fileUrl: string; createdAt: string }[];
  rating: { id: string; rating: number; comment: string | null; createdAt: string } | null;
}

export default function ServisDetayClient({ order }: { order: OrderDetail }) {
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [savedRating, setSavedRating] = useState(order.rating);

  const currentStep = STATUS_ORDER[order.status] ?? 0;
  const isCompleted = order.status === "COMPLETED";

  async function handleRatingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (ratingValue === 0) { setRatingError("Lütfen bir puan seçin."); return; }
    setSubmittingRating(true);
    setRatingError(null);
    try {
      const res = await fetch(`/api/mobile/musteri/servis/${order.id}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: ratingValue, comment: ratingComment || null }),
      });
      const data = await res.json();
      if (!res.ok) { setRatingError(data.error || "Değerlendirme gönderilemedi."); return; }
      setSavedRating({ id: data.rating?.id ?? "new", rating: ratingValue, comment: ratingComment || null, createdAt: new Date().toISOString() });
      setRatingSuccess(true);
    } catch {
      setRatingError("Beklenmeyen bir hata oluştu.");
    } finally {
      setSubmittingRating(false);
    }
  }

  return (
    <div className="space-y-5 pb-8">
      <Link href="/m/musteri/gecmis" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Geçmişe Dön
      </Link>

      {/* Araç Hero */}
      <div className="bg-gradient-to-br from-[#00236f] to-[#1e3a8a] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">İş Emri #{order.orderNumber}</p>
            <h2 className="text-2xl font-black font-mono">{order.vehicle.plate}</h2>
            <p className="text-blue-200 text-sm mt-0.5">
              {order.vehicle.brand} {order.vehicle.model}{order.vehicle.year ? ` · ${order.vehicle.year}` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black">₺{order.totalAmount.toLocaleString("tr-TR")}</p>
          </div>
        </div>
        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-blue-200 mb-1.5">
            <span>İlerleme</span>
            <span className="font-bold">%{order.completionPercentage}</span>
          </div>
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div className="bg-[#6cf8bb] h-full rounded-full" style={{ width: `${order.completionPercentage}%` }} />
          </div>
        </div>
      </div>

      {/* Durum Zaman Çizelgesi */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Servis Durumu</h3>
        <div className="space-y-3">
          {STATUS_STEPS.map((step, idx) => {
            const done = idx <= currentStep;
            const active = idx === currentStep;
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  done ? "bg-[#006c49]" : "bg-gray-100"
                }`}>
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                  )}
                </div>
                <p className={`text-sm ${active ? "font-bold text-gray-900" : done ? "text-gray-600" : "text-gray-400"}`}>
                  {step.label}
                </p>
                {active && <span className="ml-auto text-[10px] font-bold text-[#006c49] bg-green-50 px-2 py-0.5 rounded-full">Şu an</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Usta & Tarih */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Wrench className="w-3 h-3" /> Usta
          </p>
          <p className="text-sm font-bold text-gray-800">{order.mechanic?.name ?? "Atanmadı"}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Alınış
          </p>
          <p className="text-sm font-bold text-gray-800">
            {dayjs(order.receptionDate).locale("tr").format("DD MMM YYYY")}
          </p>
        </div>
      </div>

      {/* Şikayet */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Şikayet</p>
        <p className="text-sm text-gray-700 leading-relaxed">{order.complaintDescription}</p>
        {order.inspectionNotes && (
          <p className="text-xs text-blue-700 bg-blue-50 rounded-lg p-2 mt-2 leading-relaxed">{order.inspectionNotes}</p>
        )}
      </div>

      {/* Belgeler */}
      {order.documents.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Belgeler</span>
          </div>
          <div className="divide-y divide-gray-100">
            {order.documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700 flex-1 truncate">{doc.name}</span>
                <Download className="w-4 h-4 text-gray-400 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Değerlendirme */}
      {isCompleted && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" /> Servis Değerlendirmesi
          </h3>
          {savedRating ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`w-5 h-5 ${s <= savedRating.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                ))}
                <span className="ml-2 text-sm font-bold text-gray-700">{savedRating.rating}/5</span>
              </div>
              {savedRating.comment && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 italic">"{savedRating.comment}"</p>
              )}
              {ratingSuccess && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Değerlendirmeniz kaydedildi.
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleRatingSubmit} className="space-y-3">
              <div className="flex items-center gap-2">
                {[1,2,3,4,5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRatingValue(s)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star className={`w-8 h-8 ${s <= ratingValue ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                rows={3}
                placeholder="Yorumunuz (opsiyonel)..."
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/30 focus:border-[#00236f] resize-none outline-none"
              />
              {ratingError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {ratingError}
                </p>
              )}
              <button
                type="submit"
                disabled={submittingRating || ratingValue === 0}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {submittingRating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                Değerlendir
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
