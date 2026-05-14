"use client";

import { useState } from "react";

interface TwoFactorSettingsProps {
  hasTwoFactor: boolean;
}

export function TwoFactorSettings({ hasTwoFactor }: TwoFactorSettingsProps) {
  const [step, setStep] = useState<"idle" | "setup" | "verify" | "backup" | "disable">("idle");
  const [qrCode, setQrCode] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSetup() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQrCode(data.qrCode);
      setBackupCodes(data.backupCodes);
      setStep("setup");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep("backup");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep("idle");
      window.location.reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (step === "backup") {
    return (
      <div className="p-4 border rounded-lg bg-green-50">
        <h3 className="font-semibold text-green-800 mb-2">2FA Aktif Edildi</h3>
        <p className="text-sm text-green-700 mb-3">
          Yedek kodlarınızı güvenli bir yere kaydedin. Her kod yalnızca bir kez kullanılabilir.
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {backupCodes.map((code) => (
            <code key={code} className="bg-white dark:bg-gray-800 border px-2 py-1 rounded text-sm font-mono">
              {code}
            </code>
          ))}
        </div>
        <button
          onClick={() => setStep("idle")}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        >
          Tamamlandı
        </button>
      </div>
    );
  }

  if (step === "setup") {
    return (
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-2">2FA Kurulumu</h3>
        <p className="text-sm text-gray-600 mb-3">
          Google Authenticator veya benzeri bir uygulama ile QR kodu tarayın.
        </p>
        {qrCode && (
          <img src={qrCode} alt="2FA QR Kodu" className="w-48 h-48 mb-4 border rounded" />
        )}
        <input
          type="text"
          placeholder="6 haneli kodu girin"
          value={token}
          onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="border rounded px-3 py-2 text-sm w-full mb-2"
          maxLength={6}
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleVerify}
            disabled={loading || token.length !== 6}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            {loading ? "Doğrulanıyor..." : "Doğrula"}
          </button>
          <button onClick={() => setStep("idle")} className="px-4 py-2 border rounded text-sm">
            İptal
          </button>
        </div>
      </div>
    );
  }

  if (step === "disable") {
    return (
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-2">2FA Devre Dışı Bırak</h3>
        <input
          type="password"
          placeholder="Şifrenizi girin"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-full mb-2"
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleDisable}
            disabled={loading || !password}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50"
          >
            {loading ? "İşleniyor..." : "Devre Dışı Bırak"}
          </button>
          <button onClick={() => setStep("idle")} className="px-4 py-2 border rounded text-sm">
            İptal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">İki Faktörlü Doğrulama (2FA)</h3>
          <p className="text-sm text-gray-500">
            {hasTwoFactor ? "2FA aktif — hesabınız korumalı" : "2FA pasif — hesabınızı koruyun"}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${hasTwoFactor ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
          {hasTwoFactor ? "Aktif" : "Pasif"}
        </span>
      </div>
      <div className="mt-3">
        {hasTwoFactor ? (
          <button
            onClick={() => setStep("disable")}
            className="px-4 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50 dark:bg-red-900/30 text-sm"
          >
            Devre Dışı Bırak
          </button>
        ) : (
          <button
            onClick={handleSetup}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            {loading ? "Hazırlanıyor..." : "2FA Aktif Et"}
          </button>
        )}
      </div>
    </div>
  );
}
