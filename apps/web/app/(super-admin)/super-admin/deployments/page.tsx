import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getDeploymentHistory, getDeploymentStatus } from "@/lib/actions/superadmin.actions";

export const metadata = { title: "Dağıtım ve Güncelleme Yönetimi | Super Admin" };

const TABS = [
  { id: "history", label: "Dağıtım Geçmişi" },
  { id: "active", label: "Aktif Durum" },
  { id: "rollback", label: "Rollback" },
];

function deployStatusBadge(status: string) {
  switch (status) {
    case "SUCCESS":
      return "bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold";
    case "FAILED":
      return "bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-bold";
    case "ROLLBACK":
      return "bg-secondary-container/20 text-secondary-container px-2 py-0.5 rounded text-[10px] font-bold";
    case "IN_PROGRESS":
      return "bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold";
    default:
      return "border border-outline/30 text-outline px-2 py-0.5 rounded text-[10px] font-bold";
  }
}

function systemStatusBadge(status: string) {
  switch (status) {
    case "STABLE":
      return "bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold";
    case "DEPLOYING":
      return "bg-secondary-container/20 text-secondary-container px-2 py-0.5 rounded text-[10px] font-bold";
    case "FAILED":
      return "bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-bold";
    default:
      return "border border-outline/30 text-outline px-2 py-0.5 rounded text-[10px] font-bold";
  }
}

export default async function DeploymentsPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "history";

  const [data, statusData] = await Promise.all([
    getDeploymentHistory(),
    getDeploymentStatus(),
  ]);

  if ("error" in data) {
    return <div className="p-8 text-error font-mono">{data.error}</div>;
  }
  if ("error" in statusData) {
    return <div className="p-8 text-error font-mono">{statusData.error}</div>;
  }

  const { deployments } = data;
  const successCount = deployments.filter((d) => d.status === "SUCCESS").length;
  const failedCount = deployments.filter((d) => d.status === "FAILED").length;
  const rollbackCount = deployments.filter((d) => d.status === "ROLLBACK").length;
  const rollbackCandidates = deployments.filter((d) => d.status === "SUCCESS");

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">rocket_launch</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">Dağıtım ve Güncelleme Yönetimi</h2>
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
        {/* Aktif Durum Banner */}
        <div className="bg-tertiary-fixed/20 border border-tertiary-fixed/30 rounded p-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-tertiary-fixed-variant text-base">rocket_launch</span>
            <span className="text-xs font-bold text-on-surface">Mevcut Sürüm:</span>
            <span className="font-mono font-black text-on-surface text-sm">{statusData.current}</span>
          </div>
          <span className={systemStatusBadge(statusData.status)}>{statusData.status}</span>
          <span className="text-[10px] text-outline ml-auto">
            Son dağıtım: {new Date(statusData.lastDeployedAt).toLocaleString("tr-TR")}
          </span>
        </div>

        {/* 3 Özet Kartı */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-tertiary-fixed">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-on-tertiary-fixed-variant text-lg">check_circle</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Başarılı</p>
            </div>
            <p className="text-3xl font-black text-on-surface">{successCount}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-error">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-error text-lg">error</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Başarısız</p>
            </div>
            <p className="text-3xl font-black text-error">{failedCount}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-secondary-container">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-secondary-container text-lg">undo</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Rollback</p>
            </div>
            <p className="text-3xl font-black text-secondary-container">{rollbackCount}</p>
          </div>
        </div>

        {/* Dağıtım Geçmişi */}
        {tab === "history" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-outline/10 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">history</span>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Dağıtım Geçmişi</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="dense-table w-full">
                <thead>
                  <tr>
                    <th>Sürüm</th>
                    <th>Durum</th>
                    <th>Tarih</th>
                    <th>Dağıtan</th>
                    <th>Notlar</th>
                    <th>Eylemler</th>
                  </tr>
                </thead>
                <tbody>
                  {deployments.map((d) => (
                    <tr key={d.id}>
                      <td className="font-mono font-bold text-on-surface">{d.version}</td>
                      <td>
                        <span className={deployStatusBadge(d.status)}>{d.status}</span>
                      </td>
                      <td className="font-mono text-[10px] text-outline whitespace-nowrap">
                        {new Date(d.deployedAt).toLocaleString("tr-TR")}
                      </td>
                      <td className="text-on-surface-variant text-[10px]">{d.deployedBy}</td>
                      <td className="text-on-surface-variant max-w-xs truncate">{d.notes}</td>
                      <td>
                        {d.status === "SUCCESS" && (
                          <button className="text-[10px] font-bold text-error hover:underline">
                            ROLLBACK
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Aktif Durum */}
        {tab === "active" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-base">rocket_launch</span>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Aktif Dağıtım Durumu</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-surface-container rounded">
                <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-2">Çalışan Sürüm</p>
                <p className="text-2xl font-black text-on-surface font-mono">{statusData.current}</p>
                <span className={`mt-2 inline-block ${systemStatusBadge(statusData.status)}`}>{statusData.status}</span>
              </div>
              <div className="p-4 bg-surface-container rounded">
                <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-2">Son Dağıtım</p>
                <p className="text-sm font-bold text-on-surface">{new Date(statusData.lastDeployedAt).toLocaleString("tr-TR")}</p>
                <p className="text-[10px] text-outline mt-1">
                  {deployments[0]?.deployedBy ?? "—"}
                </p>
              </div>
            </div>
            {deployments[0] && (
              <div className="mt-4 p-3 bg-surface-container rounded border-l-2 border-l-primary">
                <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Son Dağıtım Notu</p>
                <p className="text-xs text-on-surface">{deployments[0].notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Rollback */}
        {tab === "rollback" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-secondary-container text-base">undo</span>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Rollback Seçenekleri</h3>
            </div>
            <p className="text-xs text-outline mb-4">
              Rollback işlemi mevcut sürümü geri alır. Bu işlem dikkatli yapılmalıdır.
            </p>
            <div className="space-y-2">
              {rollbackCandidates.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-surface-container rounded border border-outline/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-on-surface text-sm">{d.version}</span>
                      <span className={deployStatusBadge(d.status)}>{d.status}</span>
                    </div>
                    <p className="text-[10px] text-outline mt-0.5">
                      {new Date(d.deployedAt).toLocaleString("tr-TR")} · {d.deployedBy}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">{d.notes}</p>
                  </div>
                  <button
                    disabled
                    className="border border-error/30 text-error px-3 py-1 rounded text-[10px] font-bold uppercase opacity-60 cursor-not-allowed"
                    title="Rollback işlemi için sistem yöneticisiyle iletişime geçin"
                  >
                    ROLLBACK
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <SuperAdminFooter />
    </>
  );
}
