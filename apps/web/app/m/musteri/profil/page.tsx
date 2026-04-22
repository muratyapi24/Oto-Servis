import React from "react";
import { getCustomerOverview } from "@/lib/actions/musteri.actions";
import { format, addMonths } from "date-fns";
import { tr } from "date-fns/locale";
import DataRightsSection from "./DataRightsSection";

export const metadata = {
  title: "Profil & Araç Sağlığı | Müşteri Portalı",
};

export default async function MusteriProfilPage() {
  const result = await getCustomerOverview();

  if (result.error || !result.vehicle) {
    return (
      <div className="flex flex-col items-center justify-center p-8 mt-20">
        <span className="material-symbols-outlined text-border text-6xl mb-4">error</span>
        <h2 className="text-xl font-bold mb-2">Hata Oluştu</h2>
        <p className="text-on-surface-variant text-center">{result.error}</p>
      </div>
    );
  }

  const { vehicle, customer, recentOrders } = result;

  // Mocking Health Score logic based on Mileage and Model Year
  const currentYear = new Date().getFullYear();
  const age = currentYear - (vehicle.year ?? currentYear);
  const healthPenalty = age * 1.5 + (vehicle.mileage / 10000) * 2;
  const healthScore = Math.max(0, Math.min(100, Math.round(100 - healthPenalty)));
  
  // Fake next maintenance date (6 months after last service, or today+6mo)
  const lastServiceDate = recentOrders?.[0]?.createdAt ? new Date(recentOrders[0].createdAt) : new Date();
  const nextMaintenance = addMonths(lastServiceDate, 6);

  // Loyalty calculations (fake logic based on number of orders)
  const completedOrders = recentOrders?.filter((o: any) => o.status === "COMPLETED") || [];
  const loyaltyPoints = completedOrders.length * 350 + 150; // Every completed order gives 350 points + base 150
  
  return (
    <main className="px-6 pt-6 space-y-8 max-w-md mx-auto pb-32">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">Profil & Sadakat</h1>
        <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container font-bold shadow-sm border border-primary/20">
           {customer.firstName ? customer.firstName.charAt(0) : "M"}
        </div>
      </div>

      {/* Hero: Vehicle Health Score (Bento Style) */}
      <section className="grid grid-cols-12 gap-4">
        <div className="col-span-12 p-6 rounded-2xl shadow-lg shadow-primary/10 relative overflow-hidden bg-gradient-to-br from-primary-container to-primary">
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-on-primary/70 tracking-widest">Araç Durumu</span>
            <h2 className="text-white text-3xl font-bold tracking-tight">{vehicle.brand} {vehicle.model} - {vehicle.plate}</h2>
          </div>
          
          <div className="mt-8 flex items-end justify-between relative z-10">
            <div>
              <span className="text-white/60 text-xs font-semibold block mb-1">Sağlık Skoru</span>
              <div className="flex items-baseline gap-1">
                <span className="text-white text-6xl font-extrabold tracking-tighter">{healthScore}</span>
                <span className="text-white/80 text-xl font-medium">/100</span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
              <span className="material-symbols-outlined text-tertiary-fixed-dim text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
          </div>
          {/* Decorative element */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-secondary-container opacity-20 blur-3xl rounded-full"></div>
        </div>
        
        {/* Quick Metrics */}
        <div className="col-span-6 bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-outline-variant/15 flex flex-col justify-between">
          <span className="material-symbols-outlined text-secondary text-2xl mb-4">calendar_today</span>
          <div>
            <span className="text-on-surface-variant text-[10px] font-bold uppercase block mb-0.5">Sıradaki Bakım</span>
            <span className="text-on-surface font-semibold">{format(nextMaintenance, "dd.MM.yyyy", { locale: tr })}</span>
          </div>
        </div>
        
        <div className="col-span-6 bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-outline-variant/15 flex flex-col justify-between">
          <span className="material-symbols-outlined text-primary text-2xl mb-4">speed</span>
          <div>
            <span className="text-on-surface-variant text-[10px] font-bold uppercase block mb-0.5">Son Kilometre</span>
            <span className="text-on-surface font-semibold">{new Intl.NumberFormat('tr-TR').format(vehicle.mileage)} km</span>
          </div>
        </div>
      </section>

      {/* Recommended Services (Horizontal Scroll/Cards) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-primary">Önerilen Servisler</h3>
          <span className="text-xs font-semibold text-secondary flex items-center gap-1 active:scale-95 transition-transform cursor-pointer">
            Tümünü Gör <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
          {/* Service Card 1 */}
          <div className="min-w-[240px] bg-surface-container-low p-5 rounded-xl border border-outline-variant/15 flex flex-col gap-4 shadow-sm shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>tire_repair</span>
              </div>
              <div>
                <h4 className="font-bold text-sm">Lastik Bakımı</h4>
                <span className="text-[10px] text-on-surface-variant">Sezonluk Bakım</span>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">Güvenliğiniz için mevsimlik lastik ölçümleri yaptırmanız önerilir.</p>
            <button className="mt-2 bg-primary text-white py-2.5 px-4 rounded-lg text-xs font-bold w-full active:scale-95 transition-transform">Randevu Al</button>
          </div>

          {/* Service Card 2 */}
          <div className="min-w-[240px] bg-surface-container-low p-5 rounded-xl border border-outline-variant/15 flex flex-col gap-4 shadow-sm shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>oil_barrel</span>
              </div>
              <div>
                <h4 className="font-bold text-sm">Genel Kontrol</h4>
                <span className="text-[10px] text-on-surface-variant">Periyodik Tarama</span>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">Araç sistem sıvılarının durumu kontrol edilmelidir.</p>
            <button className="mt-2 border border-outline-variant/30 text-primary bg-white py-2.5 px-4 rounded-lg text-xs font-bold w-full active:scale-95 transition-transform">İncele</button>
          </div>
        </div>
      </section>

      {/* KVKK Veri Hakları */}
      <DataRightsSection />

      {/* Loyalty Points Card */}
      <section className="bg-surface-container-lowest p-6 rounded-2xl border border-secondary/10 bg-gradient-to-tr from-secondary/5 to-white shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold text-secondary uppercase tracking-widest">Sadakat Programı</span>
          <span className="material-symbols-outlined text-secondary text-xl">stars</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-2xl font-bold text-on-surface">{new Intl.NumberFormat('tr-TR').format(loyaltyPoints)} BST Puan</h3>
            <p className="text-[11px] font-medium text-on-surface-variant mt-1.5">Sonraki bakımda %10 indirim kazandınız!</p>
          </div>
          <button className="bg-secondary text-white text-[10px] font-bold px-4 py-2.5 rounded-full uppercase active:scale-95 transition-transform shadow-sm">
            Kullan
          </button>
        </div>
        
        {/* Progress bar to next tier */}
        <div className="mt-6">
          <div className="flex justify-between text-[10px] font-bold text-secondary mb-1">
            <span>Silver</span>
            <span>Gold Hedef: 3.000 Puan</span>
          </div>
          <div className="h-1.5 w-full bg-secondary-fixed rounded-full overflow-hidden">
             <div className="h-full bg-secondary rounded-full" style={{ width: `${Math.min(100, (loyaltyPoints / 3000) * 100)}%` }}></div>
          </div>
        </div>
      </section>
      
    </main>
  );
}
