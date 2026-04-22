import React from "react";
import Link from "next/link";
import { getMusteriPanelData } from "@/lib/actions/mobile.actions";

export const metadata = {
  title: "Müşteri Paneli | MS Oto Servis",
};

export default async function MusteriPanelPage() {
  const result = await getMusteriPanelData();

  if (result.error || !result.customer) {
    return (
      <main className="mt-8 px-6 space-y-8 flex flex-col items-center justify-center pt-20">
        <span className="material-symbols-outlined text-border text-6xl mb-4">error</span>
        <h2 className="text-xl font-bold mb-2">Hata Oluştu / Veri Yok</h2>
        <p className="text-on-surface-variant text-center">{result.error || "Müşteri bilgisi bulunamadı."}</p>
      </main>
    );
  }

  const { customer, vehicles, reminders } = result;

  // Tespit edilen aktif servis aracı
  let activeVehicle = vehicles.length > 0 ? vehicles[0] : null;
  let activeOrder: any = null;

  for (const v of vehicles) {
    if (v.serviceOrders && v.serviceOrders.length > 0) {
      activeVehicle = v;
      activeOrder = v.serviceOrders[0];
      break;
    }
  }

  // WAITING_APPROVAL durumundaki servis emirleri
  const waitingApprovalOrders = vehicles.flatMap(v =>
    (v.serviceOrders ?? []).filter((o: any) => o.status === "WAITING_APPROVAL")
  );

  return (
    <main className="px-6 pt-2 space-y-6 pb-32">
      {/* Onay Bekliyor Uyarısı */}
      {waitingApprovalOrders.length > 0 && (
        <section>
          {waitingApprovalOrders.map((order: any) => (
            <div key={order.id} className="bg-error-container/20 rounded-2xl p-4 flex items-center gap-3 shadow-sm animate-pulse-subtle">
              <div className="w-11 h-11 bg-error-container rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-error text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>notification_important</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-on-error-container text-sm">Onayınız Bekleniyor</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">İş Emri #{order.orderNumber} için onay gerekiyor.</p>
              </div>
              {order.approvalToken && (
                <a href={`/onay/${order.approvalToken}`} className="bg-error text-white text-[10px] font-bold px-3 py-2 rounded-xl active:scale-95 transition-transform shrink-0">
                  İncele
                </a>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Welcome Section - Stitch Style */}
      <section>
        <div className="bg-surface-container-lowest rounded-[1.75rem] p-6 shadow-[0_2px_16px_rgba(30,58,138,0.04)]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-on-surface-variant text-[13px] font-medium">Hoş Geldiniz,</p>
              <h2 className="text-[22px] font-extrabold tracking-tight text-primary leading-tight mt-0.5">{customer.firstName} {customer.lastName}!</h2>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span> {customer.membershipTier}
              </span>
              <p className="text-lg font-bold text-secondary">{customer.rewardPoints} <span className="text-[10px] text-on-surface-variant font-medium">puan</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Aktif Servis Kartı - Stitch "Active Service Card" */}
      <section>
        {activeOrder ? (
          <Link href={`/m/musteri/takip`} className="block">
            <div className="bg-gradient-to-br from-primary via-primary to-blue-800 rounded-[1.75rem] p-6 text-white relative overflow-hidden shadow-lg shadow-primary/20">
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
              <div className="absolute right-4 bottom-4 opacity-10">
                <span className="material-symbols-outlined text-[80px]">settings_suggest</span>
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[9px] font-bold tracking-[0.2em] uppercase bg-white/15 backdrop-blur-sm px-3 py-1 rounded-lg">
                    {activeOrder.isUrgent ? "⚡ ACİL SERVİSTE" : "🔧 ARACINIZ SERVİSTE"}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold mb-1 tracking-tight">{activeVehicle?.brand} {activeVehicle?.model}</h3>
                <p className="text-white/70 text-sm font-mono tracking-widest mb-5">{activeVehicle?.plate}</p>

                <div className="flex items-center gap-2 text-[11px] font-medium text-white/80 mb-4">
                  <span className="material-symbols-outlined text-base">engineering</span>
                  Sorumlu: {activeOrder.assignedMechanic?.firstName || "Atanıyor..."}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold tracking-wider">
                    <span>SERVİS İLERLEMESİ</span>
                    <span>%{activeOrder.completionPercentage}</span>
                  </div>
                  <div className="h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5">
                    <div className="h-full bg-gradient-to-r from-secondary-container to-secondary rounded-full shadow-[0_0_12px_rgba(253,118,26,0.4)]" style={{ width: `${activeOrder.completionPercentage}%` }}></div>
                  </div>
                  <p className="text-[10px] text-white/50 text-right">Detayları Görüntüle →</p>
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <div className="bg-surface-container-highest rounded-[1.75rem] p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm shrink-0">
              <span className="material-symbols-outlined text-2xl">garage</span>
            </div>
            <div>
              <p className="font-bold text-on-surface">Serviste İşlem Yok</p>
              <p className="text-[11px] text-on-surface-variant">Aracınız için aktif bir servis kaydı bulunamadı.</p>
            </div>
          </div>
        )}
      </section>

      {/* Hızlı İşlemler - Stitch "Quick Actions Grid" */}
      <section>
        <h3 className="text-[15px] font-bold tracking-tight text-on-surface mb-3">Hızlı İşlemler</h3>
        <div className="grid grid-cols-3 gap-3">
          <QuickActionCard href="/m/musteri/randevu" icon="event_available" label="Randevu Al" color="primary" />
          <QuickActionCard href="/m/musteri/arac-ekle" icon="add_box" label="Araç Ekle" color="secondary" />
          <QuickActionCard href="#araclarim-section" icon="directions_car" label="Araçlarım" color="tertiary" />
          <QuickActionCard href="/m/musteri/gecmis" icon="history" label="Servis Geçmişi" color="primary" />
          <QuickActionCard href="/m/musteri/bakimlar" icon="build_circle" label="Bakımlarım" color="secondary" />
          <QuickActionCard href="/m/musteri/mesajlar" icon="chat" label="Mesajlar" color="tertiary" />
          <QuickActionCard href="/m/musteri/odemeler" icon="payments" label="Ödemeler" color="primary" />
          <QuickActionCard href="/m/musteri/profil" icon="person" label="Profil" color="secondary" />
        </div>
      </section>

      {/* Araçlarım - Yatay Scroll Kartları */}
      <section id="araclarim-section" className="scroll-mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-bold tracking-tight text-on-surface">Araçlarım</h3>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-on-surface-variant flex items-center">
              {vehicles.length} Araç
            </span>
            <Link href="/m/musteri/arac-ekle" className="text-[11px] font-bold text-primary flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-full active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-[13px]">add</span> Ekle
            </Link>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
          {vehicles.length > 0 ? vehicles.map(v => (
            <div key={v.id} className="min-w-[260px] bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between mb-3">
                <div>
                  <h4 className="font-bold text-on-surface text-[15px]">{v.brand} {v.model}</h4>
                  <p className="text-[11px] font-mono tracking-widest text-on-surface-variant mt-0.5">{v.plate}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold mb-3">
                {v.serviceOrders && v.serviceOrders.length > 0 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                    <span className="text-secondary">Serviste</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-emerald-600">Hazır</span>
                  </>
                )}
              </div>
              <div className="pt-3 border-t border-outline-variant/15 flex items-center justify-between">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Kilometre</span>
                <span className="text-sm font-bold text-on-surface">{new Intl.NumberFormat('tr-TR').format(v.mileage)} km</span>
              </div>
            </div>
          )) : (
            <div className="text-sm text-on-surface-variant px-2">Kayıtlı aracınız yok.</div>
          )}
        </div>
      </section>

      {/* Son İşlemler (Stitch) */}
      <section>
        <h3 className="text-[15px] font-bold tracking-tight text-on-surface mb-3">Son İşlemler</h3>
        <div className="space-y-2.5">
          {vehicles.flatMap(v => (v.serviceOrders ?? []).slice(0, 3).map((o: any) => (
            <div key={o.id} className="bg-surface-container-lowest rounded-xl p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${o.status === 'COMPLETED' ? 'bg-tertiary-fixed text-tertiary' :
                  o.status === 'IN_PROGRESS' ? 'bg-primary-fixed text-primary' :
                    o.status === 'WAITING_APPROVAL' ? 'bg-error-container text-error' :
                      'bg-surface-container text-on-surface-variant'
                }`}>
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{
                  o.status === 'COMPLETED' ? 'check_circle' :
                    o.status === 'IN_PROGRESS' ? 'build' :
                      o.status === 'WAITING_APPROVAL' ? 'pending' :
                        'schedule'
                }</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-on-surface text-[13px] truncate">{o.complaintDescription || "Servis Bakımı"}</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5">
                  {v.plate} • İş Emri #{o.orderNumber}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${o.status === 'COMPLETED' ? 'bg-tertiary-fixed text-tertiary' :
                    o.status === 'IN_PROGRESS' ? 'bg-primary-fixed text-primary' :
                      o.status === 'WAITING_APPROVAL' ? 'bg-error-container/50 text-error' :
                        'bg-surface-container text-on-surface-variant'
                  }`}>
                  {o.status === 'COMPLETED' ? 'TAMAM' :
                    o.status === 'IN_PROGRESS' ? 'DEVAM' :
                      o.status === 'WAITING_APPROVAL' ? 'ONAY' :
                        'BEKLİYOR'}
                </span>
              </div>
            </div>
          )))}
          {vehicles.flatMap(v => v.serviceOrders ?? []).length === 0 && (
            <div className="text-sm text-on-surface-variant text-center py-6">Henüz servis kaydı yok.</div>
          )}
        </div>
      </section>

      {/* Yaklaşan Hatırlatmalar */}
      {reminders && reminders.length > 0 && (
        <section>
          <h3 className="text-[15px] font-bold tracking-tight text-on-surface mb-3">Hatırlatmalar</h3>
          <div className="space-y-2">
            {reminders.map((r: any) => (
              <div key={r.id} className={`bg-surface-container-lowest p-4 rounded-xl flex items-center gap-3 shadow-sm ${r.type === 'WARNING' ? 'ring-1 ring-error/20' : ''}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${r.type === 'WARNING' ? 'bg-error-container text-error' : 'bg-primary-fixed text-primary'}`}>
                  <span className="material-symbols-outlined text-lg">{r.icon}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-[13px] font-bold text-on-surface">{r.title}</h4>
                  <p className="text-[10px] text-on-surface-variant">{r.desc}</p>
                </div>
                {r.type === 'WARNING' && <span className="bg-error text-white text-[9px] font-bold px-2 py-0.5 rounded">ACİL</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SOS Button */}
      <section className="pb-4">
        <button className="w-full bg-error p-4 rounded-2xl flex items-center justify-center gap-3 text-white font-extrabold tracking-tight shadow-lg shadow-error/20 active:scale-[0.98] transition-transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>emergency_share</span>
          SOS ACİL YOL YARDIMI
        </button>
      </section>
    </main>
  );
}

function QuickActionCard({ href, icon, label, color }: { href: string; icon: string; label: string; color: string }) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary-fixed text-primary",
    secondary: "bg-secondary-fixed text-secondary",
    tertiary: "bg-tertiary-fixed text-tertiary"
  };
  return (
    <Link href={href} className="bg-surface-container-lowest p-4 rounded-2xl flex flex-col items-center gap-2.5 text-center transition-transform active:scale-95 shadow-sm">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.primary}`}>
        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <span className="text-[11px] font-bold text-on-surface leading-tight">{label}</span>
    </Link>
  );
}
