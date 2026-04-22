"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { RefreshCw, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { testParasutConnection } from "@/lib/actions/parasut.actions";

export default function ParasutSettingsClient({ integration, logs }: { integration: any; logs: any[] }) {
  const router = useRouter();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ connected: boolean; message?: string } | null>(null);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testParasutConnection();
      if (result.success && result.data) {
        setTestResult({ connected: result.data.connected });
      } else {
        setTestResult({ connected: false, message: result.error });
      }
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bağlantı Durumu */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-black text-slate-900 mb-4">Bağlantı Durumu</h3>
        {integration ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${integration.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
              <span className="text-sm font-bold text-slate-700">
                {integration.isActive ? "Aktif" : "Pasif"}
              </span>
            </div>
            <p className="text-sm text-slate-600">Kullanıcı: {integration.username}</p>
            <p className="text-sm text-slate-600">Şirket ID: {integration.companyId}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Paraşüt entegrasyonu henüz yapılandırılmamış.</p>
        )}

        {testResult && (
          <div className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${testResult.connected ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {testResult.connected ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {testResult.connected ? "Bağlantı başarılı!" : testResult.message ?? "Bağlantı başarısız."}
          </div>
        )}

        <button
          onClick={handleTest}
          disabled={isTesting || !integration}
          className="mt-4 flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-black transition-colors disabled:opacity-50"
        >
          {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Bağlantıyı Test Et
        </button>
      </div>

      {/* Senkronizasyon Logları */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-black text-slate-900">Son Senkronizasyon Logları</h3>
        </div>
        {logs.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">Henüz senkronizasyon logu yok.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="px-6 py-3 flex items-center gap-4">
                <span className={`w-2 h-2 rounded-full shrink-0 ${log.status === "SUCCESS" ? "bg-emerald-500" : "bg-red-500"}`} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{log.operation}</p>
                  {log.invoice && <p className="text-xs text-slate-400">Fatura: {log.invoice.invoiceNumber}</p>}
                  {log.errorMessage && <p className="text-xs text-red-500">{log.errorMessage}</p>}
                </div>
                <span className="text-xs text-slate-400 shrink-0">{dayjs(log.attemptedAt).format("DD MMM HH:mm")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
