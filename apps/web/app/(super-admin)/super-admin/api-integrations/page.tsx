import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getAPIIntegrations, getAPIUsageStats } from "@/lib/actions/superadmin.actions";

export const metadata = { title: "API ve Entegrasyon Yönetimi | Super Admin" };

export default async function APIIntegrationsPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "integrations";

  const [integrationsResult, statsResult] = await Promise.all([
    getAPIIntegrations(),
    getAPIUsageStats(),
  ]);

  if ("error" in integrationsResult) return <div className="p-8 text-error font-mono">{integrationsResult.error}</div>;
  if ("error" in statsResult) return <div className="p-8 text-error font-mono">{statsResult.error}</div>;

  const integrations = integrationsResult.integrations;
  const stats = statsResult;

  const TABS = [
    { id: "integrations", label: "Entegrasyonlar" },
    { id: "usage", label: "Kullanım İstatistikleri" },
    { id: "webhooks", label: "Webhook'lar" },
  ];

  const statusBadge = (status: string) => {
    if (status === "ACTIVE") return "bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold";
    if (status === "ERROR") return "bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-bold";
    return "bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-bold";
  };

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">api</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">API ve Entegrasyon Yönetimi</h2>
        </div>
      </header>

      <div className="bg-white border-b border-outline/20 px-6 flex items-center shrink-0 gap-1 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`?tab=${t.id}`}
            className={
              tab === t.id
                ? "px-4 py-2 text-xs font-bold border-b-2 border-primary text-primary bg-primary/5 whitespace-nowrap"
                : "px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface border-b-2 border-transparent whitespace-nowrap"
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Özet Kartları */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-tertiary-fixed">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-on-tertiary-fixed-variant text-lg">check_circle</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Aktif</p>
            </div>
            <p className="text-3xl font-black text-on-surface">
              {integrations.filter((i) => i.status === "ACTIVE").length}
            </p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-error">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-error text-lg">error</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Hata</p>
            </div>
            <p className="text-3xl font-black text-on-surface">
              {integrations.filter((i) => i.status === "ERROR").length}
            </p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-primary">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-lg">call_made</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Toplam Çağrı</p>
            </div>
            <p className="text-3xl font-black text-on-surface">
              {stats.totalCalls.toLocaleString("tr-TR")}
            </p>
          </div>
        </div>

        {/* Entegrasyonlar Tab */}
        {tab === "integrations" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="dense-table w-full">
                <thead>
                  <tr>
                    <th>Entegrasyon</th>
                    <th>Durum</th>
                    <th>Son Çağrı</th>
                    <th>Başarı Oranı</th>
                    <th>Çağrı Sayısı</th>
                    <th>Eylemler</th>
                  </tr>
                </thead>
                <tbody>
                  {integrations.map((i) => (
                    <tr key={i.id}>
                      <td className="font-bold text-on-surface">{i.name}</td>
                      <td>
                        <span className={statusBadge(i.status)}>{i.status}</span>
                      </td>
                      <td className="text-outline font-mono text-[10px]">
                        {i.lastCallAt ? new Date(i.lastCallAt).toLocaleString("tr-TR") : "—"}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-on-surface">{i.successRate}%</span>
                          <div className="w-16 h-1.5 bg-outline/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-tertiary-fixed rounded-full"
                              style={{ width: `${i.successRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="font-bold text-on-surface">{i.callCount.toLocaleString("tr-TR")}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button className="text-[10px] font-bold text-primary hover:underline">DETAY</button>
                          <button className="text-[10px] font-bold text-outline hover:underline">DEVRE DIŞI</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Kullanım İstatistikleri Tab */}
        {tab === "usage" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm">
                <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Toplam Çağrı</p>
                <p className="text-2xl font-black text-on-surface">{stats.totalCalls.toLocaleString("tr-TR")}</p>
              </div>
              <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm">
                <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Başarı Oranı</p>
                <p className="text-2xl font-black text-on-surface">{stats.successRate}%</p>
              </div>
              <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm">
                <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Ort. Gecikme</p>
                <p className="text-2xl font-black text-on-surface">{stats.avgLatency}ms</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-outline/10">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Endpoint Bazlı Kullanım</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="dense-table w-full">
                  <thead>
                    <tr>
                      <th>Endpoint</th>
                      <th>Çağrı Sayısı</th>
                      <th>Oran %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byEndpoint.map((e, i) => (
                      <tr key={i}>
                        <td className="font-mono text-[10px] text-on-surface">{e.endpoint}</td>
                        <td className="font-bold text-on-surface">{e.calls.toLocaleString("tr-TR")}</td>
                        <td className="text-outline text-[10px]">
                          {((e.calls / stats.totalCalls) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Webhook'lar Tab */}
        {tab === "webhooks" && (
          <div className="bg-surface-container-lowest border border-outline/20 p-12 rounded shadow-sm flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-outline text-5xl">webhook</span>
            <p className="text-sm font-bold text-outline uppercase tracking-widest">Yakında</p>
            <p className="text-xs text-outline/70">Webhook yönetimi özelliği geliştirme aşamasındadır.</p>
          </div>
        )}
      </div>

      <SuperAdminFooter />
    </>
  );
}
