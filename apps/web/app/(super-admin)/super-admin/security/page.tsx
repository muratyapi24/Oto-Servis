import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getSecurityThreats, getSecurityAlerts } from "@/lib/actions/superadmin.actions";

export const metadata = { title: "Güvenlik Tehdit İzleme | Super Admin" };

const TABS = [
  { id: "threats", label: "Tehdit Logu" },
  { id: "alarmlar", label: "Alarmlar" },
  { id: "geo", label: "Coğrafi Dağılım" },
];

function threatLevelBadge(level: string) {
  switch (level) {
    case "CRITICAL":
      return "bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-bold";
    case "HIGH":
      return "bg-secondary-container/50 text-secondary-container px-2 py-0.5 rounded text-[10px] font-bold";
    case "MEDIUM":
      return "bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-bold";
    default:
      return "bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded text-[10px] font-bold";
  }
}

function severityBadge(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return "bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-bold";
    case "HIGH":
      return "bg-secondary-container/20 text-secondary-container px-2 py-0.5 rounded text-[10px] font-bold";
    case "MEDIUM":
      return "bg-secondary-container/20 text-secondary-container px-2 py-0.5 rounded text-[10px] font-bold";
    default:
      return "bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold";
  }
}

const GEO_COUNTRIES = [
  { name: "Rusya", pct: 38, color: "bg-error" },
  { name: "Çin", pct: 27, color: "bg-secondary-container" },
  { name: "ABD", pct: 15, color: "bg-primary" },
  { name: "Hollanda", pct: 12, color: "bg-tertiary-fixed" },
  { name: "Almanya", pct: 8, color: "bg-outline" },
];

const HEALTH_NODES = [
  { label: "ENC Engine", pct: 98, color: "bg-tertiary-fixed" },
  { label: "Auth Nodes", pct: 100, color: "bg-tertiary-fixed" },
  { label: "Audit Pool", pct: 74, color: "bg-secondary-container" },
];

export default async function SecurityPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "threats";

  const [threatsResult, alertsResult] = await Promise.all([
    getSecurityThreats(),
    getSecurityAlerts(),
  ]);

  if ("error" in threatsResult) {
    return <div className="p-8 text-error font-mono">{threatsResult.error}</div>;
  }
  if ("error" in alertsResult) {
    return <div className="p-8 text-error font-mono">{alertsResult.error}</div>;
  }

  const { threats } = threatsResult;
  const { alerts } = alertsResult;

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">security</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">Güvenlik Tehdit İzleme</h2>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-error text-white rounded text-[10px] font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
          CANLI İZLEME
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
              <span className="material-symbols-outlined text-primary text-lg">security</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Aktif Güvenlik Duvarı</p>
            </div>
            <p className="text-3xl font-black text-on-surface">42</p>
            <p className="text-[10px] text-outline mt-1">Nominal</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-error">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-error text-lg">block</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Engellenen IP (24s)</p>
            </div>
            <p className="text-3xl font-black text-error">1,894</p>
            <p className="text-[10px] text-outline mt-1">+12% ort.</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-secondary">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-secondary text-lg">verified_user</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">SSL Sertifikaları</p>
            </div>
            <p className="text-xl font-black text-on-surface">Geçerli</p>
            <p className="text-[10px] text-outline mt-1">218 Node</p>
          </div>
          <div className="bg-primary text-white p-4 rounded shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-white text-lg">warning</span>
              <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest">Tehdit Seviyesi</p>
            </div>
            <p className="text-xl font-black text-white">ORTA</p>
            <p className="text-[10px] text-white/70 mt-1">APAC bölgesi</p>
          </div>
        </div>

        {/* Tehdit Logu Tab */}
        {tab === "threats" && (
          <div className="grid grid-cols-12 gap-4">
            {/* Sol: Tehdit Tablosu */}
            <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-outline/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-base">gpp_bad</span>
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Tehdit Logu</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="dense-table w-full">
                  <thead>
                    <tr>
                      <th>Zaman</th>
                      <th>Kaynak IP</th>
                      <th>Konum</th>
                      <th>Tehdit Seviyesi</th>
                      <th>Aksiyon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {threats.map((t) => (
                      <tr key={t.id}>
                        <td className="font-mono text-[10px] text-outline whitespace-nowrap">
                          {new Date(t.timestamp).toLocaleString("tr-TR")}
                        </td>
                        <td className="font-mono font-bold text-on-surface">{t.sourceIp}</td>
                        <td className="text-on-surface-variant">{t.location}</td>
                        <td>
                          <span className={threatLevelBadge(t.threatLevel)}>{t.threatLevel}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <button className="text-[10px] font-bold text-primary hover:underline">ENGELLE</button>
                            <button className="text-[10px] font-bold text-outline hover:underline">İZLE</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sağ: Coğrafi Dağılım Widget */}
            <div className="col-span-12 lg:col-span-4 space-y-3">
              <div className="bg-inverse-surface rounded shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10">
                  <h3 className="text-xs font-bold text-inverse-on-surface uppercase tracking-widest">Küresel Saldırı Vektörleri</h3>
                </div>
                {/* Harita Placeholder */}
                <div className="p-4">
                  <div className="w-full h-24 bg-white/5 rounded flex items-center justify-center mb-4">
                    <svg viewBox="0 0 200 100" className="w-full h-full opacity-40">
                      <ellipse cx="100" cy="50" rx="90" ry="45" fill="none" stroke="#6ffbbe" strokeWidth="0.5" />
                      <line x1="10" y1="50" x2="190" y2="50" stroke="#6ffbbe" strokeWidth="0.3" />
                      <line x1="100" y1="5" x2="100" y2="95" stroke="#6ffbbe" strokeWidth="0.3" />
                      {/* Saldırı noktaları */}
                      <circle cx="145" cy="30" r="3" fill="#ff4444" opacity="0.8" />
                      <circle cx="160" cy="35" r="2" fill="#ff4444" opacity="0.6" />
                      <circle cx="55" cy="45" r="2.5" fill="#ff8800" opacity="0.7" />
                      <circle cx="80" cy="40" r="2" fill="#ff4444" opacity="0.5" />
                    </svg>
                  </div>
                  {/* Ülke Listesi */}
                  <div className="space-y-2">
                    {GEO_COUNTRIES.map((c) => (
                      <div key={c.name}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] text-inverse-on-surface/80">{c.name}</span>
                          <span className="text-[10px] font-bold text-inverse-on-surface">{c.pct}%</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full ${c.color} opacity-80`} style={{ width: `${c.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sistem Sağlığı */}
              <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-4">
                <h3 className="text-[9px] font-bold text-outline uppercase tracking-widest mb-3">Sistem Sağlığı</h3>
                <div className="space-y-3">
                  {HEALTH_NODES.map((n) => (
                    <div key={n.label} className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 ${n.color}`}
                      >
                        {n.pct}
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-semibold text-on-surface">{n.label}</p>
                        <div className="h-1 bg-surface-container rounded-full overflow-hidden mt-0.5">
                          <div className={`h-full ${n.color}`} style={{ width: `${n.pct}%` }} />
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-on-surface">{n.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alarmlar Tab */}
        {tab === "alarmlar" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1 mb-3">
              <span className="material-symbols-outlined text-error text-base">notifications_active</span>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Aktif Alarmlar</h3>
              <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-bold ml-auto">
                {alerts.length} Alarm
              </span>
            </div>
            {alerts.map((a) => (
              <div
                key={a.id}
                className={`bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 ${
                  a.severity === "CRITICAL" || a.severity === "HIGH"
                    ? "border-l-error"
                    : "border-l-secondary-container"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] font-bold text-outline uppercase">{a.type}</span>
                      <span className={severityBadge(a.severity)}>{a.severity}</span>
                    </div>
                    <p className="text-xs text-on-surface">{a.message}</p>
                  </div>
                  <span className="text-[10px] text-outline font-mono whitespace-nowrap">
                    {new Date(a.timestamp).toLocaleString("tr-TR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Coğrafi Dağılım Tab */}
        {tab === "geo" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-inverse-surface rounded shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <h3 className="text-xs font-bold text-inverse-on-surface uppercase tracking-widest">Küresel Saldırı Haritası</h3>
              </div>
              <div className="p-6">
                <div className="w-full h-40 bg-white/5 rounded flex items-center justify-center mb-4">
                  <svg viewBox="0 0 300 150" className="w-full h-full opacity-50">
                    <ellipse cx="150" cy="75" rx="140" ry="70" fill="none" stroke="#6ffbbe" strokeWidth="0.5" />
                    <line x1="10" y1="75" x2="290" y2="75" stroke="#6ffbbe" strokeWidth="0.3" />
                    <line x1="150" y1="5" x2="150" y2="145" stroke="#6ffbbe" strokeWidth="0.3" />
                    <ellipse cx="150" cy="75" rx="100" ry="50" fill="none" stroke="#6ffbbe" strokeWidth="0.3" strokeDasharray="2,2" />
                    <ellipse cx="150" cy="75" rx="60" ry="30" fill="none" stroke="#6ffbbe" strokeWidth="0.3" strokeDasharray="2,2" />
                    {/* Saldırı noktaları */}
                    <circle cx="210" cy="45" r="4" fill="#ff4444" opacity="0.9" />
                    <circle cx="230" cy="55" r="3" fill="#ff4444" opacity="0.7" />
                    <circle cx="240" cy="50" r="2" fill="#ff8800" opacity="0.6" />
                    <circle cx="80" cy="60" r="3.5" fill="#ff8800" opacity="0.8" />
                    <circle cx="120" cy="55" r="2.5" fill="#ff4444" opacity="0.5" />
                    <circle cx="170" cy="70" r="2" fill="#ffcc00" opacity="0.6" />
                  </svg>
                </div>
                <div className="space-y-2">
                  {GEO_COUNTRIES.map((c) => (
                    <div key={c.name} className="flex items-center gap-3">
                      <span className="text-[10px] text-inverse-on-surface/80 w-20 shrink-0">{c.name}</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${c.color} opacity-80`} style={{ width: `${c.pct}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-inverse-on-surface w-8 text-right">{c.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-4">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-3">Saldırı Tipi Dağılımı</h3>
                <div className="space-y-2">
                  {[
                    { type: "Brute Force", count: 842, pct: 44 },
                    { type: "SQL Injection", count: 421, pct: 22 },
                    { type: "DDoS", count: 312, pct: 16 },
                    { type: "Port Scan", count: 198, pct: 10 },
                    { type: "Diğer", count: 121, pct: 8 },
                  ].map((item) => (
                    <div key={item.type}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] text-on-surface-variant">{item.type}</span>
                        <span className="text-[10px] font-bold text-on-surface">{item.count}</span>
                      </div>
                      <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-4">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-3">Sistem Sağlığı</h3>
                <div className="space-y-3">
                  {HEALTH_NODES.map((n) => (
                    <div key={n.label} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 ${n.color}`}>
                        {n.pct}
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-semibold text-on-surface">{n.label}</p>
                        <div className="h-1 bg-surface-container rounded-full overflow-hidden mt-0.5">
                          <div className={`h-full ${n.color}`} style={{ width: `${n.pct}%` }} />
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-on-surface">{n.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <SuperAdminFooter />
    </>
  );
}
