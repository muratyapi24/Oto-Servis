import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getInfrastructureMap } from "@/lib/actions/superadmin.actions";

export const metadata = { title: "Altyapı Haritası | Super Admin" };

const TABS = [
  { id: "nodes", label: "Node Listesi" },
  { id: "topology", label: "Topoloji" },
  { id: "regions", label: "Bölgeler" },
];

function statusBadge(status: string) {
  switch (status) {
    case "ONLINE":
      return "bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold";
    case "DEGRADED":
      return "bg-secondary-container/20 text-secondary-container px-2 py-0.5 rounded text-[10px] font-bold";
    default:
      return "bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-bold";
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "ONLINE": return "check_circle";
    case "DEGRADED": return "warning";
    default: return "cancel";
  }
}

function statusIconColor(status: string) {
  switch (status) {
    case "ONLINE": return "text-on-tertiary-fixed-variant";
    case "DEGRADED": return "text-secondary-container";
    default: return "text-error";
  }
}

function cpuBarColor(value: number) {
  if (value > 80) return "bg-error";
  if (value > 60) return "bg-secondary-container";
  return "bg-primary";
}

export default async function InfrastructurePage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "nodes";

  const data = await getInfrastructureMap();
  if ("error" in data) return <div className="p-8 text-error font-mono">{data.error}</div>;

  const { nodes } = data;
  const onlineCount = nodes.filter((n) => n.status === "ONLINE").length;
  const issueCount = nodes.filter((n) => n.status !== "ONLINE").length;

  const regionMap = nodes.reduce<Record<string, typeof nodes>>((acc, n) => {
    if (!acc[n.region]) acc[n.region] = [];
    (acc[n.region] as typeof nodes).push(n);
    return acc;
  }, {});

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">hub</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">Altyapı Haritası</h2>
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
        {/* 3 Özet Kartı */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-lg">dns</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Toplam Node</p>
            </div>
            <p className="text-3xl font-black text-on-surface">{nodes.length}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-tertiary-fixed">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-on-tertiary-fixed-variant text-lg">check_circle</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Online</p>
            </div>
            <p className="text-3xl font-black text-on-tertiary-fixed-variant">{onlineCount}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-error">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-error text-lg">warning</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Sorunlu</p>
            </div>
            <p className="text-3xl font-black text-error">{issueCount}</p>
          </div>
        </div>

        {/* Node Listesi */}
        {tab === "nodes" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-outline/10 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">dns</span>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Node Listesi</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="dense-table w-full">
                <thead>
                  <tr>
                    <th>Node Adı</th>
                    <th>Tip</th>
                    <th>Bölge</th>
                    <th>CPU %</th>
                    <th>RAM %</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map((n) => (
                    <tr key={n.id}>
                      <td className="font-mono font-bold text-on-surface">{n.name}</td>
                      <td className="text-on-surface-variant text-[10px] uppercase">{n.type}</td>
                      <td className="font-mono text-[10px] text-outline">{n.region}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono ${n.cpu > 80 ? "text-error" : n.cpu > 60 ? "text-secondary-container" : "text-on-surface"}`}>
                            {n.cpu}
                          </span>
                          <div className="w-16 h-1.5 bg-surface-container rounded-full inline-block overflow-hidden">
                            <div
                              className={`h-full ${cpuBarColor(n.cpu)}`}
                              style={{ width: `${n.cpu}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono ${n.ram > 80 ? "text-error" : n.ram > 60 ? "text-secondary-container" : "text-on-surface"}`}>
                            {n.ram}
                          </span>
                          <div className="w-16 h-1.5 bg-surface-container rounded-full inline-block overflow-hidden">
                            <div
                              className={`h-full ${cpuBarColor(n.ram)}`}
                              style={{ width: `${n.ram}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={statusBadge(n.status)}>{n.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Topoloji */}
        {tab === "topology" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {nodes.map((n) => (
              <div key={n.id} className="bg-surface-container-lowest border border-outline/20 p-3 rounded shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`material-symbols-outlined text-base ${statusIconColor(n.status)}`}>
                    {statusIcon(n.status)}
                  </span>
                  <span className="text-xs font-bold text-on-surface truncate">{n.name}</span>
                </div>
                <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-2">{n.type}</p>
                <div className="space-y-1.5">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] text-outline">CPU</span>
                      <span className={`text-[9px] font-bold ${n.cpu > 80 ? "text-error" : "text-on-surface"}`}>{n.cpu}%</span>
                    </div>
                    <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                      <div className={`h-full ${cpuBarColor(n.cpu)}`} style={{ width: `${n.cpu}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] text-outline">RAM</span>
                      <span className={`text-[9px] font-bold ${n.ram > 80 ? "text-error" : "text-on-surface"}`}>{n.ram}%</span>
                    </div>
                    <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                      <div className={`h-full ${cpuBarColor(n.ram)}`} style={{ width: `${n.ram}%` }} />
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <span className={statusBadge(n.status)}>{n.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bölgeler */}
        {tab === "regions" && (
          <div className="space-y-4">
            {Object.entries(regionMap).map(([region, regionNodes]) => (
              <div key={region} className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-outline/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">location_on</span>
                    <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">{region}</h3>
                  </div>
                  <span className="text-[10px] text-outline">{regionNodes.length} node</span>
                </div>
                <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                  {regionNodes.map((n) => (
                    <div key={n.id} className="flex items-center gap-2 p-2 bg-surface-container rounded">
                      <span className={`material-symbols-outlined text-sm ${statusIconColor(n.status)}`}>
                        {statusIcon(n.status)}
                      </span>
                      <div>
                        <p className="text-[10px] font-bold text-on-surface">{n.name}</p>
                        <p className="text-[9px] text-outline">{n.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SuperAdminFooter />
    </>
  );
}
