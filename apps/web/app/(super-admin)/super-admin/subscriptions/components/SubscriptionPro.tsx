import React from "react";

export default function SubscriptionPro() {
  return (
    <>
      <div className="bg-white border-b border-outline/20 px-6 flex items-center gap-1 shrink-0">
        <button className="px-4 py-2 text-xs font-bold border-b-2 border-primary text-primary bg-primary/5 transition-colors">PRO Genel Bakış</button>
        <button className="px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors border-b-2 border-transparent">Karşılaştırma Matrisi</button>
        <button className="px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors border-b-2 border-transparent">Gelir Analitiği</button>
        <button className="px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors border-b-2 border-transparent">Geçiş Logları</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-container-lowest">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-8 flex gap-4">
            <div className="flex-1 bg-white border border-outline/20 p-3 rounded-lg shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between border-l-4 border-l-secondary">
              <div>
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-widest">PRO Paket Taban Fiyatı</p>
                  <span className="material-symbols-outlined text-secondary text-sm">edit</span>
                </div>
                <h3 className="text-2xl font-bold font-mono text-on-surface mt-1">₺8.200,00<span className="text-xs font-medium text-outline font-sans"> /ay</span></h3>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="bg-surface-container-low p-2 rounded">
                  <p className="text-[8px] font-bold text-outline uppercase">Aktif Müşteriler</p>
                  <p className="text-sm font-bold font-mono text-primary">39 Kiracı (Tenant)</p>
                </div>
                <div className="bg-surface-container-low p-2 rounded">
                  <p className="text-[8px] font-bold text-outline uppercase">MRR Katkısı</p>
                  <p className="text-sm font-bold font-mono text-primary">₺319.800</p>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-white border border-outline/20 p-3 rounded-lg shadow-sm hover:border-primary/40 transition-all">
              <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Yapılandırılabilir Seçenekler</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-medium">Eklenti: Gelişmiş SMS</span>
                  <span className="text-[10px] font-bold text-tertiary-fixed bg-tertiary px-1 rounded">ETKİN</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-medium">Eklenti: Çoklu Şube (Multi-Warehouse)</span>
                  <span className="text-[10px] font-bold text-outline bg-surface-container px-1 rounded">OPSİYONEL</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-medium">Maksimum API Çağrısı / Gün</span>
                  <span className="font-mono font-bold text-primary">50.000</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 bg-white border border-outline/20 rounded-lg p-3 shadow-sm">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-3">Paket Sağlığı &amp; Elde Tutma</p>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" fill="transparent" r="30%" stroke="#eff4ff" strokeWidth="6"></circle>
                  <circle cx="50%" cy="50%" fill="transparent" r="30%" stroke="#00288e" strokeDasharray="160 200" strokeLinecap="round" strokeWidth="6"></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold font-mono">92%</div>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold">Elde Tutma Puanı</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xs font-bold text-tertiary">Mükemmel</span>
                  <span className="text-[9px] text-outline">(Aylık +2.4%)</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-end border-t border-outline/10 pt-3">
              <div>
                <p className="text-[9px] font-bold text-outline uppercase mb-1">Kayıp Eğilimi</p>
                <div className="flex flex-col gap-1">
                  <div className="text-[9px] bg-error/10 text-error px-1.5 py-0.5 rounded font-bold uppercase w-fit">STD'ye Düşen: 1.2%</div>
                  <div className="text-[9px] bg-tertiary/10 text-tertiary px-1.5 py-0.5 rounded font-bold uppercase w-fit">ENT'ye Çıkan: 4.8%</div>
                </div>
              </div>
              <svg className="h-[24px] w-[60px]" preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0 30 L20 28 L40 25 L60 22 L80 15 L100 5" fill="none" stroke="#6ffbbe" strokeWidth="2.5"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-outline/20 rounded shadow-sm overflow-hidden">
          <div className="px-4 py-2 border-b border-outline/20 flex justify-between items-center bg-surface-container-lowest">
            <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-3 bg-secondary rounded-full"></span>
              Paket Özellik Matrisi Karşılaştırması
            </h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary/10 border border-primary/20"></span>
                <span className="text-[9px] font-bold text-outline">STANDART</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
                <span className="text-[9px] font-bold text-outline">PROFESSIONAL</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="text-[9px] font-bold text-outline">ENTERPRISE</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="w-1/4 px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30">Özellik / Limit Türü</th>
                  <th className="w-1/4 text-center px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30">STANDART</th>
                  <th className="w-1/4 text-center px-3 py-2 text-[10px] font-bold uppercase tracking-tighter border-b border-outline-variant/30 bg-primary/5 border-x border-primary/20 text-secondary">PRO (MEVCUT)</th>
                  <th className="w-1/4 text-center px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30">ENTERPRISE</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                <tr className="hover:bg-surface-container-low/50">
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 font-bold text-on-surface font-sans">Aylık Temel Fiyatlandırma</td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center">₺2.500,00</td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center bg-primary/5 border-x border-primary/20 font-bold text-primary">₺8.200,00</td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center font-sans">Özel Teklif</td>
                </tr>
                <tr className="hover:bg-surface-container-low/50">
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 font-bold text-on-surface font-sans">Aylık Toplam Servis Kaydı</td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center">500</td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center bg-primary/5 border-x border-primary/20 font-bold text-primary">5.000</td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center font-sans">Sınırsız</td>
                </tr>
                <tr className="hover:bg-surface-container-low/50">
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 font-bold text-on-surface font-sans">Eşzamanlı Personel Erişimi</td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center">3</td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center bg-primary/5 border-x border-primary/20 font-bold text-primary">15</td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center font-sans">Sınırsız</td>
                </tr>
                <tr className="hover:bg-surface-container-low/50">
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 font-bold text-on-surface font-sans">Entegre YZ Teşhis Modülü</td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center"><span className="material-symbols-outlined text-outline text-sm">close</span></td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center bg-primary/5 border-x border-primary/20"><span className="material-symbols-outlined text-tertiary-fixed-variant text-sm">check_circle</span></td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center"><span className="material-symbols-outlined text-tertiary-fixed-variant text-sm">check_circle</span></td>
                </tr>
                <tr className="hover:bg-surface-container-low/50">
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 font-bold text-on-surface font-sans">White-label Mobil Uygulama</td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center"><span className="material-symbols-outlined text-outline text-sm">close</span></td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center bg-primary/5 border-x border-primary/20 font-sans"><span className="text-[9px] bg-secondary-container/20 text-secondary-container px-1 py-0.5 rounded font-bold">OPSİYONEL</span></td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center"><span className="material-symbols-outlined text-tertiary-fixed-variant text-sm">check_circle</span></td>
                </tr>
                <tr className="hover:bg-surface-container-low/50">
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 font-bold text-on-surface font-sans">Gelişmiş Stok Modülü</td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center"><span className="material-symbols-outlined text-outline text-sm">close</span></td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center bg-primary/5 border-x border-primary/20"><span className="material-symbols-outlined text-tertiary-fixed-variant text-sm">check_circle</span></td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center"><span className="material-symbols-outlined text-tertiary-fixed-variant text-sm">check_circle</span></td>
                </tr>
                <tr className="hover:bg-surface-container-low/50">
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 font-bold text-on-surface font-sans">Veri Saklama Politikası</td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center font-sans">1 Yıl</td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center bg-primary/5 border-x border-primary/20 font-bold text-primary font-sans">5 Yıl</td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center font-sans">Süresiz</td>
                </tr>
                <tr className="hover:bg-surface-container-low/50">
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 font-bold text-on-surface font-sans">API Webhook Erişimi</td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center"><span className="material-symbols-outlined text-outline text-sm">close</span></td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center bg-primary/5 border-x border-primary/20"><span className="material-symbols-outlined text-tertiary-fixed-variant text-sm">check_circle</span></td>
                  <td className="px-3 py-1.5 border-b border-outline-variant/10 text-center"><span className="material-symbols-outlined text-tertiary-fixed-variant text-sm">check_circle</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-7">
            <div className="bg-white border border-outline/20 rounded shadow-sm">
              <div className="px-4 py-2 border-b border-outline/20 flex justify-between items-center bg-inverse-surface text-surface-bright">
                <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-white">
                  <span className="material-symbols-outlined text-sm">history_edu</span>
                  Paket Geçiş Eğilimleri (Son 30 Gün)
                </h4>
              </div>
              <div className="p-0 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30">Zaman Damgası</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30">Müşteri</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30">Yön</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30">Geçiş Nedeni</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 text-right">Gelir Farkı (Δ)</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[10px]">
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-3 py-1.5 border-b border-outline-variant/10 text-xs">2026-05-24 10:12</td>
                      <td className="px-3 py-1.5 border-b border-outline-variant/10 font-bold text-xs font-sans">Ege Otomotiv</td>
                      <td className="px-3 py-1.5 border-b border-outline-variant/10 text-xs"><span className="text-tertiary font-bold">STD ➔ PRO</span></td>
                      <td className="px-3 py-1.5 border-b border-outline-variant/10 text-xs font-sans">Kapasite Aşımı</td>
                      <td className="px-3 py-1.5 border-b border-outline-variant/10 text-right text-tertiary font-bold text-xs">+₺5.700,00</td>
                    </tr>
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-3 py-1.5 border-b border-outline-variant/10 text-xs">2026-05-23 15:45</td>
                      <td className="px-3 py-1.5 border-b border-outline-variant/10 font-bold text-xs font-sans">Asya Servis</td>
                      <td className="px-3 py-1.5 border-b border-outline-variant/10 text-xs"><span className="text-secondary-container font-bold">PRO ➔ ENT</span></td>
                      <td className="px-3 py-1.5 border-b border-outline-variant/10 text-xs font-sans">Şube Genişlemesi</td>
                      <td className="px-3 py-1.5 border-b border-outline-variant/10 text-right text-primary font-bold text-xs">+₺22.000,00</td>
                    </tr>
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="px-3 py-1.5 border-b border-outline-variant/10 text-xs">2026-05-21 09:20</td>
                      <td className="px-3 py-1.5 border-b border-outline-variant/10 font-bold text-xs font-sans">Liman Teknik</td>
                      <td className="px-3 py-1.5 border-b border-outline-variant/10 text-xs"><span className="text-error font-bold">PRO ➔ STD</span></td>
                      <td className="px-3 py-1.5 border-b border-outline-variant/10 text-xs font-sans">Maliyet Optimizasyonu</td>
                      <td className="px-3 py-1.5 border-b border-outline-variant/10 text-right text-error font-bold text-xs">-₺5.700,00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5 space-y-4">
            <div className="bg-white border border-outline/20 rounded p-4 shadow-sm">
              <h4 className="text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">monitoring</span>
                Paket Yükseltme Hazırlığı (STD Müşterileri)
              </h4>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-[10px] font-bold font-sans">Limit Doluluk Oranı (Ort)</span>
                    <span className="text-[10px] font-bold text-secondary-container">84%</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-secondary-container w-[84%]"></div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-[10px] font-bold font-sans">Özellik Etkileşimi</span>
                    <span className="text-[10px] font-bold text-tertiary">Yüksek</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-tertiary-fixed-dim w-[72%]"></div>
                  </div>
                </div>
                <div className="mt-4 p-2 bg-primary/5 border border-primary/20 rounded">
                  <p className="text-[9px] text-primary font-bold">ÖNGÖRÜ: Önümüzdeki 30 gün içinde toplamda 12 adet PRO pakete yükseltme potansiyeli.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
