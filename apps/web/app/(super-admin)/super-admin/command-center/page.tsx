import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getCommandCenterData } from "@/lib/actions/superadmin.actions";
import dayjs from "dayjs";
import "dayjs/locale/tr";

export const metadata = { title: "Komuta Merkezi | Super Admin" };

export default async function CommandCenterPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "overview";

  const data = await getCommandCenterData();
  if ("error" in data) return <div className="p-8 text-error font-mono">{data.error}</div>;

  const TABS = [
    { id: "overview", label: "Genel Bakış" },
    { id: "errors", label: "Sistem Hataları" },
    { id: "expiring", label: "Süresi Dolan Abonelikler" },
  ];

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">radar</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">Komuta Merkezi</h2>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed rounded border border-tertiary-container/30 text-[10px] font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-fixed-variant animate-pulse"></span>
          Çalışma: 99.99%
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-b-2 border-b-primary">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-lg">corporate_fare</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Aktif Tenant</p>
            </div>
            <p className="text-3xl font-black text-on-surface">{data.activeTenantCount}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-b-2 border-b-primary">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-lg">group</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Toplam Kullanıcı</p>
            </div>
            <p className="text-3xl font-black text-on-surface">{data.totalUsers}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-b-2 border-b-primary">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-lg">hub</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Aktif Servis</p>
            </div>
            <p className="text-3xl font-black text-on-surface">{data.activeServiceOrders}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-b-2 border-b-error">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-error text-lg">warning</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Son 24s Hata</p>
            </div>
            <p className="text-3xl font-black text-error">{data.recentErrors.length}</p>
          </div>
        </div>

        {/* Ana İçerik Grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Sol: Sistem Hataları Tablosu */}
          <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-outline/10 flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-base">error</span>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Son 24 Saat — Sistem Hataları</h3>
            </div>
            {data.recentErrors.length === 0 ? (
              <div className="p-8 text-center text-outline text-sm">Hata kaydı bulunmuyor.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="dense-table w-full">
                  <thead>
                    <tr>
                      <th>Modül</th>
                      <th>Mesaj</th>
                      <th>Durum</th>
                      <th>Saat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentErrors.map((e) => (
                      <tr key={e.id}>
                        <td>
                          <span className="font-mono text-[10px] font-bold text-on-surface">{e.module}</span>
                        </td>
                        <td className="max-w-xs truncate text-on-surface-variant">{e.message}</td>
                        <td>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-error-container text-on-error-container">
                            CRITICAL
                          </span>
                        </td>
                        <td className="text-outline font-mono">
                          {dayjs(e.createdAt).locale("tr").format("HH:mm")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sağ: Süresi Dolan Abonelikler */}
          <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-outline/10 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-base">schedule</span>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Süresi Dolan Abonelikler</h3>
            </div>
            {data.expiringSubscriptions.length === 0 ? (
              <div className="p-6 text-center text-outline text-xs">Yakında sona erecek abonelik yok.</div>
            ) : (
              <div className="divide-y divide-outline/10">
                {data.expiringSubscriptions.map((s) => {
                  const daysLeft = s.currentPeriodEnd
                    ? dayjs(s.currentPeriodEnd).diff(dayjs(), "day")
                    : null;
                  const isUrgent = daysLeft !== null && daysLeft <= 3;
                  return (
                    <div
                      key={s.id}
                      className={`px-4 py-3 border-l-4 ${isUrgent ? "border-l-error" : "border-l-secondary"}`}
                    >
                      <p className="text-xs font-bold text-on-surface">{s.planName}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-outline">
                          {s.currentPeriodEnd
                            ? dayjs(s.currentPeriodEnd).locale("tr").format("DD MMM YYYY")
                            : "—"}
                        </span>
                        {daysLeft !== null && (
                          <span className={`text-[10px] font-bold ${isUrgent ? "text-error" : "text-secondary"}`}>
                            {daysLeft} gün
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <SuperAdminFooter />
    </>
  );
}
