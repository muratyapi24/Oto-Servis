import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getExpandedTenants, getSubscriptionPlans } from "@/lib/actions/superadmin.actions";
import CreateTenantDialog from "./CreateTenantDialog";
import TenantActionMenu from "./TenantActionMenu";

export default async function TenantManagementPage(props: { searchParams?: Promise<{ filter?: string, view?: string }> }) {
  const searchParams = await props.searchParams;
  const filter = searchParams?.filter || "all";
  const view = searchParams?.view || "compact";

  const { tenants, error } = await getExpandedTenants();
  const { plans } = await getSubscriptionPlans();
  if (error) {
    return <div className="p-8 text-error font-mono">{error}</div>;
  }

  const activeCount = tenants?.filter(t => t.status === "ACTIVE").length || 0;
  const totalCount = tenants?.length || 0;

  // Filtreleme mantığı
  const filteredTenants = tenants?.filter(t => {
    if (filter === "deployments") return t.status === "SUSPENDED";
    if (filter === "health") return t.status === "SUSPENDED" || t.status === "DELETED";
    return true; // "all" veya "overview"
  }) || [];

  return (
    <>
      <header className="h-12 bg-white flex items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">apartment</span>
            <h2 className="text-sm font-bold tracking-tight uppercase">Firma Yönetimi</h2>
          </div>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input 
              className="bg-surface-container-low border border-outline/10 rounded py-1 pl-9 pr-3 w-80 text-[11px] focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
              placeholder="Firma adı, ID veya domaine göre ara..." 
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed rounded border border-tertiary-container/30 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-fixed-variant"></span>
            AKTİF: {activeCount} / {totalCount}
          </div>
          <CreateTenantDialog plans={plans || []} />
        </div>
      </header>

      <div className="bg-white border-b border-outline/20 px-6 flex items-center shrink-0 gap-1 overflow-x-auto no-scrollbar">
        <Link href={`/super-admin`} className="px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface transition-colors border-b-2 border-transparent hover:bg-surface-container-low whitespace-nowrap">Genel Bakış</Link>
        <Link href={`?filter=all&view=${view}`} className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${filter === 'all' ? 'font-bold border-b-2 border-primary text-primary bg-primary/5' : 'font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low'}`}>Tüm Firmalar</Link>
        <Link href={`?filter=deployments&view=${view}`} className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${filter === 'deployments' ? 'font-bold border-b-2 border-primary text-primary bg-primary/5' : 'font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low'}`}>Dağıtım Sırası</Link>
        <Link href={`?filter=health&view=${view}`} className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${filter === 'health' ? 'font-bold border-b-2 border-primary text-primary bg-primary/5' : 'font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low'}`}>Sağlık Denetimi</Link>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Filter Sidebar */}
        <div className="w-56 bg-white border-r border-outline/10 flex flex-col shrink-0">
          <div className="p-4 space-y-6 overflow-y-auto">
            <div>
              <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-3">Hizmet Paketi</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input defaultChecked className="w-3.5 h-3.5 rounded border-outline/30 text-primary focus:ring-primary/20" type="checkbox"/>
                  <span className="text-xs font-medium group-hover:text-primary transition-colors">Kurumsal</span>
                  <span className="ml-auto text-[10px] font-mono text-outline">42</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input defaultChecked className="w-3.5 h-3.5 rounded border-outline/30 text-primary focus:ring-primary/20" type="checkbox"/>
                  <span className="text-xs font-medium group-hover:text-primary transition-colors">Profesyonel</span>
                  <span className="ml-auto text-[10px] font-mono text-outline">58</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input className="w-3.5 h-3.5 rounded border-outline/30 text-primary focus:ring-primary/20" type="checkbox"/>
                  <span className="text-xs font-medium group-hover:text-primary transition-colors">Standart</span>
                  <span className="ml-auto text-[10px] font-mono text-outline">27</span>
                </label>
              </div>
            </div>
            
            <div>
              <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-3">Sağlık Durumu</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="w-3.5 h-3.5 rounded-full border border-outline/30 flex items-center justify-center p-0.5">
                    <div className="w-full h-full rounded-full bg-tertiary-fixed"></div>
                  </div>
                  <span className="text-xs font-medium group-hover:text-primary transition-colors">Sağlıklı</span>
                  <span className="ml-auto text-[10px] font-mono text-outline">{activeCount}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="w-3.5 h-3.5 rounded-full border border-outline/30 flex items-center justify-center p-0.5">
                    <div className="w-full h-full rounded-full bg-error"></div>
                  </div>
                  <span className="text-xs font-medium group-hover:text-primary transition-colors">Askıya Alınmış</span>
                  <span className="ml-auto text-[10px] font-mono text-outline">{totalCount - activeCount}</span>
                </label>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-3">Bölge</p>
              <select className="w-full bg-surface-container-low border border-outline/10 rounded px-2 py-1.5 text-[11px] focus:ring-1 focus:ring-primary outline-none cursor-pointer">
                <option>Tüm Bölgeler</option>
                <option>TR-Marmara</option>
                <option>TR-İç Anadolu</option>
                <option>EU-Batı</option>
              </select>
            </div>
            
            <div className="pt-4 border-t border-outline/10">
              <button className="w-full text-center text-[10px] font-bold text-primary uppercase tracking-wider hover:underline">Tüm Filtreleri Temizle</button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-background min-w-0">
          <div className="p-4 border-b border-outline/10 bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-outline uppercase">Görünüm:</span>
                <div className="flex bg-surface-container rounded p-0.5">
                  <Link href={`?filter=${filter}&view=compact`} className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-colors ${view === 'compact' ? 'bg-white shadow-sm text-primary' : 'text-outline hover:text-on-surface'}`}>Sıkışık</Link>
                  <Link href={`?filter=${filter}&view=cozy`} className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-colors ${view === 'cozy' ? 'bg-white shadow-sm text-primary' : 'text-outline hover:text-on-surface'}`}>Rahat</Link>
                </div>
              </div>
              <div className="h-4 w-px bg-outline/20"></div>
              <p className="text-[10px] font-medium text-outline">{filteredTenants.length} kayıt gösteriliyor</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1.5 text-outline hover:bg-surface-container-low rounded border border-outline/10 transition-all flex">
                <span className="material-symbols-outlined text-lg leading-none">download</span>
              </button>
              <button className="p-1.5 text-outline hover:bg-surface-container-low rounded border border-outline/10 transition-all flex">
                <span className="material-symbols-outlined text-lg leading-none">print</span>
              </button>
              <button className="p-1.5 text-outline hover:bg-surface-container-low rounded border border-outline/10 transition-all flex">
                <span className="material-symbols-outlined text-lg leading-none">settings</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-white m-4 border border-outline/20 rounded shadow-sm relative">
            <table className={`w-full dense-table border-collapse ${view === 'cozy' ? '[&_td]:!py-3 [&_th]:!py-3 [&_td]:!px-4 [&_th]:!px-4' : ''}`}>
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="w-12 text-center">
                    <input className="w-3 h-3 rounded border-outline/30 text-primary focus:ring-primary/20" type="checkbox"/>
                  </th>
                  <th className="cursor-pointer hover:bg-surface-container-high transition-colors">
                    <div className="flex items-center gap-1">
                      Firma Adı
                      <span className="material-symbols-outlined text-xs">arrow_drop_down</span>
                    </div>
                  </th>
                  <th className="cursor-pointer hover:bg-surface-container-high transition-colors">Hizmet Paketi</th>
                  <th className="cursor-pointer hover:bg-surface-container-high transition-colors text-center">Veri Noktaları</th>
                  <th className="cursor-pointer hover:bg-surface-container-high transition-colors">Durum</th>
                  <th className="cursor-pointer hover:bg-surface-container-high transition-colors">Oluşturulma Tarihi</th>
                  <th className="text-right pr-4">İşlemler</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-outline/50">Filtrelere uygun firma bulunamadı.</td>
                  </tr>
                ) : filteredTenants.map(t => {
                  const initial = t.name.substring(0, 2).toUpperCase();
                  const isEnt = t.planName.toUpperCase().includes('ENT');
                  const isPro = t.planName.toUpperCase().includes('PRO');
                  
                  return (
                    <tr key={t.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="text-center">
                        <input className="w-3 h-3 rounded border-outline/30 text-primary focus:ring-primary/20" type="checkbox"/>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isEnt ? 'bg-primary-container text-white' : isPro ? 'bg-secondary text-white' : 'bg-surface-container-highest text-primary'}`}>
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface text-[11px] font-sans truncate max-w-[180px]">{t.name}</p>
                            <p className="text-[9px] text-outline truncate max-w-[180px]">{t.email || "E-posta Yok"}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${isEnt ? 'bg-primary-container text-white' : isPro ? 'bg-secondary text-white' : 'bg-surface-container-highest text-on-surface'}`}>
                          {t.planName.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-[10px] text-center text-outline">
                        <span className="mr-2" title="Kullanıcılar">U:{t.userCount}</span>
                        <span title="Araçlar">V:{t.vehicleCount}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${t.status === 'ACTIVE' ? 'bg-tertiary-fixed' : 'bg-error'}`}></span>
                          <span className={`text-[10px] font-bold uppercase ${t.status === 'ACTIVE' ? 'text-on-tertiary-fixed-variant' : 'text-error'}`}>
                            {t.status === 'ACTIVE' ? 'AKTİF' : t.status === 'SUSPENDED' ? 'ASKIYA ALINDI' : t.status}
                          </span>
                        </div>
                      </td>
                      <td className="text-outline text-[10px]">{new Date(t.createdAt).toLocaleDateString("tr-TR")}</td>
                      <td className="text-right pr-4">
                        <TenantActionMenu tenant={t} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-white border-t border-outline/10 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-2 text-outline">
              <button className="p-1.5 rounded hover:bg-surface-container-low transition-colors disabled:opacity-50" disabled>
                <span className="material-symbols-outlined text-lg leading-none">chevron_left</span>
              </button>
              <div className="flex items-center gap-1">
                <button className="w-7 h-7 flex items-center justify-center rounded bg-primary text-white text-[10px] font-bold">1</button>
                <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-container-low text-[10px] font-medium disabled:opacity-50" disabled>2</button>
              </div>
              <button className="p-1.5 rounded hover:bg-surface-container-low transition-colors disabled:opacity-50" disabled>
                <span className="material-symbols-outlined text-lg leading-none">chevron_right</span>
              </button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-outline uppercase">Sayfa başına kayıt:</span>
              <select className="bg-surface-container-low border border-outline/10 rounded px-1.5 py-0.5 text-[10px] font-mono outline-none">
                <option>25</option>
                <option defaultValue="50">50</option>
                <option>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <SuperAdminFooter />
    </>
  );
}
