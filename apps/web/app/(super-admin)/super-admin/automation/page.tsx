import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getAutomationWorkflows } from "@/lib/actions/superadmin.actions";
import WorkflowToggle from "./WorkflowToggle";

export const metadata = { title: "Otomasyon İş Akışı | Super Admin" };

const MOCK_HISTORY = [
  { workflow: "Deneme Süresi Bitiş Uyarısı", triggeredAt: "2025-06-10 14:32", status: "SUCCESS", duration: "1.2s" },
  { workflow: "Ödeme Başarısız Bildirimi", triggeredAt: "2025-06-10 13:15", status: "SUCCESS", duration: "0.8s" },
  { workflow: "Güvenlik Tehdidi Alarmı", triggeredAt: "2025-06-10 12:00", status: "ERROR", duration: "3.4s" },
  { workflow: "Yeni Tenant Karşılama", triggeredAt: "2025-06-10 10:45", status: "SUCCESS", duration: "2.1s" },
  { workflow: "Aylık Rapor Gönderimi", triggeredAt: "2025-06-01 08:00", status: "SUCCESS", duration: "15.3s" },
];

export default async function AutomationPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "workflows";

  const data = await getAutomationWorkflows();
  if ("error" in data) return <div className="p-8 text-error font-mono">{data.error}</div>;

  const TABS = [
    { id: "workflows", label: "İş Akışları" },
    { id: "history", label: "Çalışma Geçmişi" },
    { id: "new", label: "Yeni İş Akışı" },
  ];

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">account_tree</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">Otomasyon İş Akışı</h2>
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
              <span className="material-symbols-outlined text-on-tertiary-fixed-variant text-lg">play_circle</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Aktif</p>
            </div>
            <p className="text-3xl font-black text-on-surface">
              {data.workflows.filter((w) => w.isActive).length}
            </p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-outline">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-outline text-lg">pause_circle</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Pasif</p>
            </div>
            <p className="text-3xl font-black text-on-surface">
              {data.workflows.filter((w) => !w.isActive).length}
            </p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-primary">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-lg">bolt</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Toplam Çalışma</p>
            </div>
            <p className="text-3xl font-black text-on-surface">
              {data.workflows.reduce((a, w) => a + w.runCount, 0)}
            </p>
          </div>
        </div>

        {/* İş Akışları Tab */}
        {tab === "workflows" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="dense-table w-full">
                <thead>
                  <tr>
                    <th>İş Akışı Adı</th>
                    <th>Tetikleyici</th>
                    <th>Eylem</th>
                    <th>Durum</th>
                    <th>Son Çalışma</th>
                    <th>Çalışma Sayısı</th>
                    <th>Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {data.workflows.map((w) => (
                    <tr key={w.id}>
                      <td className="font-medium text-on-surface">{w.name}</td>
                      <td className="font-mono text-[10px] text-outline">{w.trigger}</td>
                      <td className="font-mono text-[10px] text-on-surface-variant">{w.action}</td>
                      <td>
                        <span className={
                          w.isActive
                            ? "bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold"
                            : "bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-bold"
                        }>
                          {w.isActive ? "AKTİF" : "PASİF"}
                        </span>
                      </td>
                      <td className="text-outline font-mono text-[10px]">
                        {w.lastRunAt ? new Date(w.lastRunAt).toLocaleString("tr-TR") : "—"}
                      </td>
                      <td className="font-bold text-on-surface">{w.runCount}</td>
                      <td>
                        <WorkflowToggle id={w.id} isActive={w.isActive} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Çalışma Geçmişi Tab */}
        {tab === "history" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="dense-table w-full">
                <thead>
                  <tr>
                    <th>İş Akışı</th>
                    <th>Tetiklenme Zamanı</th>
                    <th>Durum</th>
                    <th>Süre</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_HISTORY.map((h, i) => (
                    <tr key={i}>
                      <td className="font-medium text-on-surface">{h.workflow}</td>
                      <td className="text-outline font-mono text-[10px]">{h.triggeredAt}</td>
                      <td>
                        <span className={
                          h.status === "SUCCESS"
                            ? "bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold"
                            : "bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-bold"
                        }>
                          {h.status}
                        </span>
                      </td>
                      <td className="font-mono text-[10px] text-on-surface-variant">{h.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Yeni İş Akışı Tab */}
        {tab === "new" && (
          <div className="bg-surface-container-lowest border border-outline/20 p-12 rounded shadow-sm flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-outline text-5xl">construction</span>
            <p className="text-sm font-bold text-outline uppercase tracking-widest">Yakında</p>
            <p className="text-xs text-outline/70">Yeni iş akışı oluşturma özelliği geliştirme aşamasındadır.</p>
          </div>
        )}
      </div>

      <SuperAdminFooter />
    </>
  );
}
