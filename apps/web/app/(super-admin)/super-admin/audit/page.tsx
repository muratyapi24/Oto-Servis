import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getAuditTrail } from "@/lib/actions/superadmin.actions";
import AuditFilters from "./AuditFilters";

export const metadata = { title: "Denetim Kasası | Super Admin" };

export default async function AuditPage(props: {
  searchParams?: Promise<{ tab?: string; module?: string; level?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "trail";
  const module = searchParams?.module;
  const level = searchParams?.level;
  const page = parseInt(searchParams?.page || "1");

  const data = await getAuditTrail({ module, level, page });
  if ("error" in data) return <div className="p-8 text-error font-mono">{data.error}</div>;

  const TABS = [
    { id: "trail", label: "Denetim İzi" },
    { id: "critical", label: "Kritik İşlemler" },
    { id: "activity", label: "Kullanıcı Aktivitesi" },
  ];

  const levelBadge = (lvl: string) => {
    if (lvl === "ERROR" || lvl === "CRITICAL") return "bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-bold";
    if (lvl === "WARN" || lvl === "WARNING") return "bg-secondary-container/20 text-secondary-container px-2 py-0.5 rounded text-[10px] font-bold";
    return "bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold";
  };

  const filteredLogs = tab === "critical"
    ? data.logs.filter((l) => l.level === "CRITICAL" || l.level === "ERROR")
    : tab === "activity"
    ? data.logs.filter((l) => l.userId !== null)
    : data.logs;

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">gavel</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">Denetim Kasası</h2>
        </div>
      </header>

      <div className="bg-white border-b border-outline/20 px-6 flex items-center shrink-0 gap-1 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`?tab=${t.id}&page=${page}${module ? `&module=${module}` : ""}${level ? `&level=${level}` : ""}`}
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
              <span className="material-symbols-outlined text-primary text-lg">list_alt</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Toplam Log</p>
            </div>
            <p className="text-3xl font-black text-on-surface">{data.total}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-secondary">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-secondary text-lg">article</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Bu Sayfa</p>
            </div>
            <p className="text-3xl font-black text-on-surface">{data.logs.length}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-outline">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-outline text-lg">pages</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Sayfa</p>
            </div>
            <p className="text-3xl font-black text-on-surface">{data.page}/{data.totalPages}</p>
          </div>
        </div>

        {/* Filtreler */}
        <AuditFilters />

        {/* Denetim Tablosu */}
        <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="dense-table w-full">
              <thead>
                <tr>
                  <th>Zaman</th>
                  <th>Kullanıcı</th>
                  <th>Tenant</th>
                  <th>Modül</th>
                  <th>Seviye</th>
                  <th>Mesaj</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-outline font-mono text-[10px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("tr-TR")}
                    </td>
                    <td className="text-on-surface text-[11px]">
                      {(log.user as { name?: string } | null)?.name ?? "Sistem"}
                    </td>
                    <td className="text-on-surface-variant text-[11px]">
                      {(log.tenant as { name?: string } | null)?.name ?? "—"}
                    </td>
                    <td className="font-mono text-[10px] font-bold text-on-surface">{log.module}</td>
                    <td>
                      <span className={levelBadge(log.level)}>{log.level}</span>
                    </td>
                    <td className="max-w-xs truncate text-on-surface-variant text-[11px]">{log.message}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-outline py-8">Log kaydı bulunamadı.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Sayfalama */}
          <div className="flex items-center justify-between p-3 border-t border-outline/10">
            <span className="text-[10px] text-outline">{data.total} kayıt, {data.totalPages} sayfa</span>
            <div className="flex items-center gap-1">
              {page > 1 && (
                <Link
                  href={`?page=${page - 1}&module=${module || ""}&level=${level || ""}`}
                  className="px-2 py-1 border border-outline/20 rounded text-[10px] hover:bg-surface-container"
                >
                  ←
                </Link>
              )}
              <span className="px-2 py-1 bg-primary text-white rounded text-[10px] font-bold">{page}</span>
              {page < data.totalPages && (
                <Link
                  href={`?page=${page + 1}&module=${module || ""}&level=${level || ""}`}
                  className="px-2 py-1 border border-outline/20 rounded text-[10px] hover:bg-surface-container"
                >
                  →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <SuperAdminFooter />
    </>
  );
}
