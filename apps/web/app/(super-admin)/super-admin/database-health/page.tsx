import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getDatabaseHealthMetrics } from "@/lib/actions/superadmin.actions";

export const metadata = { title: "Veritabanı Sağlık Monitörü | Super Admin" };

const TABS = [
  { id: "overview", label: "Genel Bakış" },
  { id: "slow-queries", label: "Yavaş Sorgular" },
  { id: "pool", label: "Bağlantı Havuzu" },
];

const MOCK_LOGS = [
  { time: "14:32:01", level: "INFO", msg: "Connection pool initialized: 20 slots" },
  { time: "14:32:15", level: "INFO", msg: "Query executed: SELECT * FROM tenants (12ms)" },
  { time: "14:32:28", level: "WARN", msg: "Slow query detected: 1240ms on service_orders" },
  { time: "14:32:45", level: "INFO", msg: "Cache hit rate: 94.7%" },
  { time: "14:33:02", level: "ERROR", msg: "Lock wait timeout exceeded on subscriptions" },
  { time: "14:33:18", level: "INFO", msg: "Replication lag: 0ms (healthy)" },
  { time: "14:33:35", level: "WARN", msg: "Connection pool usage: 80% (16/20)" },
];

function levelBadge(level: string) {
  switch (level) {
    case "ERROR":
      return "bg-error-container text-on-error-container px-1.5 py-0.5 rounded text-[9px] font-bold";
    case "WARN":
      return "bg-secondary-container/20 text-secondary-container px-1.5 py-0.5 rounded text-[9px] font-bold";
    default:
      return "bg-tertiary-fixed text-on-tertiary-fixed px-1.5 py-0.5 rounded text-[9px] font-bold";
  }
}

function durationColor(ms: number) {
  if (ms > 1000) return "text-error font-bold";
  if (ms > 500) return "text-secondary-container font-semibold";
  return "text-on-surface";
}

function impactLabel(ms: number): { label: string; cls: string } {
  if (ms > 1000) return { label: "Yüksek", cls: "bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-bold" };
  if (ms > 500) return { label: "Orta", cls: "bg-secondary-container/20 text-secondary-container px-2 py-0.5 rounded text-[10px] font-bold" };
  return { label: "Düşük", cls: "bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold" };
}

export default async function DatabaseHealthPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "overview";

  const data = await getDatabaseHealthMetrics();
  if ("error" in data) return <div className="p-8 text-error font-mono">{data.error}</div>;

  const poolUsedPct = Math.round((data.connectionPool.active / data.connectionPool.max) * 100);

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">storage</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">Veritabanı Sağlık Monitörü</h2>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed rounded text-[10px] font-bold uppercase tracking-wider">
          Cluster: PR-DB-001
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
        {/* 4 Metrik Kartı */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-primary">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-lg">hub</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Bağlantı Havuzu</p>
            </div>
            <p className="text-2xl font-black text-on-surface">
              {data.connectionPool.active}
              <span className="text-sm font-normal text-outline">/{data.connectionPool.max}</span>
            </p>
            <p className="text-[10px] text-outline mt-1">Aktif/Maks</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-secondary">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-secondary text-lg">speed</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">TPS</p>
            </div>
            <p className="text-3xl font-black text-on-surface">{data.tps}</p>
            <p className="text-[10px] text-outline mt-1">İşlem/Saniye</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-secondary-container">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-secondary-container text-lg">lock</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Kilit Bekleme</p>
            </div>
            <p className="text-3xl font-black text-on-surface">
              {data.lockWaitTime}
              <span className="text-sm font-normal text-outline">ms</span>
            </p>
            <p className="text-[10px] text-outline mt-1">Ortalama</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-tertiary-fixed">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-on-tertiary-fixed-variant text-lg">cached</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Cache Hit Rate</p>
            </div>
            <p className="text-3xl font-black text-on-surface">
              {data.cacheHitRate}
              <span className="text-sm font-normal text-outline">%</span>
            </p>
            <p className="text-[10px] text-outline mt-1">Önbellek İsabeti</p>
          </div>
        </div>

        {/* Genel Bakış */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-base">monitor_heart</span>
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Veritabanı Durumu</h3>
                <span className="bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold ml-auto">
                  {data.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-surface-container rounded text-center">
                  <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Aktif</p>
                  <p className="text-lg font-black text-on-surface">{data.connectionPool.active}</p>
                </div>
                <div className="p-3 bg-surface-container rounded text-center">
                  <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Boşta</p>
                  <p className="text-lg font-black text-on-surface">{data.connectionPool.idle}</p>
                </div>
                <div className="p-3 bg-surface-container rounded text-center">
                  <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Maks</p>
                  <p className="text-lg font-black text-on-surface">{data.connectionPool.max}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-on-surface">Havuz Kullanımı</span>
                  <span className="text-xs font-bold text-primary">{poolUsedPct}%</span>
                </div>
                <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${poolUsedPct > 80 ? "bg-error" : poolUsedPct > 60 ? "bg-secondary-container" : "bg-primary"}`}
                    style={{ width: `${poolUsedPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Gerçek Zamanlı Event Stream */}
            <div className="bg-inverse-surface rounded shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-inverse-on-surface text-base">terminal</span>
                <h3 className="text-xs font-bold text-inverse-on-surface uppercase tracking-widest">Canlı DB Akışı</h3>
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-tertiary-fixed animate-pulse" />
              </div>
              <div className="p-3 space-y-1 font-mono text-[10px]">
                {MOCK_LOGS.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-inverse-on-surface/50 shrink-0">{log.time}</span>
                    <span className={levelBadge(log.level)}>{log.level}</span>
                    <span className="text-inverse-on-surface/80 break-all">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Yavaş Sorgular */}
        {tab === "slow-queries" && (
          <div className="space-y-4">
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-outline/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-container text-base">slow_motion_video</span>
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Yavaş Sorgular</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="dense-table w-full">
                  <thead>
                    <tr>
                      <th>Sorgu</th>
                      <th>Süre (ms)</th>
                      <th>Sayı</th>
                      <th>Etki</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.slowQueries.map((q, i) => {
                      const impact = impactLabel(q.duration);
                      return (
                        <tr key={i}>
                          <td className="font-mono text-[10px] max-w-xs truncate text-on-surface-variant">{q.query}</td>
                          <td className={`font-mono ${durationColor(q.duration)}`}>{q.duration}</td>
                          <td className="text-on-surface">{q.count}</td>
                          <td><span className={impact.cls}>{impact.label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Event Stream */}
            <div className="bg-inverse-surface rounded shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-inverse-on-surface text-base">terminal</span>
                <h3 className="text-xs font-bold text-inverse-on-surface uppercase tracking-widest">Sorgu Akışı</h3>
              </div>
              <div className="p-3 space-y-1 font-mono text-[10px]">
                {MOCK_LOGS.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-inverse-on-surface/50 shrink-0">{log.time}</span>
                    <span className={levelBadge(log.level)}>{log.level}</span>
                    <span className="text-inverse-on-surface/80 break-all">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bağlantı Havuzu */}
        {tab === "pool" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">hub</span>
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Bağlantı Havuzu Durumu</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-on-surface">Aktif Bağlantılar</span>
                    <span className="text-xs font-bold text-primary">{data.connectionPool.active} / {data.connectionPool.max}</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${poolUsedPct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-on-surface">Boşta Bağlantılar</span>
                    <span className="text-xs font-bold text-tertiary-fixed">{data.connectionPool.idle} / {data.connectionPool.max}</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-tertiary-fixed transition-all" style={{ width: `${Math.round((data.connectionPool.idle / data.connectionPool.max) * 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-on-surface">Kullanım Oranı</span>
                    <span className="text-xs font-bold text-on-surface">{poolUsedPct}%</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${poolUsedPct > 80 ? "bg-error" : poolUsedPct > 60 ? "bg-secondary-container" : "bg-primary"}`}
                      style={{ width: `${poolUsedPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Event Stream */}
            <div className="bg-inverse-surface rounded shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-inverse-on-surface text-base">terminal</span>
                <h3 className="text-xs font-bold text-inverse-on-surface uppercase tracking-widest">Bağlantı Akışı</h3>
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-tertiary-fixed animate-pulse" />
              </div>
              <div className="p-3 space-y-1 font-mono text-[10px]">
                {MOCK_LOGS.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-inverse-on-surface/50 shrink-0">{log.time}</span>
                    <span className={levelBadge(log.level)}>{log.level}</span>
                    <span className="text-inverse-on-surface/80 break-all">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <SuperAdminFooter />
    </>
  );
}
