import React from "react";

export default function SubscriptionEnterprise() {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-container-lowest">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-outline/20 p-3 rounded-lg shadow-sm hover:border-primary/40 transition-all flex justify-between border-l-2 border-l-primary">
            <div>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-0.5">Kurumsal Müşteriler</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-bold font-mono">66</h3>
                <span className="text-[10px] text-tertiary font-bold">+8%</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <svg className="h-[30px] w-[80px]" preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0 35 L20 30 L40 32 L60 15 L80 18 L100 5" fill="none" stroke="#00288e" strokeWidth="2"></path>
              </svg>
              <p className="text-[8px] text-outline font-mono">ENT BÜYÜMESİ</p>
            </div>
          </div>

          <div className="bg-white border border-outline/20 p-3 rounded-lg shadow-sm hover:border-primary/40 transition-all flex justify-between">
            <div>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-0.5">Müşteri Başı Gelir</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-bold font-mono">₺14.250</h3>
                <span className="text-[10px] text-tertiary font-bold">+3.1%</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <svg className="h-[30px] w-[80px]" preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0 30 L25 28 L50 20 L75 15 L100 12" fill="none" stroke="#6ffbbe" strokeWidth="2"></path>
              </svg>
              <p className="text-[8px] text-outline font-mono">ARPU ENDEKSİ</p>
            </div>
          </div>

          <div className="bg-white border border-outline/20 p-3 rounded-lg shadow-sm hover:border-primary/40 transition-all flex justify-between">
            <div>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-0.5">Paket Elde Tutma</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-bold font-mono">98.2%</h3>
                <span className="text-[10px] text-tertiary font-bold">Durağan</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <svg className="h-[30px] w-[80px]" preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0 10 L20 10 L40 12 L60 10 L80 10 L100 10" fill="none" stroke="#6ffbbe" strokeWidth="2"></path>
              </svg>
              <p className="text-[8px] text-outline font-mono">SAĞLIK</p>
            </div>
          </div>

          <div className="bg-white border border-outline/20 p-3 rounded-lg shadow-sm hover:border-primary/40 transition-all flex justify-between border-l-2 border-l-secondary-container">
            <div>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-0.5">Node Tüketimi</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-bold font-mono">2.840</h3>
                <span className="text-[10px] text-secondary-container font-bold">+15.4%</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <svg className="h-[30px] w-[80px]" preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0 38 L20 30 L40 25 L60 20 L80 10 L100 2" fill="none" stroke="#fd761a" strokeWidth="2"></path>
              </svg>
              <p className="text-[8px] text-outline font-mono">YÜK ENDEKSİ</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="bg-white border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-2 border-b border-outline/20 bg-primary/5 flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">settings_suggest</span>
                  Hizmet Paket Konfigürasyonu
                </h4>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-2">Taban Fiyat</p>
                  <div className="bg-surface-container-low p-3 rounded border border-outline-variant/30 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold">Yıllık Sözleşme</p>
                      <p className="text-[10px] text-outline">Aktif node başına faturalandırılır</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold font-mono text-primary">₺9.500<span className="text-[10px] font-normal text-outline font-sans">/ay</span></p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-2">Kaynak Limitleri</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-outline">Maksimum Kiracı (Tenants)</span>
                      <span className="font-bold font-mono">SINIRSIZ</span>
                    </div>
                    <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-full"></div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-outline">Eşzamanlı Kullanıcılar</span>
                      <span className="font-bold font-mono">500 / node</span>
                    </div>
                    <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[75%]"></div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-outline">API Oran Limiti</span>
                      <span className="font-bold font-mono">10k req/min</span>
                    </div>
                    <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full bg-secondary-container w-[85%]"></div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-2">Etkin Özellikler</p>
                  <div className="grid grid-cols-1 gap-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-sm text-tertiary">check_circle</span>
                      <span>Gelişmiş Analitik Paketi</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-sm text-tertiary">check_circle</span>
                      <span>White-labeling (OEM)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-sm text-tertiary">check_circle</span>
                      <span>SSO/SAML Entegrasyonu</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs opacity-50">
                      <span className="material-symbols-outlined text-sm">cancel</span>
                      <span className="line-through">Özel Uç Ağ Gidiş Geçidi (Edge Gateway)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-outline/20 rounded p-4 shadow-sm">
              <h4 className="text-[10px] font-bold uppercase tracking-widest mb-4">Kurumsal Gelir Payı</h4>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="50%" cy="50%" fill="transparent" r="35%" stroke="#eff4ff" strokeWidth="8"></circle>
                    <circle cx="50%" cy="50%" fill="transparent" r="35%" stroke="#00288e" strokeDasharray="160 220" strokeLinecap="butt" strokeWidth="8"></circle>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold font-mono">72%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-outline leading-tight">Kurumsal paketi bu ay <span className="font-bold text-primary">toplam ekosistem MRR'ının %72'sini</span> oluşturuyor.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8 space-y-4">
            <div className="bg-white border border-outline/20 rounded shadow-sm">
              <div className="px-4 py-2 border-b border-outline/20 flex justify-between items-center bg-surface-container-lowest">
                <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-3 bg-secondary-container rounded-full"></span>
                  Performans Trendi (90 Günlük Delta)
                </h4>
                <div className="flex gap-1">
                  <button className="px-2 py-0.5 text-[9px] font-bold rounded bg-surface-container-high">7G</button>
                  <button className="px-2 py-0.5 text-[9px] font-bold rounded bg-surface-container-high">30G</button>
                  <button className="px-2 py-0.5 text-[9px] font-bold rounded bg-primary text-white">90G</button>
                </div>
              </div>
              <div className="p-6 h-48 flex items-end gap-1">
                <div className="flex-1 bg-surface-container-low rounded-t hover:bg-primary/20 transition-colors" style={{ height: '40%' }}></div>
                <div className="flex-1 bg-surface-container-low rounded-t hover:bg-primary/20 transition-colors" style={{ height: '55%' }}></div>
                <div className="flex-1 bg-surface-container-low rounded-t hover:bg-primary/20 transition-colors" style={{ height: '48%' }}></div>
                <div className="flex-1 bg-surface-container-low rounded-t hover:bg-primary/20 transition-colors" style={{ height: '65%' }}></div>
                <div className="flex-1 bg-primary rounded-t" style={{ height: '72%' }}></div>
                <div className="flex-1 bg-primary rounded-t" style={{ height: '85%' }}></div>
                <div className="flex-1 bg-primary rounded-t" style={{ height: '82%' }}></div>
                <div className="flex-1 bg-primary rounded-t" style={{ height: '95%' }}></div>
                <div className="flex-1 bg-primary rounded-t" style={{ height: '90%' }}></div>
                <div className="flex-1 bg-primary rounded-t" style={{ height: '100%' }}></div>
              </div>
              <div className="px-6 pb-4 flex justify-between text-[10px] font-mono text-outline font-bold">
                <span>EKİ 23</span>
                <span>KAS 23</span>
                <span>ARA 23</span>
                <span>OCA 24</span>
              </div>
            </div>

            <div className="bg-white border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-2 border-b border-outline/20 flex justify-between items-center bg-inverse-surface text-surface-bright">
                <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-white">
                  <span className="material-symbols-outlined text-sm">groups</span>
                  Abone Olan Kurumsal Müşteriler
                </h4>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-1.5 top-1/2 -translate-y-1/2 text-outline text-xs">filter_list</span>
                    <input className="bg-white/10 border-none rounded py-0.5 pl-6 pr-2 text-[9px] w-32 focus:ring-1 focus:ring-primary text-white placeholder-white/50 outline-none" placeholder="Müşteri Filtrele..." type="text" />
                  </div>
                  <span className="text-[10px] font-bold text-outline">TOPLAM: 66</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low">UID</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low">Organizasyon Adı</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low">Altyapı (Deployment)</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low text-center">Node'lar</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low">MRR</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low">Büyüme Hızı</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low text-right">Sağlık</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono bg-white">
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-outline">#001</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold text-on-surface font-sans">Ankara Auto Plaza</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10"><span className="text-[9px] text-outline font-sans">Cloud / TR-West</span></td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-center">42</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold">₺12.500,00</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10">
                        <span className="text-tertiary-fixed-dim bg-on-tertiary-fixed p-1 rounded font-bold">+18.5%</span>
                      </td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-right">
                        <span className="inline-block w-2 h-2 rounded-full bg-tertiary-fixed shadow-[0_0_8px_#6ffbbe]"></span>
                      </td>
                    </tr>
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-outline">#012</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold text-on-surface font-sans">İstanbul Oto Bakım</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10"><span className="text-[9px] text-outline font-sans">On-Prem / IS-01</span></td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-center">55</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold">₺15.800,00</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10">
                        <span className="text-error bg-error-container p-1 rounded font-bold">-2.1%</span>
                      </td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-right">
                        <span className="inline-block w-2 h-2 rounded-full bg-secondary-container"></span>
                      </td>
                    </tr>
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-outline">#044</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold text-on-surface font-sans">Bursa Lojistik A.Ş.</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10"><span className="text-[9px] text-outline font-sans">Cloud / TR-West</span></td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-center">88</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold">₺24.200,00</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10">
                        <span className="text-tertiary-fixed-dim bg-on-tertiary-fixed p-1 rounded font-bold">+5.2%</span>
                      </td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-right">
                        <span className="inline-block w-2 h-2 rounded-full bg-tertiary-fixed shadow-[0_0_8px_#6ffbbe]"></span>
                      </td>
                    </tr>
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-outline">#056</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold text-on-surface font-sans">Antalya Fleet Services</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10"><span className="text-[9px] text-outline font-sans">Hybrid / AN-04</span></td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-center">31</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold">₺10.400,00</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10">
                        <span className="text-tertiary-fixed-dim bg-on-tertiary-fixed p-1 rounded font-bold">+12.0%</span>
                      </td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-right">
                        <span className="inline-block w-2 h-2 rounded-full bg-tertiary-fixed shadow-[0_0_8px_#6ffbbe]"></span>
                      </td>
                    </tr>
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-outline">#089</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold text-on-surface font-sans">Global Parts Dist.</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10"><span className="text-[9px] text-outline font-sans">Cloud / EU-Central</span></td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-center">112</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold">₺38.500,00</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10">
                        <span className="text-tertiary-fixed-dim bg-on-tertiary-fixed p-1 rounded font-bold">+2.1%</span>
                      </td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-right">
                        <span className="inline-block w-2 h-2 rounded-full bg-tertiary-fixed shadow-[0_0_8px_#6ffbbe]"></span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 border-t border-outline/10 flex justify-between items-center bg-surface-container-low">
                <p className="text-[9px] font-bold text-outline uppercase font-mono">1-5 / 66 KAYIT GÖSTERİLİYOR</p>
                <div className="flex gap-2">
                  <button className="p-1 text-outline hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <button className="p-1 text-outline hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
