"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface PaymentProviderSectionProps {
  currentSettings: PaymentProviderSettings;
}

type Provider = "IYZICO" | "PAYTR" | "NONE";

type PaymentProviderSettings = {
  paymentProvider?: Provider | string | null;
  paymentApiKey?: string | null;
  paymentSecretKey?: string | null;
  paymentMerchantId?: string | null;
};

function isProvider(value: unknown): value is Provider {
  return value === "IYZICO" || value === "PAYTR" || value === "NONE";
}

function stringSetting(value: unknown) {
  return typeof value === "string" ? value : "";
}

async function savePaymentSettings(
  provider: Provider,
  credentials: Record<string, string>
) {
  const { updatePaymentProviderSettings } = await import(
    "@/lib/actions/tenant.actions"
  );
  return updatePaymentProviderSettings({ provider, credentials });
}

export default function PaymentProviderSection({
  currentSettings,
}: PaymentProviderSectionProps) {
  const [provider, setProvider] = useState<Provider>(
    isProvider(currentSettings.paymentProvider) ? currentSettings.paymentProvider : "NONE"
  );
  const [apiKey, setApiKey] = useState(stringSetting(currentSettings.paymentApiKey));
  const [secretKey, setSecretKey] = useState(stringSetting(currentSettings.paymentSecretKey));
  const [merchantId, setMerchantId] = useState(stringSetting(currentSettings.paymentMerchantId));
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setMsg(null);
    const result = await savePaymentSettings(provider, {
      paymentApiKey: apiKey,
      paymentSecretKey: secretKey,
      paymentMerchantId: merchantId,
    });
    setLoading(false);
    if (result.error) {
      setMsg({ type: "error", text: result.error });
    } else {
      setMsg({ type: "success", text: "Ödeme sağlayıcısı kaydedildi." });
    }
  };

  return (
    <div className="space-y-4">
      {/* Sağlayıcı seçimi */}
      <div className="grid grid-cols-3 gap-3">
        {(["NONE", "IYZICO", "PAYTR"] as Provider[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setProvider(p)}
            className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
              provider === p
                ? "border-violet-600 bg-violet-50 text-violet-700"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {p === "NONE" ? "Devre Dışı" : p === "IYZICO" ? "iyzico" : "PayTR"}
          </button>
        ))}
      </div>

      {provider !== "NONE" && (
        <div className="space-y-3 pt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {provider === "IYZICO"
              ? "iyzico Merchant Portal'dan API anahtarlarınızı alın."
              : "PayTR Mağaza panelinden Mağaza ID ve API anahtarlarınızı alın."}
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              API Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                provider === "IYZICO" ? "sandbox-..." : "paytr_api_key"
              }
              className="w-full p-2.5 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-lg text-sm focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              {provider === "IYZICO" ? "Secret Key" : "API Secret"}
            </label>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2.5 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-lg text-sm focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
          {provider === "PAYTR" && (
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Mağaza ID (Merchant ID)
              </label>
              <input
                type="text"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                placeholder="123456"
                className="w-full p-2.5 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-lg text-sm focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
          )}
        </div>
      )}

      {msg && (
        <div
          className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
            msg.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {msg.text}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-70 shadow-sm"
        >
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
