import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getStrategicInsights } from "@/lib/actions/superadmin.actions";

export const metadata = { title: "Stratejik İçgörüler | Super Admin" };

export default async function StrategicInsightsPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "growth";

  const data = await getStrategicInsights();
  if ("error" in data) return <div className="p-8 text-error font-mono">{data.error}</div>;

  const maxNewTenants = Math.max(...data.monthlyData.map((m) => m.newTenants), 1);

  const TABS = [
    { id: "growth", label: "Büyüme Analizi" },
    { id: "churn", label: "Churn Analizi" },
    { id: "top", label: "Top Tenantlar" },
  ];

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">insights</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">Stratejik İçgörüler</h2>
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
                : "px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface transition-colors border-b-2 border-transparent hover:bg-surface-container-low whitespace-nowrap"
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* KPI Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-primary">
            <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Aktif Abonelik</p>
            <p className="text-3xl font-black text-on-surface">{data.totalActive}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-error">
            <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Churn Oranı</p>
            <p className="text-3xl font-black text-error">%{data.churnRate}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-tertiary-fixed">
            <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Son 6 Ay Yeni Tenant</p>
            <p className="text-3xl font-black text-on-tertiary-fixed-variant">
              {data.monthlyData.reduce((s, m) => s + m.newTenants, 0)}
            </p>
          </div>
        </div>

        {/* Aylık Büyüme Grafiği */}
        <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-4">
          <h3 className="text-[9px] font-bold text-outline uppercase tracking-widest mb-4">Aylık Yeni Tenant Büyümesi</h3>
          <div className="flex items-end gap-3 h-36">
            {data.monthlyData.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-primary">{m.newTenants}</span>
                <div
                  className="w-full bg-primary rounded-t transition-all"
                  style={{ height: `${(m.newTenants / maxNewTenants) * 100}%`, minHeight: "4px" }}
                />
                <span className="text-[9px] text-outline font-medium">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Tenantlar Tablosu */}
        <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-outline/10">
            <h3 className="text-[9px] font-bold text-outline uppercase tracking-widest">En Aktif Tenantlar (Servis Emri)</h3>
          </div>
          <table className="dense-table w-full">
            <thead>
              <tr>
                <th>#</th>
                <th>Firma</th>
                <th className="text-right">Servis Emri</th>
              </tr>
            </thead>
            <tbody>
              {data.topTenants.map((t, i) => (
                <tr key={t.tenantId}>
                  <td>
                    <span className="w-5 h-5 rounded bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center">
                      {i + 1}
                    </span>
                  </td>
                  <td className="font-bold text-on-surface">{t.name}</td>
                  <td className="text-right font-mono font-bold text-on-surface-variant">{t.orderCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Churn Analizi Tablosu */}
        <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-outline/10">
            <h3 className="text-[9px] font-bold text-outline uppercase tracking-widest">Aylık Churn Analizi</h3>
          </div>
          <table className="dense-table w-full">
            <thead>
              <tr>
                <th>Dönem</th>
                <th className="text-right">Yeni Tenant</th>
                <th className="text-right">İptal</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyData.map((m) => (
                <tr key={m.label}>
                  <td className="font-medium text-on-surface">{m.label}</td>
                  <td className="text-right font-bold text-on-tertiary-fixed-variant">+{m.newTenants}</td>
                  <td className="text-right font-bold text-error">-{m.cancelledSubs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SuperAdminFooter />
    </>
  );
}
