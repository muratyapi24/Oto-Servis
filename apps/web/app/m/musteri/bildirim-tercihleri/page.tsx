"use client";

import { useState, useEffect } from "react";
import { Bell, MessageCircle, Mail, Phone, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function BildirimTercihleriPage() {
  const [preferences, setPreferences] = useState({
    smsEnabled: true,
    whatsappEnabled: false,
    emailEnabled: true,
    preferredChannel: "SMS" as "SMS" | "WHATSAPP" | "EMAIL",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/m/notification-preferences")
      .then((r) => r.json())
      .then((data) => {
        if (data.preference) {
          setPreferences(data.preference);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/m/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Tercihleriniz kaydedildi." });
      } else {
        setMessage({ type: "error", text: data.error ?? "Kaydedilemedi." });
      }
    } catch {
      setMessage({ type: "error", text: "Bir hata oluştu." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center pt-8 pb-4">
          <Bell className="w-10 h-10 text-blue-500 mx-auto mb-3" />
          <h1 className="text-xl font-black text-slate-900">Bildirim Tercihleri</h1>
          <p className="text-sm text-slate-500 mt-1">Hangi kanallardan bildirim almak istediğinizi seçin.</p>
        </div>

        {message && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {message.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
          {/* SMS */}
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800">SMS</p>
                <p className="text-xs text-slate-500">Kısa mesaj bildirimleri</p>
              </div>
            </div>
            <button
              onClick={() => setPreferences({ ...preferences, smsEnabled: !preferences.smsEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative ${preferences.smsEnabled ? "bg-blue-500" : "bg-slate-200"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${preferences.smsEnabled ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>

          {/* WhatsApp */}
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800">WhatsApp</p>
                <p className="text-xs text-slate-500">WhatsApp mesaj bildirimleri</p>
              </div>
            </div>
            <button
              onClick={() => setPreferences({ ...preferences, whatsappEnabled: !preferences.whatsappEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative ${preferences.whatsappEnabled ? "bg-emerald-500" : "bg-slate-200"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${preferences.whatsappEnabled ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>

          {/* E-posta */}
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800">E-posta</p>
                <p className="text-xs text-slate-500">E-posta bildirimleri</p>
              </div>
            </div>
            <button
              onClick={() => setPreferences({ ...preferences, emailEnabled: !preferences.emailEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative ${preferences.emailEnabled ? "bg-amber-500" : "bg-slate-200"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${preferences.emailEnabled ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>

        {/* Tercih Edilen Kanal */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">Tercih Edilen Kanal</p>
          <div className="grid grid-cols-3 gap-2">
            {(["SMS", "WHATSAPP", "EMAIL"] as const).map((ch) => (
              <button
                key={ch}
                onClick={() => setPreferences({ ...preferences, preferredChannel: ch })}
                className={`py-2.5 rounded-xl text-xs font-black transition-colors ${
                  preferences.preferredChannel === ch
                    ? "bg-blue-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {ch === "SMS" ? "SMS" : ch === "WHATSAPP" ? "WhatsApp" : "E-posta"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3.5 rounded-2xl text-sm font-black transition-colors disabled:opacity-50 shadow-sm"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Tercihleri Kaydet
        </button>
      </div>
    </div>
  );
}
