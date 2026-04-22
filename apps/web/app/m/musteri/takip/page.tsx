import React from "react";
import { getCustomerOverview } from "@/lib/actions/musteri.actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";

export const metadata = {
  title: "Canlı Servis Takip | Müşteri Portalı",
};

export default async function MusteriTakipPage() {
  const result = await getCustomerOverview();

  if (result.error || !result.vehicle) {
    return (
      <div className="flex flex-col items-center justify-center p-8 mt-20">
        <span className="material-symbols-outlined text-border text-6xl mb-4">error</span>
        <h2 className="text-xl font-bold mb-2">Bilgi Bulunamadı</h2>
        <p className="text-on-surface-variant text-center">{result.error}</p>
      </div>
    );
  }

  const { vehicle, customer, activeOrder } = result;

  if (!activeOrder) {
    return (
      <div className="flex flex-col items-center justify-center p-8 mt-20 space-y-4">
        <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center text-primary/30">
          <span className="material-symbols-outlined text-5xl">inventory_2</span>
        </div>
        <h2 className="text-xl font-extrabold text-on-surface text-center mt-2">Aktif İşlem Yok</h2>
        <p className="text-on-surface-variant text-center text-sm px-4 leading-relaxed">
          Şu anda <strong>{vehicle.plate}</strong> plakalı aracınız için devam eden bir servis kaydı bulunmuyor.
        </p>
        <Link 
          href="/m/musteri/panel"
          className="bg-primary text-white font-bold py-3 px-8 rounded-xl mt-6 active:scale-95 transition-transform"
        >
          Panele Dön
        </Link>
      </div>
    );
  }

  // Servis aşamaları
  const steps = [
    { id: "PENDING", title: "Kabul Edildi", desc: "Araç giriş işlemleri tamamlandı.", icon: "login", emoji: "📋" },
    { id: "IN_PROGRESS", title: "Onarım Sürüyor", desc: "Onarım ve parça değişimleri yapılıyor.", icon: "build", emoji: "🔧" },
    { id: "WAITING_APPROVAL", title: "Test & Kontrol", desc: "Kalite kontrol gerçekleştiriliyor.", icon: "fact_check", emoji: "✅" },
    { id: "COMPLETED", title: "Teslime Hazır", desc: "Araç yıkama ve son kontrol tamamlandı.", icon: "task_alt", emoji: "🚗" }
  ];

  const currentStatusIndex = steps.findIndex(s => s.id === activeOrder.status);
  const activeIndex = currentStatusIndex === -1 ? 0 : currentStatusIndex;
  const progressPercent = ((activeIndex + 1) / steps.length) * 100;

  return (
    <main className="px-6 pt-4 space-y-6 max-w-md mx-auto pb-32">
      {/* Hero Status Card */}
      <section className="relative">
        <div className="bg-gradient-to-br from-primary via-primary to-blue-900 text-white p-6 rounded-[1.75rem] shadow-lg shadow-primary/20 overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute right-4 bottom-3 opacity-[0.06]">
            <span className="material-symbols-outlined text-[100px]">settings_suggest</span>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Aktif Servis Kaydı</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight mb-0.5">{vehicle.plate}</h1>
            <p className="text-sm text-white/70">{vehicle.brand} {vehicle.model}</p>
            <p className="text-[12px] text-white/60 mt-1 line-clamp-1">{activeOrder.complaintDescription || "Genel Bakım"}</p>

            <div className="mt-5 flex items-center gap-2 bg-white/10 backdrop-blur-sm w-max px-3 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-secondary-fixed text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{steps[activeIndex]?.icon}</span>
              <span className="text-[11px] font-bold">{steps[activeIndex]?.title}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Usta Bilgi Kartı */}
      {(activeOrder as any).assignedMechanic && (
        <section className="bg-surface-container-lowest rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>engineering</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Sorumlu Usta</p>
            <p className="font-bold text-on-surface text-[15px] truncate">
              {(activeOrder as any).assignedMechanic.firstName} {(activeOrder as any).assignedMechanic.lastName}
            </p>
          </div>
          <Link href="/m/musteri/mesajlar" className="bg-primary text-white text-[10px] font-bold px-3 py-2 rounded-lg active:scale-95 transition-transform flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">chat</span>
            Mesaj
          </Link>
        </section>
      )}

      {/* Servis Aşamaları Timeline */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-[17px] font-bold text-on-surface">Servis Aşamaları</h2>
          <span className="text-[11px] font-bold text-primary">%{Math.round(progressPercent)} Tamamlandı</span>
        </div>
        
        <div className="relative pl-8 space-y-8">
          {/* Dikey İlerleme Çizgisi */}
          <div className="absolute left-[11px] top-2 bottom-2 w-[3px] bg-surface-container-highest rounded-full overflow-hidden">
            <div 
              className="w-full bg-gradient-to-b from-primary to-secondary-container transition-all duration-1000 ease-out"
              style={{ height: `${progressPercent}%` }}
            ></div>
          </div>

          {steps.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            const isUpcoming = idx > activeIndex;

            return (
              <div key={step.id} className={`relative ${isUpcoming ? 'opacity-35' : ''} transition-opacity`}>
                <div className={`absolute -left-[27px] top-0.5 w-[22px] h-[22px] rounded-full flex items-center justify-center z-10 transition-all
                   ${isCompleted ? 'bg-primary shadow-md shadow-primary/30' : 
                     (isCurrent ? 'bg-secondary-container ring-4 ring-secondary-fixed/30 shadow-md shadow-secondary/20' : 
                       'bg-surface-container-highest')}
                `}>
                  {(!isUpcoming) && (
                    <span className="material-symbols-outlined text-[11px] text-white font-bold" 
                       style={{ fontVariationSettings: isCurrent ? "'FILL' 1" : "'FILL' 0" }}>
                      {isCompleted ? 'check' : step.icon}
                    </span>
                  )}
                </div>

                {isCurrent ? (
                  <div className="bg-surface-container-low p-4 rounded-xl -ml-1 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{step.emoji}</span>
                        <h3 className="text-[15px] font-bold text-primary">{step.title}</h3>
                      </div>
                      <span className="text-[9px] font-bold uppercase bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded animate-pulse">GÜNCEL</span>
                    </div>
                    <p className="text-[13px] text-on-surface-variant font-medium leading-relaxed">{step.desc}</p>
                    {activeOrder.promisedDeliveryDate && (
                      <p className="text-[11px] text-primary font-bold mt-3 bg-primary/5 p-2 rounded-lg flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        Tahmini: {format(new Date(activeOrder.promisedDeliveryDate), "dd MMM HH:mm", { locale: tr })}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-0.5 pt-0.5">
                    <h3 className="text-[14px] font-bold text-on-surface">{step.title}</h3>
                    <p className="text-[12px] text-on-surface-variant leading-relaxed">{step.desc}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Maliyet Özeti - Stitch Style */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-5">Maliyet Özeti</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-lg">inventory_2</span>
              </span>
              <div>
                <p className="text-[13px] font-bold text-on-surface">Yedek Parça</p>
                <p className="text-[10px] text-on-surface-variant">Kullanılan parçalar</p>
              </div>
            </div>
            <span className="text-[14px] font-bold text-on-surface">
              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(activeOrder.subTotal || 0))}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-lg">engineering</span>
              </span>
              <div>
                <p className="text-[13px] font-bold text-on-surface">İşçilik</p>
                <p className="text-[10px] text-on-surface-variant">Usta hizmet bedeli</p>
              </div>
            </div>
            <span className="text-[14px] font-bold text-on-surface">
              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(activeOrder.taxAmount || 0))}
            </span>
          </div>
        </div>

        <div className="pt-5 mt-4 border-t border-outline-variant/15 flex justify-between items-end">
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Genel Toplam</p>
            <p className="text-[9px] text-secondary italic font-medium mt-0.5">KDV Dahil</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-primary">
              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(activeOrder.totalAmount || 0))}
            </p>
          </div>
        </div>
        
        {activeIndex === 3 && (
          <button className="w-full mt-5 bg-primary text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md shadow-primary/20">
            <span className="material-symbols-outlined">credit_card</span>
            Ödeme Yap
          </button>
        )}
      </section>

      {/* Teslim Bilgisi */}
      {activeOrder.promisedDeliveryDate && (
        <section className="bg-tertiary-fixed/30 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary shrink-0">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Tahmini Teslim</p>
            <p className="font-bold text-on-surface text-[15px]">
              {format(new Date(activeOrder.promisedDeliveryDate), "dd MMMM yyyy, HH:mm", { locale: tr })}
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
