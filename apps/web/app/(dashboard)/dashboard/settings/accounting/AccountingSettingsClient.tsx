"use client";

import { useState } from "react";
import { Save, Link as LinkIcon, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { saveAccountingIntegration, testAccountingConnection } from "@/lib/actions/accounting.actions";

export default function AccountingSettingsClient({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success?: string; error?: string } | null>(null);

  const [formData, setFormData] = useState({
    provider: initialData?.provider ?? "PARASUT",
    clientId: initialData?.clientId ?? "",
    clientSecret: initialData?.clientSecret ?? "",
    username: initialData?.username ?? "",
    password: "", // Güvenlik sebebiyle her zaman boş gelsin
    companyId: initialData?.companyId ?? "",
    isActive: initialData?.isActive ?? false,
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await saveAccountingIntegration(formData);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(res.success ?? "Kaydedildi");
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const res = await testAccountingConnection();
    setTesting(false);
    setTestResult(res);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 border-b bg-gray-50 flex items-center gap-2">
        <LinkIcon className="w-5 h-5 text-blue-600" />
        <h3 className="font-bold text-gray-800">Paraşüt Bağlantısı</h3>
      </div>
      
      <div className="p-5">
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm border border-red-100"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 text-sm border border-green-100"><CheckCircle2 className="w-4 h-4 shrink-0" />{success}</div>}
        
        {testResult && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm border ${testResult.error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
            {testResult.error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {testResult.error || testResult.success}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <input 
              type="checkbox" 
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({...prev, isActive: e.target.checked}))}
              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="font-bold text-gray-800 cursor-pointer">
              Muhasebe Entegrasyonunu Aktifleştir (Fatura kesildiğinde otomatik gönderim)
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Şirket ID (Company ID)</label>
              <input 
                type="text" 
                value={formData.companyId}
                onChange={(e) => setFormData(prev => ({...prev, companyId: e.target.value}))}
                required
                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Örn: 123456"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Müşteri ID (Client ID)</label>
              <input 
                type="text" 
                value={formData.clientId}
                onChange={(e) => setFormData(prev => ({...prev, clientId: e.target.value}))}
                required
                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Müşteri Sırrı (Client Secret)</label>
              <input 
                type="password" 
                value={formData.clientSecret}
                onChange={(e) => setFormData(prev => ({...prev, clientSecret: e.target.value}))}
                required
                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Kullanıcı E-posta (Username)</label>
              <input 
                type="email" 
                value={formData.username}
                onChange={(e) => setFormData(prev => ({...prev, username: e.target.value}))}
                required
                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="ornek@firma.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Paraşüt Şifresi</label>
              <input 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                required={!initialData} // Eğer kayıt yoksa zorunlu
                placeholder={initialData ? "Değiştirmek istemiyorsanız boş bırakın" : "Şifrenizi Girin"}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !initialData} // Sadece kaydedilmiş verilerle test edilebilir
              className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {testing ? "Test Ediliyor..." : "Bağlantı Testi"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-70 shadow-sm w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              {loading ? "Kaydediliyor..." : "Ayarları Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
