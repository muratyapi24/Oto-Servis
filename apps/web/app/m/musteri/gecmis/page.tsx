import React from "react";
import { getServisGecmisi } from "@/lib/actions/musteri.actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";

export const metadata = {
  title: "Servis Geçmişi | Müşteri Portalı",
};

export default async function MusteriGecmisPage() {
  const result = await getServisGecmisi();

  if (result.error || !result.orders) {
    return (
      <div className="flex flex-col items-center justify-center p-8 mt-20">
        <span className="material-symbols-outlined text-border text-6xl mb-4">error</span>
        <h2 className="text-xl font-bold mb-2">Hata Oluştu</h2>
        <p className="text-on-surface-variant text-center">{result.error}</p>
      </div>
    );
  }

  const { orders, customer } = result;
  
  // İstatistikler
  const completedCount = orders.filter((o: any) => o.status === "COMPLETED").length;
  const totalSpent = orders
    .filter((o: any) => o.status === "COMPLETED")
    .reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0);

  return (
    <main className="px-6 pt-4 space-y-6 max-w-md mx-auto pb-32">
      {/* Header */}
      <section className="flex justify-between items-center">
        <div>
          <h1 className="text-[22px] font-extrabold text-on-surface tracking-tight">Servis Geçmişi</h1>
          <p className="text-[12px] text-on-surface-variant mt-0.5">{customer?.firstName} {customer?.lastName}</p>
        </div>
        <div className="w-10 h-10 bg-surface-container-lowest rounded-xl flex items-center justify-center text-primary shadow-sm">
          <span className="material-symbols-outlined text-xl">history</span>
        </div>
      </section>

      {/* Özet Kartları */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
          </div>
          <p className="text-2xl font-extrabold text-on-surface">{completedCount}</p>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-0.5">Tamamlanan</p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-secondary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
            </div>
          </div>
          <p className="text-xl font-extrabold text-on-surface">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(totalSpent)}</p>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-0.5">Toplam Harcama</p>
        </div>
      </section>

      {/* Servis Geçmişi Listesi */}
      <section className="space-y-3">
        {orders.length > 0 ? (
          orders.map((order: any) => {
            const orderDate = new Date(order.createdAt);
            const isCompleted = order.status === "COMPLETED";
            const itemCount = order.items?.length || 0;

            return (
              <div key={order.id} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-transform">
                <div className="flex gap-3">
                  {/* Tarih Bloğu */}
                  <div className="flex flex-col items-center justify-center w-12 h-[52px] bg-surface-container rounded-xl shrink-0">
                    <span className="text-[9px] font-extrabold text-on-surface-variant/60 uppercase leading-none">
                      {format(orderDate, "MMM", { locale: tr })}
                    </span>
                    <span className="text-lg font-bold text-primary leading-tight">
                      {format(orderDate, "dd")}
                    </span>
                    <span className="text-[8px] text-on-surface-variant/50 leading-none">
                      {format(orderDate, "yyyy")}
                    </span>
                  </div>

                  {/* İçerik */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className="font-bold text-on-surface text-[14px] leading-tight truncate">
                        {order.complaintDescription || "Genel Servis Bakımı"}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider uppercase shrink-0
                        ${isCompleted ? 'bg-tertiary-fixed text-tertiary' : 'bg-error-container text-error'}
                      `}>
                        {isCompleted ? "TAMAM" : "İPTAL"}
                      </span>
                    </div>

                    <p className="text-[11px] text-on-surface-variant font-medium mb-2.5">
                      {order.vehiclePlate} • {order.vehicleBrand} {order.vehicleModel}
                    </p>

                    <div className="flex items-center gap-3 pt-2 border-t border-outline-variant/15">
                      <span className="text-[11px] font-bold text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-primary">payments</span>
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(order.totalAmount || 0))}
                      </span>
                      {itemCount > 0 && (
                        <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">build</span>
                          {itemCount} kalem
                        </span>
                      )}
                      {order.assignedMechanic && (
                        <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">person</span>
                          {order.assignedMechanic.firstName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center p-10 bg-surface-container-lowest rounded-2xl text-center shadow-sm">
            <span className="material-symbols-outlined text-4xl text-outline mb-3">inventory_2</span>
            <p className="text-sm font-bold text-on-surface">Kayıt Bulunamadı</p>
            <p className="text-xs text-on-surface-variant mt-1">Araçlarınıza ait geçmiş servis kaydı yok.</p>
          </div>
        )}
      </section>
      
      {/* CTA: Randevu Talebi */}
      <section className="bg-gradient-to-br from-primary to-blue-800 rounded-2xl p-6 relative overflow-hidden text-center shadow-lg shadow-primary/20">
        <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-bl-full"></div>
        <div className="absolute right-3 top-3 opacity-20">
          <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
        </div>
        <div className="relative z-10">
          <h3 className="text-white font-bold text-lg mb-1.5">Yeni Servis Zamanı?</h3>
          <p className="text-white/70 text-[12px] mb-4 leading-relaxed">Aracınızın kondisyonunu korumak için periyodik bakımlarınızı aksatmayın.</p>
          <Link href="/m/musteri/randevu" className="inline-block bg-white text-primary font-bold text-[12px] py-2.5 px-6 rounded-xl active:scale-95 transition-transform shadow-sm">
            Randevu Talebi Oluştur
          </Link>
        </div>
      </section>
    </main>
  );
}
