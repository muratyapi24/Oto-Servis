import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getSystemNotifications } from "@/lib/actions/superadmin.actions";

export default async function NotificationsPage(props: { searchParams?: Promise<{ filter?: string }> }) {
  const searchParams = await props.searchParams;
  const filter = searchParams?.filter || "all";

  const { notifications, error } = await getSystemNotifications();

  if (error) {
    return <div className="p-8 text-error font-mono">{error}</div>;
  }

  const unreadCount = notifications?.filter((n:any) => !n.isRead).length || 0;
  const criticalCount = notifications?.filter((n:any) => n.severity === "CRITICAL").length || 0;
  const warningCount = notifications?.filter((n:any) => n.severity === "WARNING").length || 0;

  const getSeverityStyle = (severity: string) => {
    switch(severity) {
      case 'CRITICAL': return { bg: 'bg-error', text: 'text-white', badge: 'bg-error', icon: 'error' };
      case 'WARNING': return { bg: 'bg-secondary-container', text: 'text-on-secondary-container', badge: 'bg-secondary-container/10 border-secondary-container/20 text-secondary-container', icon: 'warning' };
      default: return { bg: 'bg-surface-container', text: 'text-outline', badge: 'bg-primary/10 border-primary/20 text-primary', icon: 'info' };
    }
  };

  const filteredNotifications = notifications?.filter((n: any) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "critical") return n.severity === "CRITICAL";
    if (filter === "system") return n.category === "SYSTEM";
    if (filter === "security") return n.category === "SECURITY";
    return true; // all
  }) || [];

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">notifications_active</span>
            <h2 className="text-sm font-bold tracking-tight uppercase">Bildirimler</h2>
          </div>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input 
              className="bg-surface-container-low border border-outline/10 rounded py-1 pl-9 pr-3 w-64 text-[11px] focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
              placeholder="Bildirimlerde ara..." 
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed rounded border border-tertiary-container/30 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-fixed-variant"></span>
            Sistem Aktif
          </div>
          <div className="h-4 w-px bg-outline/20"></div>
          <button className="p-1 text-on-surface hover:bg-surface-container rounded relative transition-colors">
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>
          <button className="p-1 text-on-surface hover:bg-surface-container rounded relative transition-colors">
            <span className="material-symbols-outlined text-xl">notifications</span>
            {unreadCount > 0 && <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-error rounded-full border border-white"></span>}
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-outline/20 px-6 flex items-center shrink-0 gap-1 overflow-x-auto no-scrollbar">
        <Link href="?filter=all" className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${filter === 'all' ? 'font-bold border-b-2 border-primary text-primary bg-primary/5' : 'font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low'}`}>Tümü</Link>
        <Link href="?filter=unread" className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${filter === 'unread' ? 'font-bold border-b-2 border-primary text-primary bg-primary/5' : 'font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low'}`}>Okunmamış</Link>
        <Link href="?filter=critical" className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${filter === 'critical' ? 'font-bold border-b-2 border-primary text-primary bg-primary/5' : 'font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low'}`}>Kritik</Link>
        <Link href="?filter=system" className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${filter === 'system' ? 'font-bold border-b-2 border-primary text-primary bg-primary/5' : 'font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low'}`}>Sistem</Link>
        <Link href="?filter=security" className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${filter === 'security' ? 'font-bold border-b-2 border-primary text-primary bg-primary/5' : 'font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low'}`}>Güvenlik</Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-secondary-container p-3 rounded-lg shadow-sm flex items-center justify-between border border-secondary">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-on-secondary-container">mark_email_unread</span>
              </div>
              <div>
                <p className="text-[9px] font-bold text-on-secondary-container uppercase tracking-widest opacity-80">Okunmamış</p>
                <h3 className="text-xl font-bold font-mono text-on-secondary-container leading-none">{unreadCount}</h3>
              </div>
            </div>
            <span className="text-[10px] font-bold text-on-secondary-container/60 uppercase">Bekleyen</span>
          </div>

          <div className="bg-error p-3 rounded-lg shadow-sm flex items-center justify-between border border-error">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-white">emergency</span>
              </div>
              <div>
                <p className="text-[9px] font-bold text-white uppercase tracking-widest opacity-80">Kritik Alarm</p>
                <h3 className="text-xl font-bold font-mono text-white leading-none">{criticalCount}</h3>
              </div>
            </div>
            <span className="text-[10px] font-bold text-white/60 uppercase">Acil</span>
          </div>

          <div className="bg-tertiary-fixed p-3 rounded-lg shadow-sm flex items-center justify-between border border-tertiary-container/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-on-tertiary-fixed/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-on-tertiary-fixed">warning</span>
              </div>
              <div>
                <p className="text-[9px] font-bold text-on-tertiary-fixed uppercase tracking-widest opacity-80">Uyarılar</p>
                <h3 className="text-xl font-bold font-mono text-on-tertiary-fixed leading-none">{warningCount}</h3>
              </div>
            </div>
            <span className="text-[10px] font-bold text-on-tertiary-fixed/60 uppercase">Düşük Risk</span>
          </div>
        </div>

        <div className="bg-white border border-outline/20 rounded shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-2 border-b border-outline/20 flex justify-between items-center bg-inverse-surface text-surface-bright">
            <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">notifications_active</span>
              Bildirim Geçmişi & Log Kaydı
            </h4>
            <div className="flex gap-4 items-center">
              <div className="flex items-center bg-white/10 rounded px-1.5 py-0.5">
                <span className="text-[9px] font-bold px-1.5 text-tertiary-fixed cursor-pointer">HEPSİ</span>
                <span className="text-[9px] font-bold px-1.5 opacity-50 cursor-pointer hover:opacity-100 transition-opacity">SİSTEM</span>
                <span className="text-[9px] font-bold px-1.5 opacity-50 cursor-pointer hover:opacity-100 transition-opacity">FİNANS</span>
              </div>
              <button className="text-[9px] font-bold text-primary-fixed hover:text-white transition-colors">TÜMÜNÜ OKUNDU İŞARETLE</button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left dense-table">
              <thead>
                <tr>
                  <th className="w-10"></th>
                  <th className="w-32">Zaman Damgası</th>
                  <th className="w-32">Kategori</th>
                  <th>Mesaj</th>
                  <th className="w-32 text-right pr-4">Önem Derecesi</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {filteredNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-outline/50">Gösterilecek bildirim bulunmuyor.</td>
                  </tr>
                ) : filteredNotifications.map((n:any) => {
                  const style = getSeverityStyle(n.severity || 'INFO');
                  return (
                    <tr key={n.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="text-center">
                        {!n.isRead && <span className={`w-1.5 h-1.5 rounded-full inline-block ${n.severity==='CRITICAL'?'bg-error':'bg-primary'}`}></span>}
                      </td>
                      <td className="text-outline text-[10px]">{new Date(n.createdAt).toLocaleString("tr-TR")}</td>
                      <td>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${style.badge}`}>{n.category}</span>
                      </td>
                      <td className="text-[11px] font-medium text-on-surface">
                        {n.severity === 'CRITICAL' ? <span className="font-bold text-error">{n.title}: </span> : <span className="font-bold">{n.title}: </span>}
                        {n.message}
                      </td>
                      <td className="text-right pr-4">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${style.bg} ${style.text}`}>{n.severity}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2 bg-surface-container-low border-t border-outline/10 flex items-center justify-between">
            <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Son {filteredNotifications.length || 0} bildirim gösteriliyor</p>
            <div className="flex items-center gap-1">
              <button className="w-6 h-6 flex items-center justify-center rounded border border-outline/20 bg-white text-outline hover:text-primary p-0 transition-colors" disabled><span className="material-symbols-outlined text-sm leading-none">chevron_left</span></button>
              <span className="text-[10px] font-bold px-2">SAYFA 1 / 1</span>
              <button className="w-6 h-6 flex items-center justify-center rounded border border-outline/20 bg-white text-outline hover:text-primary p-0 transition-colors" disabled><span className="material-symbols-outlined text-sm leading-none">chevron_right</span></button>
            </div>
          </div>
        </div>
      </div>

      <SuperAdminFooter />
    </>
  );
}
