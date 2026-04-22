"use client";

import { useState } from "react";
import { createDataSubjectRequest } from "@/lib/actions/musteri.actions";

export default function DataRightsSection() {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleRequest = async (type: "EXPORT" | "ERASURE") => {
    setLoading(type);
    setMessage(null);
    const result = await createDataSubjectRequest(type);
    setLoading(null);
    if (result.success) {
      setMessage({
        type: "success",
        text:
          type === "EXPORT"
            ? "Veri dışa aktarma talebiniz alındı. 30 gün içinde e-postanıza gönderilecek."
            : "Veri silme talebiniz alındı. 30 gün içinde işleme alınacak.",
      });
    } else {
      setMessage({ type: "error", text: result.error ?? "Bir hata oluştu." });
    }
  };

  return (
    <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-on-surface-variant text-xl">shield_person</span>
        <h3 className="text-sm font-bold text-on-surface">Kişisel Veri Haklarım</h3>
      </div>

      <p className="text-xs text-on-surface-variant leading-relaxed">
        KVKK kapsamında kişisel verileriniz üzerinde aşağıdaki haklara sahipsiniz.
        Talepleriniz 30 gün içinde yanıtlanır.
      </p>

      {message && (
        <div
          className={`text-xs p-3 rounded-lg flex items-center gap-2 ${
            message.type === "success"
              ? "bg-secondary-fixed/50 text-secondary border border-secondary/20"
              : "bg-error/10 text-error border border-error/20"
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {message.type === "success" ? "check_circle" : "error"}
          </span>
          {message.text}
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={() => handleRequest("EXPORT")}
          disabled={loading !== null}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-outline-variant/20 hover:bg-surface-dim/50 transition-colors text-left disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-primary text-xl">download</span>
          <div>
            <div className="text-sm font-semibold text-on-surface">
              {loading === "EXPORT" ? "Talep gönderiliyor..." : "Verilerimi İndir"}
            </div>
            <div className="text-xs text-on-surface-variant">Tüm kişisel verilerin kopyasını talep et</div>
          </div>
        </button>

        <button
          onClick={() => handleRequest("ERASURE")}
          disabled={loading !== null}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-error/20 hover:bg-error/5 transition-colors text-left disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-error text-xl">delete_forever</span>
          <div>
            <div className="text-sm font-semibold text-error">
              {loading === "ERASURE" ? "Talep gönderiliyor..." : "Hesabımı Sil"}
            </div>
            <div className="text-xs text-on-surface-variant">Yasal saklama süresi dışındaki tüm verilerimi sil</div>
          </div>
        </button>
      </div>
    </section>
  );
}
