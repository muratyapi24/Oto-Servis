"use client";

/**
 * CookieBanner — KVKK uyumlu çerez onay bileşeni
 *
 * localStorage "cookie_consent" key:
 *   "accepted" | "rejected" | undefined (henüz karar verilmedi)
 */

import { useState, useEffect } from "react";
import Link from "next/link";

type ConsentState = "accepted" | "rejected" | null;

export function CookieBanner() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cookie_consent") as ConsentState | null;
    if (!stored) {
      // Kısa gecikme — sayfa render sonrası göster
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
    setConsent(stored);
  }, []);

  function handleAccept() {
    localStorage.setItem("cookie_consent", "accepted");
    setConsent("accepted");
    setVisible(false);
  }

  function handleReject() {
    localStorage.setItem("cookie_consent", "rejected");
    setConsent("rejected");
    setVisible(false);
  }

  if (!visible || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Çerez Politikası"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none"
    >
      <div className="max-w-4xl mx-auto pointer-events-auto">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/10 p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* İkon + Metin */}
            <div className="flex items-start gap-3 flex-1">
              <span className="text-2xl shrink-0 mt-0.5">🍪</span>
              <div>
                <p className="font-bold text-slate-900 text-sm mb-1">
                  Çerez ve Gizlilik Bildirimi
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Deneyiminizi iyileştirmek için zorunlu çerezler kullanıyoruz. Analitik ve
                  pazarlama çerezlerini kabul ederek hizmetimizi geliştirmemize yardım edebilirsiniz.{" "}
                  <Link href="/cookies" className="text-blue-600 hover:underline font-medium">
                    Çerez Politikası
                  </Link>{" "}
                  ve{" "}
                  <Link href="/kvkk" className="text-blue-600 hover:underline font-medium">
                    KVKK Aydınlatma Metni
                  </Link>{" "}
                  için tıklayın.
                </p>
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleReject}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Reddet
              </button>
              <button
                onClick={handleAccept}
                className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                Kabul Et
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
