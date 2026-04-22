import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getAuditLogs } from "@/lib/actions/superadmin.actions";

export default async function LogsPage(props: { searchParams?: Promise<{ level?: string }> }) {
  const searchParams = await props.searchParams;
  const filterLevel = searchParams?.level || "all";

  const { logs, error } = await getAuditLogs();

  if (error) {
    return <div className="p-8 text-error font-mono">{error}</div>;
  }

  const getLevelStyle = (level: string) => {
    switch (level) {
      case 'INFO': return 'lvl-info';
      case 'WARN': return 'lvl-warn';
      case 'ERROR': return 'lvl-err';
      default: return 'bg-surface-container text-on-surface';
    }
  };

  const getModuleStyle = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-error';
      case 'WARN': return 'text-secondary';
      default: return 'text-primary';
    }
  };

  const filteredLogs = logs?.filter((log: any) => {
    if (filterLevel === "error") return log.level === "ERROR";
    if (filterLevel === "warn") return log.level === "WARN";
    if (filterLevel === "info") return log.level === "INFO";
    return true; // all
  }) || [];

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">terminal</span>
            <h2 className="text-sm font-bold tracking-tight uppercase">İşlem Günlükleri</h2>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-low border border-outline/10 rounded px-2.5 py-1">
            <span className="material-symbols-outlined text-outline text-lg">filter_alt</span>
            <span className="text-[10px] font-bold text-primary uppercase">Aktif Oturum: main-cluster-01</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed rounded border border-tertiary-container/30 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-fixed-variant animate-pulse"></span>
            Canlı Akış Aktif
          </div>
          <button className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded hover:bg-primary/90 transition-colors uppercase tracking-widest">
            Tüm Kaydı İndir
          </button>
        </div>
      </header>

      <div className="bg-surface-container-lowest border-b border-outline/20 px-4 py-2 flex flex-wrap items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-outline uppercase">Seviye:</label>
          <div className="flex border border-outline/20 rounded overflow-hidden">
            <Link href="?level=all" className={`px-3 py-1 text-[9px] font-bold transition-colors ${filterLevel === 'all' ? 'bg-primary text-white' : 'hover:bg-surface-container-low text-outline'}`}>TÜMÜ</Link>
            <Link href="?level=error" className={`px-3 py-1 text-[9px] font-bold transition-colors ${filterLevel === 'error' ? 'bg-primary text-white' : 'hover:bg-surface-container-low text-outline'}`}>HATA</Link>
            <Link href="?level=warn" className={`px-3 py-1 text-[9px] font-bold transition-colors ${filterLevel === 'warn' ? 'bg-primary text-white' : 'hover:bg-surface-container-low text-outline'}`}>UYARI</Link>
            <Link href="?level=info" className={`px-3 py-1 text-[9px] font-bold transition-colors ${filterLevel === 'info' ? 'bg-primary text-white' : 'hover:bg-surface-container-low text-outline'}`}>BİLGİ</Link>
          </div>
        </div>
        
        <div className="h-6 w-px bg-outline/20 truncate hidden md:block"></div>
        
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <label className="text-[10px] font-bold text-outline uppercase whitespace-nowrap">Filtrele:</label>
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-outline text-base">search</span>
            <input 
              className="w-full bg-surface-container-low border border-transparent rounded py-1 pl-8 pr-3 text-[11px] focus:ring-1 focus:ring-primary focus:bg-white font-mono outline-none transition-all" 
              placeholder="Kaynak, mesaj veya izleme ID'ye göre ara..." 
              type="text"
            />
          </div>
        </div>
        
        <div className="h-6 w-px bg-outline/20"></div>
        
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-outline uppercase">Kaynak:</label>
          <select className="bg-surface-container-low border-none rounded py-1 pl-2 pr-8 text-[11px] font-bold text-on-surface focus:ring-0 outline-none cursor-pointer">
            <option>Tüm Modüller</option>
            <option>API-GATEWAY</option>
            <option>AUTH-SERVICE</option>
            <option>BILLING-ENGINE</option>
            <option>DATA-SYNC</option>
          </select>
        </div>
        
        <div className="h-6 w-px bg-outline/20"></div>
        
        <button className="p-1 text-outline hover:text-primary transition-colors">
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto scrollbar-thin bg-black/[0.02]">
          <table className="w-full text-left log-table border-collapse">
            <thead>
              <tr>
                <th className="w-40 whitespace-nowrap">Zaman Damgası</th>
                <th className="w-20">Seviye</th>
                <th className="w-32">Modül</th>
                <th>Mesaj</th>
                <th className="w-40 text-right pr-4">İzleme ID</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[11px] tracking-tighter">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-outline/50">Bulunamadı. Seçilen filtrede kayıt yok veya hiç log oluşturulmadı.</td>
                </tr>
              ) : filteredLogs.map((log: any) => (
                <tr key={log.id} className="log-row hover:bg-surface-container-low transition-colors">
                  <td className="text-outline whitespace-nowrap">{new Date(log.createdAt).toLocaleString("tr-TR")}</td>
                  <td>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${getLevelStyle(log.level)}`}>
                      {log.level}
                    </span>
                  </td>
                  <td className={`font-bold ${getModuleStyle(log.level)}`}>{log.module}</td>
                  <td className={log.level === 'ERROR' ? 'font-bold text-error' : 'text-on-surface'}>
                    {log.message}
                  </td>
                  <td className="text-right text-outline opacity-70 pr-4">
                    {log.traceId || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="w-64 border-l border-outline/20 bg-white p-4 space-y-6 overflow-y-auto shrink-0 hidden lg:block">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-outline mb-3">Olay Dağılımı</h4>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-error">Hatalar (Tümü)</span>
                  <span className="font-mono">{logs?.filter((l:any)=>l.level==='ERROR').length || 0}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                  {logs?.length ? (
                    <div className="h-full bg-error" style={{ width: `${((logs.filter((l:any)=>l.level==='ERROR').length) / logs.length) * 100}%` }}></div>
                  ) : <div className="h-full" style={{ width: "0%" }}></div>}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-primary">Bilgi/Uyarılar</span>
                  <span className="font-mono">{logs?.filter((l:any)=>l.level!=='ERROR').length || 0}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                   {logs?.length ? (
                    <div className="h-full bg-primary" style={{ width: `${((logs.filter((l:any)=>l.level!=='ERROR').length) / logs.length) * 100}%` }}></div>
                  ) : <div className="h-full" style={{ width: "0%" }}></div>}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-outline/10">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-outline mb-3">Modül Sağlamlığı</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-medium">API-GW</span>
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed"></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-medium">AUTH-SV</span>
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed"></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-medium">BILL-ENG</span>
                <span className="w-2 h-2 rounded-full bg-error animate-pulse shadow-[0_0_4px_rgba(186,26,26,0.5)]"></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-medium">STORAGE</span>
                <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-outline/10">
            <div className="bg-surface-container-low p-2.5 rounded border border-outline/10">
              <p className="text-[9px] font-bold text-outline uppercase mb-1.5">Durum Özeti</p>
              <p className="text-[11px] font-medium leading-tight text-on-surface">Ödeme motorunda kesintili veritabanı yavaşlaması görülüyor.</p>
              <button className="mt-2.5 text-[9px] font-bold text-primary uppercase hover:underline">Tanılamayı Kullan</button>
            </div>
          </div>
        </aside>
      </div>

      <SuperAdminFooter />
    </>
  );
}
