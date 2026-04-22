import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";

// Geçiçi mock veriler (İleride Prisma modeline bağlanacak)
const mockTransactions = [
  { id: "TXN-8429103", name: "Ankara Auto Plaza", type: "ENT", amount: "₺12,500.00", method: "Visa ·· 4412", status: "Success", date: "2026-05-21 14:22:01", icon: "credit_card" },
  { id: "TXN-8429104", name: "Merkez Servis A.Ş.", type: "", amount: "₺8,200.00", method: "Banka Havalesi", status: "Pending", date: "2026-05-21 13:45:12", icon: "account_balance" },
  { id: "TXN-8429105", name: "İstanbul Oto Bakım", type: "", amount: "₺15,800.00", method: "Master ·· 1102", status: "Failed", date: "2026-05-21 12:10:55", icon: "credit_card" },
  { id: "TXN-8429106", name: "Butik Oto Servis", type: "", amount: "₺4,500.00", method: "Visa ·· 8823", status: "Success", date: "2026-05-21 11:59:44", icon: "credit_card" },
  { id: "TXN-8429107", name: "Kayseri Motor A.Ş.", type: "", amount: "₺22,100.00", method: "Banka Havalesi", status: "Success", date: "2026-05-21 11:30:22", icon: "account_balance" },
  { id: "TXN-8429108", name: "Ege Servis Grubu", type: "", amount: "₺6,750.00", method: "Master ·· 0042", status: "Pending", date: "2026-05-21 10:15:00", icon: "credit_card" },
  { id: "TXN-8429109", name: "Bursa Otomotiv", type: "", amount: "₺14,200.00", method: "Amex ·· 9911", status: "Success", date: "2026-05-21 09:44:18", icon: "credit_card" },
  { id: "TXN-8429110", name: "Diyarbakır Teknik", type: "", amount: "₺3,100.00", method: "Visa ·· 1211", status: "Failed", date: "2026-05-21 09:12:05", icon: "credit_card" },
];

const mockTenants = [
  { id: "TN-882", name: "Ankara Auto Plaza", sub: "ENTERPRISE", vol: "1,240", rev: "₺84,500.00", share: 17, shareWidth: "75%", color: "bg-primary-container text-white" },
  { id: "TN-104", name: "İstanbul Premium Servis", sub: "ENTERPRISE", vol: "980", rev: "₺72,800.00", share: 15, shareWidth: "62%", color: "bg-primary-container text-white" },
  { id: "TN-441", name: "Merkez Bakım A.Ş.", sub: "PROFESSIONAL", vol: "540", rev: "₺42,200.00", share: 9, shareWidth: "38%", color: "bg-secondary text-white" },
  { id: "TN-219", name: "İzmir Lojistik Teknik", sub: "STANDARD", vol: "210", rev: "₺15,400.00", share: 3, shareWidth: "14%", color: "bg-surface-container-highest text-on-surface" },
];

export default async function PaymentsPage(props: { searchParams?: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "overview";

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Success': return 'status-pill px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight bg-tertiary-fixed text-on-tertiary-fixed';
      case 'Pending': return 'status-pill px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight bg-secondary-container text-white';
      case 'Failed': return 'status-pill px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight bg-error text-white';
      default: return 'status-pill px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight bg-surface-container';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Success': return 'Başarılı';
      case 'Pending': return 'Bekliyor';
      case 'Failed': return 'Başarısız';
      default: return status;
    }
  };

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">account_balance_wallet</span>
            <h2 className="text-sm font-bold tracking-tight uppercase">Ödeme Operasyonları</h2>
          </div>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input
              className="bg-surface-container-low border border-outline/10 rounded py-1 pl-9 pr-3 w-72 text-[11px] focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              placeholder="TXID, İsim veya Kart Son 4 Hane ara..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed rounded border border-tertiary-container/30 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-fixed-variant animate-pulse"></span>
            Ağ: Aktif
          </div>
          <div className="h-4 w-px bg-outline/20"></div>
          <button className="p-1 text-on-surface hover:bg-surface-container rounded relative transition-colors">
            <span className="material-symbols-outlined text-xl">tune</span>
          </button>
          <button className="p-1 text-on-surface hover:bg-surface-container rounded relative transition-colors">
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-error rounded-full border border-white"></span>
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-outline/20 px-6 flex items-center shrink-0 gap-1 overflow-x-auto no-scrollbar">
        <Link href="?tab=overview" className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${tab === 'overview' ? 'font-bold border-b-2 border-primary text-primary bg-primary/5' : 'font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low'}`}>Genel Bakış</Link>
        <Link href="?tab=transactions" className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${tab === 'transactions' ? 'font-bold border-b-2 border-primary text-primary bg-primary/5' : 'font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low'}`}>İşlemler</Link>
        <Link href="?tab=reconciliation" className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${tab === 'reconciliation' ? 'font-bold border-b-2 border-primary text-primary bg-primary/5' : 'font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low'}`}>Mutabakat</Link>
        <Link href="?tab=disputes" className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${tab === 'disputes' ? 'font-bold border-b-2 border-primary text-primary bg-primary/5' : 'font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low'}`}>İtirazlar (Disputes)</Link>
        <Link href="?tab=recurring" className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${tab === 'recurring' ? 'font-bold border-b-2 border-primary text-primary bg-primary/5' : 'font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low'}`}>Düzenli Ödemeler</Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {tab === "overview" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-outline/20 p-3 rounded-lg shadow-sm hover:border-primary/40 transition-all flex justify-between border-l-2 border-l-primary">
                <div>
                  <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-0.5">Aylık Toplam Gelir</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-xl font-bold font-mono text-primary">₺482,190</h3>
                    <span className="text-[10px] text-tertiary-container font-bold">+14.2%</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <svg className="h-[30px] w-[80px]" preserveAspectRatio="none" viewBox="0 0 100 40">
                    <path d="M0 38 L25 30 L50 35 L75 20 L100 5" fill="none" stroke="#00288e" strokeWidth="2"></path>
                  </svg>
                  <p className="text-[8px] text-outline font-mono">30G TREND</p>
                </div>
              </div>
              <div className="bg-white border border-outline/20 p-3 rounded-lg shadow-sm hover:border-primary/40 transition-all flex justify-between border-l-2 border-l-tertiary-fixed">
                <div>
                  <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-0.5">Başarılı İşlemler</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-xl font-bold font-mono text-on-tertiary-fixed-variant">8,432</h3>
                    <span className="text-[10px] text-tertiary-container font-bold">+5.2%</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <svg className="h-[30px] w-[80px]" preserveAspectRatio="none" viewBox="0 0 100 40">
                    <path d="M0 30 L20 25 L40 28 L60 22 L80 18 L100 15" fill="none" stroke="#6ffbbe" strokeWidth="2"></path>
                  </svg>
                  <p className="text-[8px] text-outline font-mono">SAĞLIKLI</p>
                </div>
              </div>
              <div className="bg-white border border-outline/20 p-3 rounded-lg shadow-sm hover:border-primary/40 transition-all flex justify-between border-l-2 border-l-error">
                <div>
                  <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-0.5">Başarısız Ödemeler</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-xl font-bold font-mono text-error">124</h3>
                    <span className="text-[10px] text-error font-bold">+2.1%</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <svg className="h-[30px] w-[80px]" preserveAspectRatio="none" viewBox="0 0 100 40">
                    <path d="M0 10 L20 15 L40 12 L60 20 L80 25 L100 35" fill="none" stroke="#ba1a1a" strokeWidth="2"></path>
                  </svg>
                  <p className="text-[8px] text-outline font-mono">ALARM</p>
                </div>
              </div>
              <div className="bg-white border border-outline/20 p-3 rounded-lg shadow-sm hover:border-primary/40 transition-all flex justify-between">
                <div>
                  <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-0.5">Ort. İşlem Değeri</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-xl font-bold font-mono">₺1,240</h3>
                    <span className="text-[10px] text-outline font-bold">SABİT</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <svg className="h-[30px] w-[80px]" preserveAspectRatio="none" viewBox="0 0 100 40">
                    <path d="M0 20 L25 22 L50 18 L75 21 L100 20" fill="none" stroke="#757684" strokeWidth="2"></path>
                  </svg>
                  <p className="text-[8px] text-outline font-mono">KPI HEDEF</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-8 space-y-4">
                <div className="bg-white border border-outline/20 rounded shadow-sm overflow-hidden">
                  <div className="px-4 py-2 border-b border-outline/20 flex justify-between items-center bg-inverse-surface text-surface-bright">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-primary rounded-full"></span>
                      Gelire Göre En İyi Firmalar (Tenants)
                    </h4>
                    <div className="flex items-center gap-2">
                      <button className="text-[10px] font-bold text-outline hover:text-primary transition-colors">VERİYİ AKTAR</button>
                      <span className="text-outline/40">|</span>
                      <button className="text-[10px] font-bold text-primary">TÜM LİSTE</button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left bg-white">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-[10px] border-b border-outline/20 font-bold text-outline uppercase tracking-tighter bg-surface-container-low">Firma ID</th>
                          <th className="px-3 py-2 text-[10px] border-b border-outline/20 font-bold text-outline uppercase tracking-tighter bg-surface-container-low">Firma Adı</th>
                          <th className="px-3 py-2 text-[10px] border-b border-outline/20 font-bold text-outline uppercase tracking-tighter bg-surface-container-low">Abonelik Türü</th>
                          <th className="px-3 py-2 text-[10px] border-b border-outline/20 font-bold text-outline uppercase tracking-tighter bg-surface-container-low text-center">İşlem Hacmi</th>
                          <th className="px-3 py-2 text-[10px] border-b border-outline/20 font-bold text-outline uppercase tracking-tighter bg-surface-container-low">Toplam Ciro</th>
                          <th className="px-3 py-2 text-[10px] border-b border-outline/20 font-bold text-outline uppercase tracking-tighter bg-surface-container-low">Pazar Payı</th>
                          <th className="px-3 py-2 text-[10px] border-b border-outline/20 font-bold text-outline uppercase tracking-tighter bg-surface-container-low text-right">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono text-xs">
                        {mockTenants.map(t => (
                          <tr key={t.id} className="hover:bg-primary/5 transition-colors border-b border-outline/10">
                            <td className="px-3 py-1.5 text-outline">{t.id}</td>
                            <td className="px-3 py-1.5 font-bold text-on-surface">{t.name}</td>
                            <td className="px-3 py-1.5"><span className={`px-1.5 py-0.5 ${t.color} text-[9px] font-bold rounded`}>{t.sub}</span></td>
                            <td className="px-3 py-1.5 text-center">{t.vol}</td>
                            <td className="px-3 py-1.5 font-bold text-primary">{t.rev}</td>
                            <td className="px-3 py-1.5">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 bg-surface-container rounded-full overflow-hidden">
                                  <div className="h-full bg-primary" style={{ width: t.shareWidth }}></div>
                                </div>
                                <span className="text-[9px]">{t.share}%</span>
                              </div>
                            </td>
                            <td className="px-3 py-1.5 text-right"><span className={`inline-block w-2 h-2 rounded-full ${t.sub === 'STANDARD' ? 'bg-secondary-container' : 'bg-tertiary-fixed'}`}></span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white border border-outline/20 rounded shadow-sm">
                  <div className="px-4 py-2 border-b border-outline/20 flex justify-between items-center bg-inverse-surface text-surface-bright">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">history</span>
                      Son Yüksek Hacimli İşlemler
                    </h4>
                    <div className="flex gap-2">
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-white/10 rounded">CANLI AKIŞ</span>
                    </div>
                  </div>
                  <div className="divide-y divide-outline/10">
                    <div className="px-4 py-2 flex items-center justify-between hover:bg-surface-container-low transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-outline">14:12:02</span>
                        <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm text-primary">shopping_cart</span>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold">₺18,450.00 <span className="text-outline font-normal">kaynak</span> Ege Servis Grubu</p>
                          <p className="text-[9px] text-outline">Fatura: #INV-2026-091 • Ağ Geçidi: Stripe</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-tertiary-fixed bg-on-tertiary-fixed px-2 py-0.5 rounded uppercase">Başarılı</span>
                    </div>
                    <div className="px-4 py-2 flex items-center justify-between hover:bg-surface-container-low transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-outline">13:58:15</span>
                        <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm text-primary">upgrade</span>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold">₺12,000.00 <span className="text-outline font-normal">şuradan:</span> Ankara Auto Plaza</p>
                          <p className="text-[9px] text-outline">Paket Yükseltme: Standard → Enterprise</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-tertiary-fixed bg-on-tertiary-fixed px-2 py-0.5 rounded uppercase">Başarılı</span>
                    </div>
                    <div className="px-4 py-2 flex items-center justify-between hover:bg-surface-container-low transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-outline">13:45:10</span>
                        <div className="w-8 h-8 rounded-full bg-error-container/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm text-error">report</span>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-error">₺22,000.00 <span className="text-outline font-normal">deneme:</span> Marmara Lojistik</p>
                          <p className="text-[9px] text-outline">Hata Kodu: CC_DECLINED • Sağlayıcı: Iyzico</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-error bg-error/10 px-2 py-0.5 rounded uppercase">Reddedildi</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-4 space-y-4">
                <div className="bg-white border border-outline/20 rounded p-4 shadow-sm">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">hub</span>
                    Sanal Pos Performansı
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center font-mono">
                        <span className="text-[10px] font-bold uppercase">Stripe API</span>
                        <span className="text-[10px] font-bold text-tertiary">99.98% SR</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[99%]"></div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center font-mono">
                        <span className="text-[10px] font-bold uppercase">Iyzico Core</span>
                        <span className="text-[10px] font-bold text-tertiary">98.40% SR</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-tertiary-fixed-dim w-[85%]"></div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center font-mono">
                        <span className="text-[10px] font-bold uppercase">Manuel Havale</span>
                        <span className="text-[10px] font-bold text-secondary-container">Bekleyen Kontrol</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-secondary-container w-[45%]"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-outline/20 rounded p-4 shadow-sm">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">sync_alt</span>
                    Abonelik Yenilenme Oranları
                  </h4>
                  <div className="flex items-center gap-6">
                    <div className="relative w-24 h-24">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="50%" cy="50%" fill="transparent" r="40%" stroke="#eff4ff" strokeWidth="12"></circle>
                        <circle cx="50%" cy="50%" fill="transparent" r="40%" stroke="#00288e" strokeDasharray="180 250" strokeLinecap="butt" strokeWidth="12"></circle>
                        <circle cx="50%" cy="50%" fill="transparent" r="40%" stroke="#6ffbbe" strokeDasharray="40 250" strokeDashoffset="-185" strokeLinecap="butt" strokeWidth="12"></circle>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-xs font-bold font-mono">92%</span>
                        <span className="text-[8px] text-outline uppercase">ORTALAMA</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> YENİLENEN</span>
                        <span className="font-bold">88.5%</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono border-t border-outline/10 pt-1">
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed"></span> YENİ ABONE</span>
                        <span className="font-bold">3.5%</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono border-t border-outline/10 pt-1">
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-error"></span> KAYIP (CHURN)</span>
                        <span className="font-bold">2.4%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-error/30 rounded shadow-sm">
                  <div className="px-4 py-2 border-b border-error/10 bg-error/5 flex items-center justify-between">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-error flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      Kritik Ödeme Alarmları
                    </h4>
                    <span className="px-1.5 py-0.5 bg-error text-white text-[9px] font-bold rounded">2 RİSK</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="border-l-2 border-error pl-3">
                      <p className="text-[11px] font-bold">Chargeback İtirazı: ID-442</p>
                      <p className="text-[10px] text-outline leading-tight">Marmara Lojistik ₺5,500 tutarında itiraz başlattı. Saat 18:00'e kadar kanıt sunulmalı.</p>
                      <div className="mt-2 flex gap-2">
                        <button className="text-[9px] font-bold text-primary uppercase underline">YANITLA</button>
                        <button className="text-[9px] font-bold text-outline uppercase">DETAYLAR</button>
                      </div>
                    </div>
                    <div className="border-l-2 border-secondary-container pl-3 pt-1">
                      <p className="text-[11px] font-bold">Havale Gecikmesi</p>
                      <p className="text-[10px] text-outline leading-tight">"BST Main Holding" aktarımı resmi tatil nedeniyle bekletiliyor.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "transactions" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-outline/20 p-3 rounded shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between h-full border-l-2 border-l-secondary-container">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Mutabakat Bkl. Ödemeler</p>
                    <h3 className="text-xl font-bold font-mono">42 <span className="text-xs font-normal text-outline">işlem</span></h3>
                  </div>
                  <span className="material-symbols-outlined text-secondary-container">sync</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-outline font-medium">Toplam: ₺214,500.00</p>
                  <button className="bg-secondary-container text-white text-[9px] font-bold px-2 py-1 rounded hover:opacity-90">TÜMÜNÜ İŞLE</button>
                </div>
              </div>

              <div className="bg-white border border-outline/20 p-3 rounded shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between h-full border-l-2 border-l-error">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-[9px] font-bold text-outline uppercase tracking-widest">İtiraz (Dispute) Kuyruğu</p>
                    <h3 className="text-xl font-bold font-mono">08 <span className="text-xs font-normal text-outline">bekleyen</span></h3>
                  </div>
                  <span className="material-symbols-outlined text-error">gavel</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-error font-bold">&lt; 24s Süresi Kalan</p>
                  <button className="border border-error text-error text-[9px] font-bold px-2 py-1 rounded hover:bg-error/5">KUYRUĞU İNCELE</button>
                </div>
              </div>

              <div className="bg-white border border-outline/20 p-3 rounded shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between h-full border-l-2 border-l-primary">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Başarısız Abonelik Tahsilatı</p>
                    <h3 className="text-xl font-bold font-mono">12 <span className="text-xs font-normal text-outline">deneme</span></h3>
                  </div>
                  <span className="material-symbols-outlined text-primary">event_repeat</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-outline font-medium">Risk Altındaki Gelir: ₺8,400</p>
                  <button className="border border-primary text-primary text-[9px] font-bold px-2 py-1 rounded hover:bg-primary/5">MOTORU ZORLA</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-12">
                <div className="bg-white border border-outline/20 rounded shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-outline/20 flex flex-wrap justify-between items-center bg-surface-container-lowest gap-4">
                    <div className="flex items-center gap-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-3 bg-primary rounded-full"></span>
                        Detaylı İşlem Kaydı
                      </h4>
                      <div className="flex items-center bg-surface-container-low rounded border border-outline/10 p-0.5">
                        <button className="px-2 py-0.5 text-[9px] font-bold bg-white shadow-sm rounded">TÜMÜ</button>
                        <button className="px-2 py-0.5 text-[9px] font-bold text-outline hover:text-on-surface">BAŞARILI</button>
                        <button className="px-2 py-0.5 text-[9px] font-bold text-outline hover:text-on-surface">BAŞARISIZ</button>
                        <button className="px-2 py-0.5 text-[9px] font-bold text-outline hover:text-on-surface">BEKLEYEN</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 border border-outline/20 rounded px-2 py-1 bg-surface-container-low">
                        <span className="material-symbols-outlined text-sm text-outline">calendar_today</span>
                        <span className="text-[10px] font-bold font-mono">2026-05-20 - 2026-05-21</span>
                      </div>
                      <button className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                        <span className="material-symbols-outlined text-sm">download</span>
                        XLSX İNDİR
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left bg-white">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase border-b border-outline/20 bg-surface-container-low whitespace-nowrap">İşlem ID</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase border-b border-outline/20 bg-surface-container-low">Alıcı / Ödeyen</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase border-b border-outline/20 bg-surface-container-low">Tutar</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase border-b border-outline/20 bg-surface-container-low">Yöntem</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase border-b border-outline/20 bg-surface-container-low">Durum</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase border-b border-outline/20 bg-surface-container-low">Tarih</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase border-b border-outline/20 bg-surface-container-low text-right">Aksiyon</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono text-xs">
                        {mockTransactions.map((t) => (
                          <tr key={t.id} className="hover:bg-primary/5 transition-colors border-b border-outline/10">
                            <td className="px-3 py-1.5 text-outline whitespace-nowrap">{t.id}</td>
                            <td className="px-3 py-1.5 font-bold text-on-surface">
                              {t.name}
                              {t.type && <span className="text-[9px] font-normal text-outline opacity-70 ml-1">({t.type})</span>}
                            </td>
                            <td className={`px-3 py-1.5 font-bold ${t.status === 'Failed' ? 'text-error' : 'text-on-surface'}`}>{t.amount}</td>
                            <td className="px-3 py-1.5 whitespace-nowrap">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm opacity-60">{t.icon}</span>
                                {t.method}
                              </span>
                            </td>
                            <td className="px-3 py-1.5"><span className={getStatusStyle(t.status)}>{getStatusText(t.status)}</span></td>
                            <td className="px-3 py-1.5 text-outline text-[10px] whitespace-nowrap">{t.date}</td>
                            <td className="px-3 py-1.5 text-right"><button className="material-symbols-outlined text-sm text-outline hover:text-primary transition-colors">visibility</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2 border-t border-outline/10 flex justify-between items-center bg-surface-container-low">
                    <p className="text-[9px] font-bold text-outline uppercase">248 İŞLEMDEN 1-8 GÖSTERİLİYOR</p>
                    <div className="flex gap-1">
                      <button className="w-6 h-6 flex items-center justify-center border border-outline/20 rounded hover:bg-white transition-colors" disabled><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                      <button className="w-6 h-6 flex items-center justify-center border border-primary bg-primary text-white rounded text-[10px] font-bold transition-colors">1</button>
                      <button className="w-6 h-6 flex items-center justify-center border border-outline/20 rounded hover:bg-white text-outline text-[10px] font-bold transition-colors">2</button>
                      <button className="w-6 h-6 flex items-center justify-center border border-outline/20 rounded hover:bg-white text-outline text-[10px] font-bold transition-colors">3</button>
                      <button className="w-6 h-6 flex items-center justify-center border border-outline/20 rounded hover:bg-white text-outline transition-colors"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {(tab === "reconciliation" || tab === "disputes" || tab === "recurring") && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 mt-12 text-center bg-surface-container-lowest border border-outline/20 rounded shadow-sm">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
              <span className="material-symbols-outlined text-4xl text-outline/40">construction</span>
            </div>
            <h3 className="text-lg font-bold font-mono tracking-tight text-on-surface mb-2">Bu Sekme Yapım Aşamasında</h3>
            <p className="text-outline text-xs max-w-sm">
              Bu alan ilerleyen fazlarda gerçek API entegrasyonu (Iyzico / Stripe vs.) geldiğinde eklenecektir. Şimdilik sadece Genel Bakış ve İşlemler (Overview / Transactions) panelleri aktiftir.
            </p>
          </div>
        )}

      </div>

      <SuperAdminFooter />
    </>
  );
}
