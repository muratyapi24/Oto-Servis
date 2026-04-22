import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getSupportQueue } from "@/lib/actions/superadmin.actions";

export const metadata = { title: "Destek Kuyruğu | Super Admin" };

export default async function SupportPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "all";

  const data = await getSupportQueue();
  if ("error" in data) return <div className="p-8 text-error font-mono">{data.error}</div>;

  const TABS = [
    { id: "all", label: "Tüm Biletler" },
    { id: "open", label: "Açık" },
    { id: "inprogress", label: "İşlemde" },
    { id: "resolved", label: "Çözüldü" },
  ];

  const filteredTickets = data.tickets.filter((t) => {
    if (tab === "open") return t.status === "OPEN";
    if (tab === "inprogress") return t.status === "IN_PROGRESS";
    if (tab === "resolved") return t.status === "RESOLVED";
    return true;
  });

  const priorityBadge = (priority: string) => {
    if (priority === "HIGH") return "bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-bold";
    if (priority === "MEDIUM") return "bg-secondary-container/20 text-secondary-container px-2 py-0.5 rounded text-[10px] font-bold";
    return "bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-bold";
  };

  const statusBadge = (status: string) => {
    if (status === "OPEN") return "bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-bold";
    if (status === "IN_PROGRESS") return "bg-secondary-container/20 text-secondary-container px-2 py-0.5 rounded text-[10px] font-bold";
    return "bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold";
  };

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">support_agent</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">Destek Kuyruğu</h2>
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
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-error">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-error text-lg">inbox</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Açık</p>
            </div>
            <p className="text-3xl font-black text-on-surface">
              {data.tickets.filter((t) => t.status === "OPEN").length}
            </p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-secondary-container">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-secondary-container text-lg">pending</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">İşlemde</p>
            </div>
            <p className="text-3xl font-black text-on-surface">
              {data.tickets.filter((t) => t.status === "IN_PROGRESS").length}
            </p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-tertiary-fixed">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-on-tertiary-fixed-variant text-lg">check_circle</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Çözüldü</p>
            </div>
            <p className="text-3xl font-black text-on-surface">
              {data.tickets.filter((t) => t.status === "RESOLVED").length}
            </p>
          </div>
        </div>

        {/* Bilet Tablosu */}
        <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="dense-table w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Başlık</th>
                  <th>Firma</th>
                  <th>Öncelik</th>
                  <th>Durum</th>
                  <th>Oluşturulma</th>
                  <th>Eylemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="font-mono text-[10px] font-bold text-outline">{ticket.id}</td>
                    <td className="font-medium text-on-surface">{ticket.title}</td>
                    <td className="text-on-surface-variant">{ticket.tenantName}</td>
                    <td>
                      <span className={priorityBadge(ticket.priority)}>{ticket.priority}</span>
                    </td>
                    <td>
                      <span className={statusBadge(ticket.status)}>{ticket.status}</span>
                    </td>
                    <td className="text-outline font-mono text-[10px]">
                      {new Date(ticket.createdAt).toLocaleString("tr-TR")}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button className="text-[10px] font-bold text-primary hover:underline">GÖRÜNTÜLE</button>
                        <button className="text-[10px] font-bold text-outline hover:underline">ATA</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-outline py-8">Bilet bulunamadı.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SuperAdminFooter />
    </>
  );
}
