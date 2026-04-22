import React from "react";

export default function SubscriptionAnalytics() {
  return (
    <>
      <div className="bg-white border-b border-outline/20 px-6 flex items-center gap-1 shrink-0">
        <button className="px-4 py-2 text-xs border-b-2 border-primary text-primary bg-primary/5 font-bold transition-colors">Genel Bakış</button>
        <button className="px-4 py-2 text-xs border-b-2 border-transparent text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors font-semibold">Gelir Akışı</button>
        <button className="px-4 py-2 text-xs border-b-2 border-transparent text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors font-semibold">Paket Segmanları</button>
        <button className="px-4 py-2 text-xs border-b-2 border-transparent text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors font-semibold">Elde Tutma Analizi</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-container-lowest">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-outline/20 p-3 rounded shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between h-24">
            <div className="flex justify-between items-start">
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Aylık Tekrarlayan Gelir (MRR)</p>
              <span className="text-[10px] text-tertiary-fixed-dim bg-on-tertiary-fixed px-1 rounded font-bold">+4.2%</span>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-xl font-bold font-mono">₺412.850</h3>
              <svg className="h-[24px] w-[64px]" preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0 35 L20 30 L40 32 L60 15 L80 18 L100 5" fill="none" stroke="#6ffbbe" strokeWidth="2.5"></path>
              </svg>
            </div>
          </div>
          <div className="bg-white border border-outline/20 p-3 rounded shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between h-24">
            <div className="flex justify-between items-start">
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Yıllık Tekrarlayan Gelir (ARR)</p>
              <span className="text-[10px] text-tertiary-fixed-dim bg-on-tertiary-fixed px-1 rounded font-bold">+12.8%</span>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-xl font-bold font-mono">₺4,95M</h3>
              <svg className="h-[24px] w-[64px]" preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0 38 L25 35 L50 25 L75 10 L100 2" fill="none" stroke="#6ffbbe" strokeWidth="2.5"></path>
              </svg>
            </div>
          </div>
          <div className="bg-white border border-outline/20 p-3 rounded shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between h-24 border-l-2 border-l-primary">
            <div className="flex justify-between items-start">
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Kullanıcı Başı Ort. Gelir (ARPU)</p>
              <span className="text-[10px] text-primary bg-primary/10 px-1 rounded font-bold">+₺45</span>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-xl font-bold font-mono text-primary">₺3.250</h3>
              <svg className="h-[24px] w-[64px]" preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0 30 L30 25 L60 20 L100 5" fill="none" stroke="#00288e" strokeWidth="2.5"></path>
              </svg>
            </div>
          </div>
          <div className="bg-white border border-outline/20 p-3 rounded shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between h-24 border-l-2 border-l-error">
            <div className="flex justify-between items-start">
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Kayıp Oranı (30 Gün)</p>
              <span className="text-[10px] text-error font-bold">-0.12%</span>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-xl font-bold font-mono">1.84%</h3>
              <svg className="h-[24px] w-[64px]" preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0 5 L20 12 L40 10 L60 25 L80 30 L100 38" fill="none" stroke="#ba1a1a" strokeWidth="2.5"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <div className="bg-white border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-outline/20 flex justify-between items-center bg-surface-container-low">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-lg">table_chart</span>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest">Aktif Abonelik Kırılımı</h4>
                </div>
                <div className="flex gap-2">
                  <button className="bg-white border border-outline/20 text-[9px] font-bold px-2 py-1 rounded hover:bg-surface-container transition-colors">PAKETE GÖRE FİLTRELE</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low">Ref ID</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low">Müşteri / Firma</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low">Paket</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low">Döngü</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low">Mevcut Değer</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low">Durum</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low text-right">Sonraki Fatura</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-outline">SUB-881</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold font-body">Ankara Auto Plaza</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10"><span className="px-1.5 py-0.5 bg-primary-container text-white text-[9px] font-bold rounded">KURUMSAL</span></td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-sans">Yıllık</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold">₺150.000,00</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10"><span className="text-[9px] font-bold text-tertiary uppercase flex items-center gap-1 font-sans"><span className="w-1 h-1 bg-tertiary rounded-full"></span> AKTİF</span></td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-right text-outline font-sans">12 Eca 2025</td>
                    </tr>
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-outline">SUB-742</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold font-body">Merkez Servis A.Ş.</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10"><span className="px-1.5 py-0.5 bg-secondary text-white text-[9px] font-bold rounded">PRO</span></td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-sans">Aylık</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold">₺8.200,00</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10"><span className="text-[9px] font-bold text-tertiary uppercase flex items-center gap-1 font-sans"><span className="w-1 h-1 bg-tertiary rounded-full"></span> AKTİF</span></td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-right text-outline font-sans">01 Ara 2026</td>
                    </tr>
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-outline">SUB-612</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold font-body">İstanbul Oto Bakım</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10"><span className="px-1.5 py-0.5 bg-primary-container text-white text-[9px] font-bold rounded">KURUMSAL</span></td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-sans">Aylık</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold">₺15.800,00</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10"><span className="text-[9px] font-bold text-secondary-container uppercase flex items-center gap-1 font-sans"><span className="w-1 h-1 bg-secondary-container rounded-full"></span> BEKLİYOR</span></td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-right text-error font-bold italic font-sans">Gecikmiş</td>
                    </tr>
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-outline">SUB-108</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold font-body">Butik Oto Servis</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10"><span className="px-1.5 py-0.5 bg-surface-container-highest text-on-surface text-[9px] font-bold rounded">STANDART</span></td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-sans">Aylık</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold">₺4.500,00</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10"><span className="text-[9px] font-bold text-tertiary uppercase flex items-center gap-1 font-sans"><span className="w-1 h-1 bg-tertiary rounded-full"></span> AKTİF</span></td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-right text-outline font-sans">05 Ara 2026</td>
                    </tr>
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-outline">SUB-099</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold font-body">Ege Teknik</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10"><span className="px-1.5 py-0.5 bg-secondary text-white text-[9px] font-bold rounded">PRO</span></td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-sans">Yıllık</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 font-bold">₺98.400,00</td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10"><span className="text-[9px] font-bold text-tertiary uppercase flex items-center gap-1 font-sans"><span className="w-1 h-1 bg-tertiary rounded-full"></span> AKTİF</span></td>
                      <td className="px-3 py-1.5 text-xs border-b border-outline-variant/10 text-right text-outline font-sans">15 Haz 2025</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-2 bg-inverse-surface text-surface-bright flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white">Finansal Sağlık &amp; Gelir Hızı</h4>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Pakete Göre Gelir Dağılımı</p>
                  <div className="h-8 w-full bg-surface-container rounded-lg overflow-hidden flex">
                    <div className="h-full bg-primary flex items-center justify-center text-[10px] font-bold text-white border-r border-white/20 width-[52%]" style={{ width: '52%' }}>ENT (52%)</div>
                    <div className="h-full bg-secondary-container flex items-center justify-center text-[10px] font-bold text-white border-r border-white/20" style={{ width: '31%' }}>PRO (31%)</div>
                    <div className="h-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-on-surface" style={{ width: '17%' }}>STD (17%)</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Büyüme vs Daralma Geliri</p>
                  <div className="h-8 w-full bg-surface-container rounded-lg overflow-hidden flex">
                    <div className="h-full bg-tertiary flex items-center justify-center text-[10px] font-bold text-white border-r border-white/20" style={{ width: '88%' }}>YÜKSELTMELER (88%)</div>
                    <div className="h-full bg-error flex items-center justify-center text-[10px] font-bold text-white" style={{ width: '12%' }}>KAYIP (12%)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="bg-white border border-outline/20 rounded p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Gelir Tahmini (90 Gün)</h4>
                <span className="material-symbols-outlined text-outline text-sm">trending_up</span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-outline-variant/10 pb-2">
                  <div>
                    <p className="text-[9px] text-outline uppercase font-bold">Öngörülen Ç4 Sonu</p>
                    <p className="text-lg font-bold font-mono">₺1.238.500</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-tertiary font-bold font-mono">+14.5% (Ç3'e göre)</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[11px] font-mono">
                    <span className="text-outline">Planlanan Yenilemeler</span>
                    <span className="font-bold">₺45.200</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-mono">
                    <span className="text-outline">Beklenen Kayıp</span>
                    <span className="font-bold text-error">-₺2.800</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-mono border-t border-outline-variant/10 pt-2">
                    <span className="font-bold">Net Değişim</span>
                    <span className="font-bold text-tertiary">+₺42.400</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-outline/20 rounded shadow-sm">
              <div className="px-4 py-2 border-b border-outline/20 bg-surface-container-low flex justify-between items-center">
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Risk Göstergeleri</h4>
                <span className="text-[9px] font-bold text-error bg-error/10 px-1 rounded">2 YÜKSEK RİSK</span>
              </div>
              <div className="p-3 divide-y divide-outline/10">
                <div className="py-2">
                  <div className="flex justify-between items-start">
                    <p className="text-[11px] font-bold">Yenileme Riski: İzmir Servis</p>
                    <span className="text-[9px] text-error font-bold">TEHLİKE</span>
                  </div>
                  <p className="text-[10px] text-outline leading-tight mt-1">Kullanım son 14 günde %60 düştü. İptal olasılığı: Yüksek.</p>
                </div>
                <div className="py-2">
                  <div className="flex justify-between items-start">
                    <p className="text-[11px] font-bold">Kredi Kartı Bitiş Süresi</p>
                    <span className="text-[9px] text-secondary-container font-bold">UYARI</span>
                  </div>
                  <p className="text-[10px] text-outline leading-tight mt-1">4 Kurumsal hesabın ödeme yöntemi 30 gün içinde sona eriyor.</p>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded p-4">
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">auto_awesome</span> Analist İçgörüsü
              </h4>
              <p className="text-[11px] leading-relaxed text-on-surface">
                <span className="font-bold">PRO</span> paketinden <span className="font-bold text-primary">KURUMSAL</span> paketine geçiş oranı sektör ortalamasından %18 daha yüksek. Q1 döneminde bu hızı yakalamak için "Kurumsal" özellik sınırını yeniden optimize etmeyi düşünün.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
