import React from "react";
import Link from "next/link";
import { getMyMaintenancePlans } from "@/lib/actions/musteri.actions";

export const metadata = {
  title: "Bakım Planlarım | Müşteri Portalı",
};

export default async function BakimlarPage() {
  const result = await getMyMaintenancePlans();

  if (result.error || !result.vehiclesWithPlans) {
    return (
      <main className="px-6 pt-8 flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-border text-6xl mb-4">error</span>
        <h2 className="text-xl font-bold mb-2">Hata</h2>
        <p className="text-on-surface-variant text-center">{result.error || "Veri yüklenemedi."}</p>
      </main>
    );
  }

  const { vehiclesWithPlans } = result;
  const allPlans = vehiclesWithPlans.flatMap((v) => v.plans.map((p) => ({ ...p, plate: v.plate, vehicleName: `${v.brand} ${v.model}`, mileage: v.mileage })));
  const overdueCount = allPlans.filter((p) => (p.isOverdue || p.isMileageDue) && !p.isCompleted).length;
  const pendingCount = allPlans.filter((p) => !p.isCompleted).length;

  return (
    <main className="px-6 pt-4 space-y-6 pb-32 max-w-md mx-auto">
      {/* Header */}
      <section className="flex justify-between items-center">
        <div>
          <h1 className="text-[22px] font-extrabold text-on-surface tracking-tight">Bakım Planlarım</h1>
          <p className="text-[12px] text-on-surface-variant mt-0.5">{pendingCount} bekleyen bakım</p>
        </div>
        <div className="w-10 h-10 bg-surface-container-lowest rounded-xl flex items-center justify-center text-primary shadow-sm">
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>build_circle</span>
        </div>
      </section>

      {/* Uyarı Kartı */}
      {overdueCount > 0 && (
        <section className="bg-error-container/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 bg-error-container rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-error text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>
          <div>
            <p className="font-bold text-on-error-container text-sm">{overdueCount} Gecikmiş Bakım</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">Aracınızın sağlığı için gecikmiş bakımlarınızı tamamlayın.</p>
          </div>
        </section>
      )}

      {/* Araç Bazlı Bakım Planları */}
      {vehiclesWithPlans.map((vehicle) => (
        <section key={vehicle.id}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-primary-fixed rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-on-surface">{vehicle.brand} {vehicle.model}</h3>
              <p className="text-[11px] font-mono text-on-surface-variant tracking-widest">{vehicle.plate} • {vehicle.mileage.toLocaleString("tr-TR")} km</p>
            </div>
          </div>

          {vehicle.plans.length > 0 ? (
            <div className="space-y-2.5">
              {vehicle.plans.map((plan) => {
                const isAlert = !plan.isCompleted && (plan.isOverdue || plan.isMileageDue);
                return (
                  <div
                    key={plan.id}
                    className={`bg-surface-container-lowest rounded-xl p-4 flex items-center gap-3 shadow-sm ${isAlert ? "ring-1 ring-error/20" : ""}`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      plan.isCompleted ? "bg-tertiary-fixed text-tertiary" :
                      isAlert ? "bg-error-container text-error" :
                      "bg-primary-fixed text-primary"
                    }`}>
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {plan.isCompleted ? "check_circle" : isAlert ? "notification_important" : "schedule"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-on-surface text-[13px] truncate">{plan.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {plan.dueDate && (
                          <span className={`text-[10px] font-medium ${plan.isOverdue ? "text-error" : "text-on-surface-variant"}`}>
                            📅 {new Date(plan.dueDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                        {plan.dueMileage && (
                          <span className={`text-[10px] font-medium ${plan.isMileageDue ? "text-error" : "text-on-surface-variant"}`}>
                            🛣️ {plan.dueMileage.toLocaleString("tr-TR")} km
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {plan.isCompleted ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-tertiary-fixed text-tertiary">TAMAM</span>
                      ) : isAlert ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-error-container text-error">GECİKMİŞ</span>
                      ) : (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">PLANLI</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl p-4 text-center text-sm text-on-surface-variant shadow-sm">
              Bu araç için bakım planı oluşturulmamış.
            </div>
          )}
        </section>
      ))}

      {vehiclesWithPlans.length === 0 && (
        <div className="flex flex-col items-center justify-center p-10 bg-surface-container-lowest rounded-2xl text-center shadow-sm">
          <span className="material-symbols-outlined text-4xl text-outline mb-3">garage</span>
          <p className="text-sm font-bold text-on-surface">Araç Bulunamadı</p>
          <p className="text-xs text-on-surface-variant mt-1">Kayıtlı aracınız bulunmuyor.</p>
        </div>
      )}

      {/* Randevu CTA */}
      <section className="bg-gradient-to-br from-primary to-blue-800 rounded-2xl p-6 relative overflow-hidden text-center shadow-lg shadow-primary/20">
        <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-bl-full"></div>
        <div className="relative z-10">
          <h3 className="text-white font-bold text-lg mb-1.5">Bakım Zamanı mı?</h3>
          <p className="text-white/70 text-[12px] mb-4 leading-relaxed">Gecikmiş veya yaklaşan bakımlarınız için hemen randevu oluşturun.</p>
          <Link href="/m/musteri/randevu" className="inline-block bg-white text-primary font-bold text-[12px] py-2.5 px-6 rounded-xl active:scale-95 transition-transform shadow-sm">
            Randevu Talebi Oluştur
          </Link>
        </div>
      </section>
    </main>
  );
}
