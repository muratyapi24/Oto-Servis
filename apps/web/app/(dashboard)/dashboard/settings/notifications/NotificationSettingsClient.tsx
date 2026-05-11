"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ToggleLeft, ToggleRight, TestTube, Loader2, Settings } from "lucide-react";
import {
  createNotificationProvider,
  toggleNotificationProvider,
  testNotificationProvider,
} from "@/lib/actions/notification-provider.actions";
import type { NotificationProviderListItem } from "@/components/dashboard/notifications/types";

const PROVIDER_TYPES = [
  { type: "SMS", label: "SMS", providers: ["TWILIO", "NETGSM", "ILETI_MERKEZI"] },
  { type: "WHATSAPP", label: "WhatsApp", providers: ["TWILIO_WHATSAPP", "META_CLOUD_API"] },
  { type: "EMAIL", label: "E-posta", providers: ["RESEND"] },
];

const PROVIDER_FIELDS: Record<string, Array<{ key: string; label: string; type?: string }>> = {
  TWILIO: [
    { key: "accountSid", label: "Account SID" },
    { key: "authToken", label: "Auth Token", type: "password" },
    { key: "fromNumber", label: "Gönderici Numara" },
  ],
  TWILIO_WHATSAPP: [
    { key: "accountSid", label: "Account SID" },
    { key: "authToken", label: "Auth Token", type: "password" },
    { key: "fromNumber", label: "WhatsApp Numara (+90...)" },
  ],
  META_CLOUD_API: [
    { key: "phoneNumberId", label: "Phone Number ID" },
    { key: "accessToken", label: "Access Token", type: "password" },
    { key: "wabaId", label: "WABA ID" },
  ],
  NETGSM: [
    { key: "usercode", label: "Kullanıcı Kodu" },
    { key: "password", label: "Şifre", type: "password" },
    { key: "senderId", label: "Gönderici Adı" },
  ],
  ILETI_MERKEZI: [
    { key: "username", label: "Kullanıcı Adı" },
    { key: "password", label: "Şifre", type: "password" },
    { key: "senderId", label: "Gönderici Adı" },
  ],
  RESEND: [
    { key: "apiKey", label: "API Key", type: "password" },
    { key: "fromEmail", label: "Gönderici E-posta" },
  ],
};

export default function NotificationSettingsClient({ providers }: { providers: NotificationProviderListItem[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState("SMS");
  const [selectedProvider, setSelectedProvider] = useState("TWILIO");
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message?: string } | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fields = PROVIDER_FIELDS[selectedProvider] ?? [];

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      await createNotificationProvider({
        type: selectedType,
        provider: selectedProvider,
        settings,
      });
      setShowForm(false);
      setSettings({});
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (providerId: string) => {
    setTogglingId(providerId);
    try {
      await toggleNotificationProvider(providerId);
      router.refresh();
    } finally {
      setTogglingId(null);
    }
  };

  const handleTest = async (providerId: string) => {
    setTestingId(providerId);
    setTestResult(null);
    try {
      const result = await testNotificationProvider(providerId);
      setTestResult({
        id: providerId,
        success: result.success,
        message: result.error,
      });
    } finally {
      setTestingId(null);
    }
  };

  const groupedProviders = PROVIDER_TYPES.map((pt) => ({
    ...pt,
    items: providers.filter((p) => p.type === pt.type),
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Sağlayıcı Ekle
        </button>
      </div>

      {/* Sağlayıcı Ekleme Formu */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-black text-slate-900">Yeni Sağlayıcı Ekle</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Kanal Tipi</label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  const pt = PROVIDER_TYPES.find((p) => p.type === e.target.value);
                  if (pt && pt.providers[0]) setSelectedProvider(pt.providers[0]);
                  setSettings({});
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              >
                {PROVIDER_TYPES.map((pt) => (
                  <option key={pt.type} value={pt.type}>{pt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Sağlayıcı</label>
              <select
                value={selectedProvider}
                onChange={(e) => { setSelectedProvider(e.target.value); setSettings({}); }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              >
                {PROVIDER_TYPES.find((pt) => pt.type === selectedType)?.providers.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">{field.label}</label>
                <input
                  type={field.type ?? "text"}
                  value={settings[field.key] ?? ""}
                  onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              İptal
            </button>
            <button
              onClick={handleCreate}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-black rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Kaydet
            </button>
          </div>
        </div>
      )}

      {/* Sağlayıcı Grupları */}
      {groupedProviders.map((group) => (
        <div key={group.type} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-500" />
            <h3 className="font-black text-slate-900">{group.label} Sağlayıcıları</h3>
          </div>
          {group.items.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-400 text-sm">
              Henüz {group.label} sağlayıcısı eklenmemiş.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {group.items.map((p) => (
                <div key={p.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{p.provider}</p>
                    <p className="text-xs text-slate-400">
                      {Object.entries(p.settings ?? {})
                        .slice(0, 2)
                        .map(([k, v]) => `${k}: ${String(v)}`)
                        .join(" · ")}
                    </p>
                  </div>
                  {testResult?.id === p.id && (
                    <span className={`text-xs font-bold ${testResult?.success ? "text-emerald-600" : "text-red-600"}`}>
                      {testResult?.success ? "✓ Bağlantı başarılı" : `✗ ${testResult?.message}`}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTest(p.id)}
                      disabled={testingId === p.id}
                      className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {testingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TestTube className="w-3.5 h-3.5" />}
                      Test
                    </button>
                    <button
                      onClick={() => handleToggle(p.id)}
                      disabled={togglingId === p.id}
                      className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
                    >
                      {togglingId === p.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : p.isActive ? (
                        <ToggleRight className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-400" />
                      )}
                      <span className="text-xs font-bold">{p.isActive ? "Aktif" : "Pasif"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
