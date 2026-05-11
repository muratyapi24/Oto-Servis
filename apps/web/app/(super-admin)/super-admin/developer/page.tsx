import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getAPIKeys, getAPIUsageStats } from "@/lib/actions/superadmin.actions";
import APIKeyActions from "./APIKeyActions";
import { MockPageGuard } from "@/components/super-admin/MockPageGuard";

export const metadata = { title: "Geliştirici API Portalı | Super Admin" };

const MOCK_DOCS = [
  { method: "GET", endpoint: "/api/service-orders", description: "Servis emirlerini listele" },
  { method: "POST", endpoint: "/api/service-orders", description: "Yeni servis emri oluştur" },
  { method: "GET", endpoint: "/api/customers", description: "Müşterileri listele" },
  { method: "POST", endpoint: "/api/customers", description: "Yeni müşteri oluştur" },
  { method: "GET", endpoint: "/api/invoices", description: "Faturaları listele" },
  { method: "POST", endpoint: "/api/invoices", description: "Fatura oluştur" },
];

export default async function DeveloperPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "keys";

  const [keysResult, statsResult] = await Promise.all([
    getAPIKeys(),
    getAPIUsageStats(),
  ]);

  if ("error" in keysResult) return <div className="p-8 text-error font-mono">{keysResult.error}</div>;
  if ("error" in statsResult) return <div className="p-8 text-error font-mono">{statsResult.error}</div>;

  const keys = keysResult.keys;
  const stats = statsResult;

  const TABS = [
    { id: "keys", label: "API Anahtarları" },
    { id: "usage", label: "Kullanım" },
    { id: "docs", label: "Dokümantasyon" },
  ];

  // Bar chart dimensions
  const maxCalls = Math.max(...stats.byEndpoint.map((e) => e.calls));
  const barW = 40;
  const barGap = 10;
  const chartH = 80;
  const svgW = stats.byEndpoint.length * (barW + barGap);

  return (
    <MockPageGuard title="Geliştirici API Portalı" description="API dokümantasyonu ve anahtar yönetimi yakında gerçek veriye bağlanacaktır.">
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">terminal</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">Geliştirici API Portalı</h2>
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
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-primary">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-lg">vpn_key</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Aktif Anahtar</p>
            </div>
            <p className="text-3xl font-black text-on-surface">
              {keys.filter((k) => k.isActive).length}
            </p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-secondary">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-secondary text-lg">call_made</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Toplam Çağrı</p>
            </div>
            <p className="text-3xl font-black text-on-surface">
              {stats.totalCalls.toLocaleString("tr-TR")}
            </p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-tertiary-fixed">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-on-tertiary-fixed-variant text-lg">verified</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Başarı Oranı</p>
            </div>
            <p className="text-3xl font-black text-on-surface">{stats.successRate}%</p>
          </div>
        </div>

        {/* API Anahtarları Tab */}
        {tab === "keys" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="dense-table w-full">
                <thead>
                  <tr>
                    <th>Ad</th>
                    <th>Anahtar</th>
                    <th>Oluşturulma</th>
                    <th>Son Kullanım</th>
                    <th>Durum</th>
                    <th>Eylemler</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => (
                    <tr key={k.id}>
                      <td className="font-bold text-on-surface">{k.name}</td>
                      <td className="font-mono text-[10px] text-outline">{k.key}</td>
                      <td className="text-outline font-mono text-[10px]">
                        {new Date(k.createdAt).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="text-outline font-mono text-[10px]">
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString("tr-TR") : "—"}
                      </td>
                      <td>
                        <span className={
                          k.isActive
                            ? "bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold"
                            : "bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-bold"
                        }>
                          {k.isActive ? "AKTİF" : "PASİF"}
                        </span>
                      </td>
                      <td>
                        <APIKeyActions keyId={k.id} isActive={k.isActive} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Kullanım Tab */}
        {tab === "usage" && (
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-4">Endpoint Bazlı Çağrı Sayıları</h3>
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgW} ${chartH + 40}`}
                className="w-full"
                style={{ minWidth: `${svgW}px`, height: `${chartH + 40}px` }}
              >
                {stats.byEndpoint.map((e, i) => {
                  const barHeight = Math.round((e.calls / maxCalls) * chartH);
                  const x = i * (barW + barGap);
                  const y = chartH - barHeight;
                  return (
                    <g key={i}>
                      <rect x={x} y={y} width={barW} height={barHeight} className="fill-primary/70" rx="2" />
                      <text
                        x={x + barW / 2}
                        y={chartH + 12}
                        textAnchor="middle"
                        fontSize="7"
                        className="fill-outline"
                      >
                        {e.endpoint.replace("/api/", "").substring(0, 8)}
                      </text>
                      <text
                        x={x + barW / 2}
                        y={y - 3}
                        textAnchor="middle"
                        fontSize="7"
                        className="fill-on-surface font-bold"
                      >
                        {(e.calls / 1000).toFixed(1)}k
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {/* Dokümantasyon Tab */}
        {tab === "docs" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-outline/10">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">API Endpoint Listesi</h3>
            </div>
            <div className="divide-y divide-outline/10">
              {MOCK_DOCS.map((doc, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-4">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded font-mono ${
                    doc.method === "GET"
                      ? "bg-tertiary-fixed text-on-tertiary-fixed"
                      : "bg-primary text-white"
                  }`}>
                    {doc.method}
                  </span>
                  <span className="font-mono text-[11px] text-on-surface">{doc.endpoint}</span>
                  <span className="text-[11px] text-outline">{doc.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <SuperAdminFooter />
    </>
    </MockPageGuard>
  );
}
