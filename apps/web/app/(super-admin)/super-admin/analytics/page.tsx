import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";

export default async function AnalyticsEnginePage(props: { searchParams?: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "financial";

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">insights</span>
            <h2 className="text-sm font-bold tracking-tight uppercase text-on-surface">Analitik Motoru</h2>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-surface-container rounded border border-outline/10">
            <span className="text-[10px] font-bold text-outline">DÖNEM:</span>
            <select className="bg-transparent border-none p-0 text-[10px] font-bold text-primary focus:ring-0 outline-none cursor-pointer">
              <option>SON 30 GÜN</option>
              <option>SON ÇEYREK</option>
              <option>BU YIL (YTD)</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded uppercase hover:bg-primary/90 transition-colors">
            <span className="material-symbols-outlined text-xs">download</span>
            Rapor Oluştur
          </button>
          <div className="h-4 w-px bg-outline/20"></div>
          <button className="p-1 text-on-surface hover:bg-surface-container rounded transition-colors">
            <span className="material-symbols-outlined text-xl">refresh</span>
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-outline/20 px-6 flex items-center shrink-0 gap-1 overflow-x-auto no-scrollbar">
        <Link href="?tab=financial" className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${tab === 'financial' ? 'font-bold border-b-2 border-primary text-primary bg-primary/5' : 'font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low'}`}>Finansal İçgörüler</Link>
        <Link href="?tab=users" className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${tab === 'users' ? 'font-bold border-b-2 border-primary text-primary bg-primary/5' : 'font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low'}`}>Kullanıcı Dinamikleri</Link>
        <Link href="?tab=resources" className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${tab === 'resources' ? 'font-bold border-b-2 border-primary text-primary bg-primary/5' : 'font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low'}`}>Kaynak Dağılımı</Link>
        <Link href="?tab=funnels" className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${tab === 'funnels' ? 'font-bold border-b-2 border-primary text-primary bg-primary/5' : 'font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low'}`}>Dönüşüm Hunileri</Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {tab === "financial" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="chart-container">
                <div className="data-header">
                  <span>Gelir Hızı</span>
                  <span className="positive-trend text-[9px]">+ bugüne kadar ₺4.2k</span>
                </div>
                <div className="flex-1 flex items-end gap-1 h-32 mb-2">
                  <div className="bar w-full h-[40%]"></div>
                  <div className="bar w-full h-[55%]"></div>
                  <div className="bar w-full h-[45%]"></div>
                  <div className="bar w-full h-[70%]"></div>
                  <div className="bar w-full h-[85%]"></div>
                  <div className="bar w-full h-[65%]"></div>
                  <div className="bar w-full h-[95%]"></div>
                </div>
                <div className="flex justify-between items-baseline mt-auto">
                  <span className="text-xl font-bold font-mono tracking-tighter">₺384,250</span>
                  <span className="text-[9px] font-mono text-outline">BU AY DÖNEMİ</span>
                </div>
              </div>

              <div className="chart-container border-l-2 border-tertiary-fixed">
                <div className="data-header">
                  <span>Ortalama Gelir Artışı (ARPU)</span>
                  <span className="positive-trend text-[9px]">HEDEFE ULAŞILDI</span>
                </div>
                <div className="flex-1 flex items-center justify-center h-32 mb-2">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                      <circle cx="16" cy="16" fill="transparent" r="14" stroke="#eff4ff" strokeWidth="4"></circle>
                      <circle cx="16" cy="16" fill="transparent" r="14" stroke="#6ffbbe" strokeDasharray="66 100" strokeWidth="4"></circle>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono">75%</span>
                  </div>
                </div>
                <div className="flex justify-between items-baseline mt-auto">
                  <span className="text-xl font-bold font-mono tracking-tighter">₺2,025</span>
                  <span className="text-[9px] font-mono text-outline">Ort./Birim</span>
                </div>
              </div>
            </div>

            <div className="chart-container">
              <div className="data-header">
                <span className="flex items-center gap-2"><span className="w-1.5 h-3 bg-primary rounded-full"></span> Aylık Fatura Geliri Dağıtımı (₺)</span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1 text-[9px]"><span className="w-2 h-2 rounded-full bg-primary"></span> Abonelikler</span>
                  <span className="flex items-center gap-1 text-[9px]"><span className="w-2 h-2 rounded-full bg-secondary-container"></span> Ek Hizmetler</span>
                </div>
              </div>
              <div className="h-64 flex items-end gap-2 px-2 border-b border-outline/10 pb-2">
                {[40, 45, 55, 50, 65, 75, 80, 85, 70, 90, 85, 95].map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end gap-0.5 group relative">
                    <div className="w-full bg-primary/80 rounded-t-sm group-hover:bg-primary transition-colors" style={{ height: `${val}%`}}></div>
                    <div className="w-full bg-secondary-container/80 rounded-b-sm group-hover:bg-secondary-container transition-colors" style={{ height: `${Math.floor(val/4)}%`}}></div>
                    <span className="text-[8px] text-center mt-2 font-mono text-outline">
                      {['OCA', 'SUB', 'MAR', 'NIS', 'MAY', 'HAZ', 'TEM', 'AGU', 'EYL', 'EKI', 'KAS', 'ARA'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "users" && (
          <>
            <div className="chart-container">
              <div className="data-header">
                <span>Aktif Oturumlar</span>
                <span className="text-outline text-[9px]">Zirve: 2.1k</span>
              </div>
              <div className="flex-1 relative h-32 mb-2">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                  <path d="M0 35 Q 25 35, 35 20 T 60 15 T 85 5 T 100 10" fill="none" stroke="#00288e" strokeWidth="2"></path>
                  <path d="M0 35 Q 25 35, 35 20 T 60 15 T 85 5 T 100 10 V 40 H 0 Z" fill="url(#gradient-primary)" opacity="0.1"></path>
                  <defs>
                    <linearGradient id="gradient-primary" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#00288e"></stop>
                      <stop offset="100%" stopColor="#fff"></stop>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="flex justify-between items-baseline mt-auto">
                <span className="text-xl font-bold font-mono tracking-tighter">1,843</span>
                <span className="text-[9px] font-mono positive-trend">↑ 12.4%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="chart-container overflow-hidden">
                <div className="data-header">
                  <span>Kullanıcı Kazanım Performansı (Gruplar)</span>
                  <button className="text-primary hover:underline transition-colors uppercase">Detaylar</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[9px] font-mono">
                    <thead>
                      <tr className="bg-surface-container-low">
                        <th className="p-1.5 border border-outline/10 text-left font-bold text-outline">GRUP (COHORT)</th>
                        <th className="p-1.5 border border-outline/10 text-center text-outline">1. HAFTA</th>
                        <th className="p-1.5 border border-outline/10 text-center text-outline">2. HAFTA</th>
                        <th className="p-1.5 border border-outline/10 text-center text-outline">3. HAFTA</th>
                        <th className="p-1.5 border border-outline/10 text-center text-outline">4. HAFTA</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr>
                        <td className="p-1.5 border border-outline/10 bg-surface-container-lowest font-bold text-on-surface">NİS-24</td>
                        <td className="p-1.5 border border-outline/10 text-center bg-primary/60 text-white font-bold">92%</td>
                        <td className="p-1.5 border border-outline/10 text-center bg-primary/40 font-medium">78%</td>
                        <td className="p-1.5 border border-outline/10 text-center bg-primary/20 font-medium">65%</td>
                        <td className="p-1.5 border border-outline/10 text-center bg-primary/10 font-medium">54%</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 border border-outline/10 bg-surface-container-lowest font-bold text-on-surface">MAY-24</td>
                        <td className="p-1.5 border border-outline/10 text-center bg-primary/60 text-white font-bold">94%</td>
                        <td className="p-1.5 border border-outline/10 text-center bg-primary/40 font-medium">82%</td>
                        <td className="p-1.5 border border-outline/10 text-center bg-primary/20 font-medium">71%</td>
                        <td className="p-1.5 border border-outline/10 text-center text-outline/40">-</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 border border-outline/10 bg-surface-container-lowest font-bold text-on-surface">HAZ-24</td>
                        <td className="p-1.5 border border-outline/10 text-center bg-primary/70 text-white font-bold">97%</td>
                        <td className="p-1.5 border border-outline/10 text-center text-outline/40">-</td>
                        <td className="p-1.5 border border-outline/10 text-center text-outline/40">-</td>
                        <td className="p-1.5 border border-outline/10 text-center text-outline/40">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="chart-container">
                <div className="data-header">
                  <span>Müşteri Kaybı (Churn) Risk Haritası</span>
                  <span className="text-error text-[9px] font-bold">4 HESAP RİSKTE</span>
                </div>
                <div className="space-y-4 pt-1 flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-[9px] mb-1.5">
                        <span className="font-bold">Standart Paket Kaybı</span>
                        <span className="text-error font-bold uppercase">Yüksek Risk</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-error w-[72%]"></div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-error">7.2%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-[9px] mb-1.5">
                        <span className="font-bold">Kurumsal (Enterprise) Kaybı</span>
                        <span className="positive-trend uppercase">Düşük Risk</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-tertiary-fixed w-[12%]"></div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-tertiary">0.8%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-[9px] mb-1.5">
                        <span className="font-bold">Profesyonel Paket Kayıp</span>
                        <span className="text-outline uppercase font-bold">Orta Risk</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-secondary-container w-[28%]"></div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-secondary">2.1%</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "resources" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="chart-container border-l-2 border-secondary">
              <div className="data-header">
                <span>Kaynak Yük Durumu</span>
                <span className="text-secondary text-[9px] font-bold">UYARI</span>
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-4 mb-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span>CPU Kullanımı</span>
                    <span className="text-error font-bold">%88</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-error w-[88%]"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span>Bellek (RAM)</span>
                    <span className="font-bold">%42</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[42%]"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span>Ağ Trafiği</span>
                    <span className="font-bold text-tertiary">%65</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-tertiary w-[65%]"></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-baseline mt-auto">
                <span className="text-xl font-bold font-mono tracking-tighter">8.2k</span>
                <span className="text-[9px] font-mono text-outline">İŞLEM/SN</span>
              </div>
            </div>

            <div className="chart-container">
              <div className="data-header">
                <span>Sistem Altyapı Tahsisi</span>
              </div>
              <div className="flex flex-col items-center justify-center h-48 py-4">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#eff4ff" strokeWidth="4"></circle>
                    <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#00288e" strokeDasharray="60 100" strokeDashoffset="0" strokeWidth="4"></circle>
                    <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#fd761a" strokeDasharray="25 100" strokeDashoffset="-60" strokeWidth="4"></circle>
                    <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#3fd298" strokeDasharray="15 100" strokeDashoffset="-85" strokeWidth="4"></circle>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold font-mono">84%</span>
                    <span className="text-[7px] text-outline uppercase font-bold">KULLANIM</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-4 w-full px-4">
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> İşlem</span>
                    <span className="font-bold">60%</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary-container"></span> Depolama</span>
                    <span className="font-bold">25%</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span> Ağ Tüketimi</span>
                    <span className="font-bold">15%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "funnels" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface-container-lowest border border-outline/20 rounded">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
              <span className="material-symbols-outlined text-4xl text-outline/40">filter_alt</span>
            </div>
            <h3 className="text-lg font-bold font-mono tracking-tight text-on-surface mb-2">Dönüşüm Hunileri Yakında</h3>
            <p className="text-outline text-xs max-w-sm">
              Bu alan yapım aşamasındadır. Kullanıcı kayıt, deneme süreci ve abonelik paket yükseltme dönüşüm (conversion) hunilerini yakında buradan analiz edebileceksiniz.
            </p>
          </div>
        )}

      </div>

      <SuperAdminFooter />
    </>
  );
}
