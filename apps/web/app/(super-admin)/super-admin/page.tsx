import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getDashboardMetrics } from "@/lib/actions/superadmin.actions";

export default async function CommandCenterPage() {
  const data = await getDashboardMetrics();
  
  if (data.error) {
    return <div className="p-8 text-error font-mono">{data.error}</div>;
  }

  const formatMoney = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">monitor_heart</span>
            <h2 className="text-sm font-bold tracking-tight uppercase">Sistem Sağlığı</h2>
          </div>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input 
              className="bg-surface-container-low border border-outline/10 rounded py-1 pl-9 pr-3 w-64 text-[11px] focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
              placeholder="Sistem günlükleri veya verilerde ara..." 
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed rounded border border-tertiary-container/30 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-fixed-variant animate-pulse"></span>
            Çalışma: 99.99%
          </div>
          <div className="h-4 w-px bg-outline/20"></div>
          <button className="p-1 text-on-surface hover:bg-surface-container rounded relative">
            <span className="material-symbols-outlined text-xl">terminal</span>
          </button>
          <button className="p-1 text-on-surface hover:bg-surface-container rounded relative">
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-error rounded-full border border-white"></span>
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-outline/20 px-6 flex items-center shrink-0 gap-1 overflow-x-auto no-scrollbar">
        <Link href="/super-admin" className="px-4 py-2 text-xs font-bold border-b-2 border-primary text-primary bg-primary/5 whitespace-nowrap">Genel Bakış</Link>
        <Link href="/super-admin/tenants" className="px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface transition-colors border-b-2 border-transparent hover:bg-surface-container-low whitespace-nowrap">Firmalar</Link>
        <Link href="/super-admin/analytics" className="px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface transition-colors border-b-2 border-transparent hover:bg-surface-container-low whitespace-nowrap">Sistem Durumu (Analitik)</Link>
        <Link href="/super-admin/logs" className="px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface transition-colors border-b-2 border-transparent hover:bg-surface-container-low whitespace-nowrap">İşlem Günlükleri</Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Metric Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="data-widget flex justify-between">
            <div>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-0.5">Toplam Firma</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-bold font-mono">{data.totalTenants}</h3>
                <span className="text-[10px] text-tertiary font-bold">{data.activeTenants} Aktif</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <svg className="sparkline" preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0 35 L10 32 L20 38 L30 25 L40 28 L50 15 L60 20 L70 10 L80 15 L90 5 L100 8" fill="none" stroke="#6ffbbe" strokeWidth="2"></path>
              </svg>
              <p className="text-[8px] text-outline font-mono">6 AYLIK</p>
            </div>
          </div>

          <div className="data-widget flex justify-between">
            <div>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-0.5">Aktif Kullanıcı</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-bold font-mono">{data.totalUsers}</h3>
                <span className="text-[10px] text-tertiary font-bold">+5.2%</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <svg className="sparkline" preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0 30 L20 25 L40 28 L60 22 L80 18 L100 15" fill="none" stroke="#6ffbbe" strokeWidth="2"></path>
              </svg>
              <p className="text-[8px] text-outline font-mono">ZAMANLI</p>
            </div>
          </div>

          <div className="data-widget flex justify-between border-l-2 border-primary">
            <div>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-0.5">Aylık Ciro</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-bold font-mono text-primary">{formatMoney(data.mrr || 0)}</h3>
                <span className="text-[10px] text-tertiary font-bold">MRR</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <svg className="sparkline" preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0 38 L25 30 L50 35 L75 20 L100 5" fill="none" stroke="#00288e" strokeWidth="2"></path>
              </svg>
              <p className="text-[8px] text-outline font-mono">BU AY</p>
            </div>
          </div>

          <div className="data-widget flex justify-between border-l-2 border-error">
            <div>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-0.5">Kayıp Oranı</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-bold font-mono">2.4%</h3>
                <span className="text-[10px] text-error font-bold">-0.2%</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <svg className="sparkline" preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0 10 L20 15 L40 12 L60 20 L80 25 L100 35" fill="none" stroke="#ba1a1a" strokeWidth="2"></path>
              </svg>
              <p className="text-[8px] text-outline font-mono">TUTMA</p>
            </div>
          </div>
        </div>

        {/* Complex Layout */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-8 space-y-4">
            
            <div className="bg-white border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-2 border-b border-outline/20 flex justify-between items-center bg-surface-container-lowest">
                <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-3 bg-primary rounded-full"></span> Son Eklenen Firmalar
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-primary">Canlı Senkron</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left dense-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Firma Adı</th>
                      <th>Hizmet Paketi</th>
                      <th>Kayıt Tarihi</th>
                      <th className="text-right pr-3">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {data.recentTenants?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-outline/50">Kayıtlı firma bulunmamaktadır.</td>
                      </tr>
                    ) : data.recentTenants?.map((t: any) => (
                      <tr key={t.id} className="hover:bg-primary/5 transition-colors">
                        <td className="text-outline truncate max-w-[80px]" title={t.id}>{t.id.split('-')[0]}</td>
                        <td className="font-bold text-on-surface">{t.name}</td>
                        <td><span className={`px-1.5 py-0.5 text-white text-[9px] font-bold rounded ${t.planName.toUpperCase().includes('PRO') ? 'bg-secondary' : 'bg-primary-container'}`}>{t.planName.toUpperCase()}</span></td>
                        <td>{new Date(t.createdAt).toLocaleDateString("tr-TR")}</td>
                        <td className="text-right pr-3">
                          <span className={`inline-block w-2 h-2 rounded-full ${t.status === 'ACTIVE' ? 'bg-tertiary-fixed' : 'bg-error'}`}></span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-outline/20 rounded shadow-sm">
              <div className="px-4 py-2 border-b border-outline/20 flex justify-between items-center bg-inverse-surface text-surface-bright">
                <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">list_alt</span> Canlı Sistem Günlüğü (Örnek)
                </h4>
              </div>
              <div className="divide-y divide-outline/10">
                <div className="px-4 py-2 flex items-center justify-between hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[9px] text-outline w-12">12:44:02</span>
                    <span className="text-[9px] font-bold text-tertiary bg-tertiary/10 px-1.5 py-0.5 rounded uppercase">Kayıt</span>
                    <p className="text-[11px] font-medium"><span className="font-bold">"Ege Servis"</span> sunucusu başarıyla kuruldu.</p>
                  </div>
                  <span className="font-mono text-[9px] text-outline">SYS-091</span>
                </div>
                <div className="px-4 py-2 flex items-center justify-between hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[9px] text-outline w-12">12:38:15</span>
                    <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">Ödeme</span>
                    <p className="text-[11px] font-medium"><span className="font-bold">"Ankara Auto"</span> paketi Enterprise seviyesine yükseltildi.</p>
                  </div>
                  <span className="font-mono text-[9px] text-outline">AUTO-72</span>
                </div>
                <div className="px-4 py-2 flex items-center justify-between hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[9px] text-outline w-12">11:59:44</span>
                    <span className="text-[9px] font-bold text-secondary-container bg-secondary-container/10 px-1.5 py-0.5 rounded uppercase">Güvenlik</span>
                    <p className="text-[11px] font-medium">Hatalı giriş denemesi (Admin IP: 95.1.x.x) - Engellendi.</p>
                  </div>
                  <span className="font-mono text-[9px] text-outline">SEC-403</span>
                </div>
              </div>
            </div>

          </div>

          <div className="col-span-12 lg:col-span-4 space-y-4">
            
            <div className="bg-white border border-outline/20 rounded p-4 shadow-sm">
              <h4 className="text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">settings_input_component</span> Altyapı Yükü
              </h4>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-[10px] font-bold">API Gecikmesi</span>
                    <span className="text-[10px] font-bold text-tertiary">124ms</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[35%]"></div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-[10px] font-bold">DB İşlem Hızı</span>
                    <span className="text-[10px] font-bold text-tertiary">8.2k ops/s</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-tertiary-fixed-dim w-[62%]"></div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-[10px] font-bold">Depolama I/O</span>
                    <span className="text-[10px] font-bold text-secondary-container">Yüksek</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-secondary-container w-[88%]"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-error/30 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-2 border-b border-error/10 bg-error/5 flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-error flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">warning</span> Aktif Alarmlar
                </h4>
                <span className="px-1.5 py-0.5 bg-error text-white text-[9px] font-bold rounded">2 KRİTİK</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="border-l-2 border-error pl-3">
                  <p className="text-[11px] font-bold">Alan Sınırı: Merkez Servis</p>
                  <p className="text-[10px] text-outline leading-tight mt-0.5">MS-42 %95 kotaya ulaştı. Paket yükseltme önerilir.</p>
                  <div className="mt-1.5 flex gap-2">
                    <button className="text-[9px] font-bold text-primary uppercase hover:underline">YÜKSELT</button>
                    <button className="text-[9px] font-bold text-outline uppercase hover:underline">YOKSAY</button>
                  </div>
                </div>
                <div className="border-l-2 border-secondary-container pl-3">
                  <p className="text-[11px] font-bold">Abonelik Uç Hatası</p>
                  <p className="text-[10px] text-outline leading-tight mt-0.5">cluster-beta'da 3 işlem başarısız oldu.</p>
                  <div className="mt-1.5 flex gap-2">
                    <button className="text-[9px] font-bold text-primary uppercase hover:underline">TÜMÜNÜ YENİDEN DENE</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-outline/20 rounded p-4 shadow-sm">
              <h4 className="text-[10px] font-bold uppercase tracking-widest mb-4">Pazar Payı</h4>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="50%" cy="50%" fill="transparent" r="35%" stroke="#eff4ff" strokeWidth="10"></circle>
                    <circle cx="50%" cy="50%" fill="transparent" r="35%" stroke="#00288e" strokeDasharray="110 220" strokeLinecap="butt" strokeWidth="10"></circle>
                    <circle cx="50%" cy="50%" fill="transparent" r="35%" stroke="#fd761a" strokeDasharray="60 220" strokeDashoffset="-115" strokeLinecap="butt" strokeWidth="10"></circle>
                    <circle cx="50%" cy="50%" fill="transparent" r="35%" stroke="#3fd298" strokeDasharray="40 220" strokeDashoffset="-180" strokeLinecap="butt" strokeWidth="10"></circle>
                  </svg>
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-primary"></span> ENT</span>
                    <span className="font-bold">52%</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-secondary-container"></span> PRO</span>
                    <span className="font-bold">31%</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-[#3fd298]"></span> STD</span>
                    <span className="font-bold">17%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      <SuperAdminFooter />
    </>
  );
}
