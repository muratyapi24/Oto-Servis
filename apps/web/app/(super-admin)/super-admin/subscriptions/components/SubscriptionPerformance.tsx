import React from "react";

export default function SubscriptionPerformance() {
  return (
    <>
      <div className="bg-white border-b border-outline/20 px-6 flex items-center gap-1 shrink-0">
        <button className="px-4 py-2 text-xs font-bold border-b-2 border-primary text-primary bg-primary/5 transition-colors">Büyüme Özeti</button>
        <button className="px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors border-b-2 border-transparent">Kayıp Analitiği</button>
        <button className="px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors border-b-2 border-transparent">Genişleme Hunisi</button>
        <button className="px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors border-b-2 border-transparent">Tahminsel Modeller</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-container-lowest">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-outline/20 p-3 rounded-lg shadow-sm hover:border-primary/40 transition-all">
            <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-0.5">Net Yeni MRR</p>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-bold font-mono">₺42.840</h3>
                <span className="text-[10px] text-tertiary font-bold">+18.2%</span>
              </div>
              <svg className="w-12 h-6" viewBox="0 0 100 40">
                <path d="M0 40 L20 30 L40 35 L60 15 L80 18 L100 5" fill="none" stroke="#6ffbbe" strokeWidth="3"></path>
              </svg>
            </div>
            <p className="text-[8px] text-outline font-mono mt-1">TAHMİNİ HEDEF: ₺45.000</p>
          </div>

          <div className="bg-white border border-outline/20 p-3 rounded-lg shadow-sm hover:border-primary/40 transition-all">
            <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-0.5">Genişleme Oranı</p>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-bold font-mono">12.4%</h3>
                <span className="text-[10px] text-tertiary font-bold">+2.1%</span>
              </div>
              <svg className="w-12 h-6" viewBox="0 0 100 40">
                <path d="M0 35 L30 32 L60 20 L100 10" fill="none" stroke="#6ffbbe" strokeWidth="3"></path>
              </svg>
            </div>
            <p className="text-[8px] text-outline font-mono mt-1">LTV ETKİSİ: +₺1.2M</p>
          </div>

          <div className="bg-white border border-outline/20 p-3 rounded-lg shadow-sm hover:border-primary/40 transition-all border-l-2 border-l-primary">
            <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-0.5">Öngörülen Kayıp</p>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-bold font-mono text-primary">1.8%</h3>
                <span className="text-[10px] text-primary font-bold">Durağan</span>
              </div>
              <svg className="w-12 h-6" viewBox="0 0 100 40">
                <path d="M0 10 L25 12 L50 11 L75 13 L100 12" fill="none" stroke="#00288e" strokeWidth="3"></path>
              </svg>
            </div>
            <p className="text-[8px] text-outline font-mono mt-1">SONRAKİ 30 GÜN TAHMİNİ</p>
          </div>

          <div className="bg-white border border-outline/20 p-3 rounded-lg shadow-sm hover:border-primary/40 transition-all border-l-2 border-l-secondary-container">
            <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-0.5">Yükseltme Havuzu</p>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-bold font-mono">₺155B</h3>
                <span className="text-[10px] text-secondary-container font-bold">Yüksek</span>
              </div>
              <svg className="w-12 h-6" viewBox="0 0 100 40">
                <path d="M0 38 L25 25 L50 28 L75 10 L100 2" fill="none" stroke="#fd761a" strokeWidth="3"></path>
              </svg>
            </div>
            <p className="text-[8px] text-outline font-mono mt-1">14 UYGUN FİRMA</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-8 bg-white border border-outline/20 rounded shadow-sm">
            <div className="px-4 py-2 border-b border-outline/20 flex justify-between items-center bg-surface-container-lowest">
              <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-3 bg-primary rounded-full"></span>
                Tarihsel Büyüme &amp; Yapay Zeka Tahmini (Gelecek 6 Ay)
              </h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span className="text-[9px] font-bold text-outline">GERÇEKLEŞEN</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full border border-primary border-dashed"></span>
                  <span className="text-[9px] font-bold text-outline">TAHMİN</span>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="h-[160px] w-full relative flex items-end gap-1">
                <svg className="w-full h-full object-fill" preserveAspectRatio="none" viewBox="0 0 1000 200">
                  <line stroke="#f0f0f0" strokeWidth="1" x1="0" x2="1000" y1="50" y2="50"></line>
                  <line stroke="#f0f0f0" strokeWidth="1" x1="0" x2="1000" y1="100" y2="100"></line>
                  <line stroke="#f0f0f0" strokeWidth="1" x1="0" x2="1000" y1="150" y2="150"></line>
                  <path d="M0 180 L100 160 L200 170 L300 140 L400 120 L500 130 L600 100" fill="none" stroke="#00288e" strokeWidth="3"></path>
                  <circle cx="600" cy="100" fill="#00288e" r="4"></circle>
                  <path d="M600 100 L700 80 L800 85 L900 60 L1000 40" fill="none" opacity="0.6" stroke="#00288e" strokeDasharray="6,4" strokeWidth="2"></path>
                  <path d="M0 180 L100 160 L200 170 L300 140 L400 120 L500 130 L600 100 L600 200 L0 200 Z" fill="url(#grad1)" opacity="0.1"></path>
                  <defs>
                    <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#00288e', stopOpacity: 1 }}></stop>
                      <stop offset="100%" style={{ stopColor: '#00288e', stopOpacity: 0 }}></stop>
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute bottom-0 left-0 w-full flex justify-between px-2 text-[9px] font-bold text-outline font-mono pb-1">
                  <span>OCA</span><span>ŞUB</span><span>MAR</span><span>NİS</span><span>MAY</span><span>HAZ</span>
                  <span className="text-primary">TEM*</span><span className="text-primary">AĞU*</span><span className="text-primary">EYL*</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 bg-white border border-outline/20 rounded shadow-sm">
            <div className="px-4 py-2 border-b border-outline/20 bg-surface-container-lowest">
              <h4 className="text-[10px] font-bold uppercase tracking-widest">Abonelik Yığını</h4>
            </div>
            <div className="p-4 space-y-4">
              <div className="h-40 flex items-end justify-around gap-2">
                <div className="flex-1 flex flex-col items-center group">
                  <div className="w-full flex flex-col justify-end h-full relative">
                    <div className="bg-primary h-[50%] rounded-t-sm" title="Kurumsal: 50%"></div>
                    <div className="bg-secondary-container h-[30%]" title="Pro: 30%"></div>
                    <div className="bg-surface-container-highest h-[20%]" title="Standart: 20%"></div>
                  </div>
                  <span className="text-[8px] font-mono mt-1 font-bold">Ç1</span>
                </div>
                <div className="flex-1 flex flex-col items-center group">
                  <div className="w-full flex flex-col justify-end h-full">
                    <div className="bg-primary h-[55%] rounded-t-sm" title="Kurumsal: 55%"></div>
                    <div className="bg-secondary-container h-[28%]" title="Pro: 28%"></div>
                    <div className="bg-surface-container-highest h-[17%]" title="Standart: 17%"></div>
                  </div>
                  <span className="text-[8px] font-mono mt-1 font-bold">Ç2</span>
                </div>
                <div className="flex-1 flex flex-col items-center group">
                  <div className="w-full flex flex-col justify-end h-full">
                    <div className="bg-primary h-[62%] rounded-t-sm" title="Kurumsal: 62%"></div>
                    <div className="bg-secondary-container h-[25%]" title="Pro: 25%"></div>
                    <div className="bg-surface-container-highest h-[13%]" title="Standart: 13%"></div>
                  </div>
                  <span className="text-[8px] font-mono mt-1 font-bold text-primary">Ç3 (ŞU AN)</span>
                </div>
              </div>
              <div className="flex justify-between text-[9px] font-mono pt-2 border-t border-outline/10">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-primary"></span> KURUMSAL</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-secondary-container"></span> PRO</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-surface-container-highest"></span> STD</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-7 space-y-4">
            <div className="bg-white border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-2 border-b border-outline/20 flex justify-between items-center bg-surface-container-lowest">
                <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-sm">rocket_launch</span>
                  Potansiyel Paket Yükseltme Fırsatları
                </h4>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded text-[9px] font-bold text-primary">
                  YZ-PUANLAMA TESPİTİ
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low">Firma</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low">Mevcut Plan</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low">Kullanım (80%+)</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low">Eklenecek Gelir</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low">Etkileşim</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low text-right">Aksiyon</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono bg-white">
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold text-on-surface font-sans">Kuzey Lojistik</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10"><span className="px-1.5 py-0.5 bg-secondary text-white text-[9px] font-bold rounded">PRO</span></td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-sans">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div className="h-full bg-secondary-container w-[92%]"></div>
                          </div>
                          <span className="text-[9px] font-mono">92%</span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10">
                        <span className="text-tertiary-fixed-dim bg-on-tertiary-fixed p-1 rounded font-bold">+₺4.200</span>
                      </td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-center"><span className="material-symbols-outlined text-sm text-tertiary">sentiment_very_satisfied</span></td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-right">
                        <button className="text-[9px] font-bold text-primary border border-primary/30 px-2 py-0.5 rounded hover:bg-primary hover:text-white transition-all font-sans">KURUMSAL ÖNER</button>
                      </td>
                    </tr>
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold text-on-surface font-sans">Ege Servis Grubu</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10"><span className="px-1.5 py-0.5 bg-surface-container-highest text-on-surface text-[9px] font-bold rounded">STD</span></td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-sans">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-[88%]"></div>
                          </div>
                          <span className="text-[9px] font-mono">88%</span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10">
                        <span className="text-tertiary-fixed-dim bg-on-tertiary-fixed p-1 rounded font-bold">+₺2.800</span>
                      </td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-center"><span className="material-symbols-outlined text-sm text-tertiary">sentiment_satisfied</span></td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-right">
                        <button className="text-[9px] font-bold text-primary border border-primary/30 px-2 py-0.5 rounded hover:bg-primary hover:text-white transition-all font-sans">PRO ÖNER</button>
                      </td>
                    </tr>
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold text-on-surface font-sans">Asya Garaj</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10"><span className="px-1.5 py-0.5 bg-secondary text-white text-[9px] font-bold rounded">PRO</span></td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-sans">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div className="h-full bg-secondary-container w-[81%]"></div>
                          </div>
                          <span className="text-[9px] font-mono">81%</span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10">
                        <span className="text-tertiary-fixed-dim bg-on-tertiary-fixed p-1 rounded font-bold">+₺3.500</span>
                      </td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-center"><span className="material-symbols-outlined text-sm text-tertiary">sentiment_satisfied</span></td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-right">
                        <button className="text-[9px] font-bold text-primary border border-primary/30 px-2 py-0.5 rounded hover:bg-primary hover:text-white transition-all font-sans">İNCELE</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5 space-y-4">
            <div className="bg-white border border-error/30 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-2 border-b border-error/10 bg-error/5 flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-error flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  Yaklaşan İptal Riskleri
                </h4>
                <span className="px-1.5 py-0.5 bg-error text-white text-[9px] font-bold rounded">4 KRİTİK</span>
              </div>
              <div className="divide-y divide-outline/10 bg-white">
                <div className="p-3 hover:bg-error/5 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-error-container text-error flex items-center justify-center text-[10px] font-bold">BZ</div>
                      <div>
                        <p className="text-[11px] font-bold">Batı Zincir Oto</p>
                        <p className="text-[9px] text-outline font-mono">Sonraki Yenileme: 14 Eki</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-error">92% Olasılık</p>
                      <p className="text-[9px] text-outline font-mono">₺8.2B ARR riskte</p>
                    </div>
                  </div>
                  <p className="text-[9px] text-outline leading-tight mb-2">Sorun: 14 günden fazla süredir aktif değil. 3 cevapsız destek talebi.</p>
                  <div className="flex gap-2">
                    <button className="text-[9px] font-bold text-primary uppercase bg-primary/5 px-2 py-1 rounded">Senaryo Başlat</button>
                    <button className="text-[9px] font-bold text-outline uppercase bg-surface-container px-2 py-1 rounded">Müşteri Temsilcisi Ata</button>
                  </div>
                </div>

                <div className="p-3 hover:bg-error/5 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-error-container text-error flex items-center justify-center text-[10px] font-bold">SA</div>
                      <div>
                        <p className="text-[11px] font-bold">South Alpine Fleet</p>
                        <p className="text-[9px] text-outline font-mono">Sonraki Yenileme: 28 Eki</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-secondary-container">65% Olasılık</p>
                      <p className="text-[9px] text-outline font-mono">₺15.5B ARR riskte</p>
                    </div>
                  </div>
                  <p className="text-[9px] text-outline leading-tight mb-2">Sorun: Yenileme sözleşmesi reddedildi. Fiyatlandırma incelemesi istendi.</p>
                  <div className="flex gap-2">
                    <button className="text-[9px] font-bold text-primary uppercase bg-primary/5 px-2 py-1 rounded">İndirim Teklif Et</button>
                    <button className="text-[9px] font-bold text-outline uppercase bg-surface-container px-2 py-1 rounded">Üst Mercie Taşı</button>
                  </div>
                </div>
              </div>
              <div className="p-2 bg-surface-container-low text-center">
                <button className="text-[10px] font-bold text-primary uppercase hover:underline">12 Yüksek Riskli Hesabın Tümünü Görüntüle</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
