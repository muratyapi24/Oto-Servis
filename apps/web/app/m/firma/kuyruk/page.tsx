import React from "react";
import { getFirmaKuyrukData } from "@/lib/actions/mobile.actions";

export const metadata = {
  title: "Servis İşlemleri | MS Oto Servis Mobil",
};

export default async function MobileKuyrukPage() {
  const dataRes = await getFirmaKuyrukData();

  if (dataRes.error) {
    return <div className="p-8 mt-20 text-center font-bold text-error">{dataRes.error}</div>;
  }

  const { inProgress, pending, orders } = dataRes;

  return (
    <>
      <div className="flex justify-between items-end mb-8">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant font-label">OPERASYON MERKEZİ</span>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Servis İşlemleri</h2>
        </div>
        <button className="bg-gradient-to-br from-[#00236f] to-[#1e3a8a] text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform shadow-lg shadow-primary/10">
          <span className="material-symbols-outlined text-sm" data-icon="add">add</span>
          Yeni Servis
        </button>
      </div>

      {/* Filter Bar & View Toggles */}
      <section className="space-y-4 mb-8">
        <div className="flex gap-2 no-scrollbar overflow-x-auto pb-2">
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg" data-icon="search">search</span>
            <input className="w-full bg-surface-container-highest border-none rounded-xl py-3 pl-10 text-sm focus:ring-2 focus:ring-secondary/50 transition-all outline-none" placeholder="Plaka veya Müşteri Ara..." type="text" />
          </div>
          <div className="flex bg-surface-container-high p-1 rounded-xl shrink-0">
            <button className="p-2 rounded-lg bg-surface-container-lowest shadow-sm text-primary">
              <span className="material-symbols-outlined text-lg" data-icon="view_list">view_list</span>
            </button>
            <button className="p-2 rounded-lg text-outline">
              <span className="material-symbols-outlined text-lg" data-icon="grid_view">grid_view</span>
            </button>
          </div>
        </div>
        <div className="flex gap-2 no-scrollbar overflow-x-auto">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-xs font-bold shrink-0">
            Tümü <span className="bg-white/20 px-2 rounded-full">{orders.length}</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-full text-xs font-bold shrink-0">
            Durum <span className="material-symbols-outlined text-xs" data-icon="expand_more">expand_more</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-full text-xs font-bold shrink-0">
            Tarih <span className="material-symbols-outlined text-xs" data-icon="expand_more">expand_more</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-full text-xs font-bold shrink-0">
            Usta <span className="material-symbols-outlined text-xs" data-icon="expand_more">expand_more</span>
          </button>
        </div>
      </section>

      {/* Service List */}
      <div className="grid gap-6">

        {orders.map((order: any, idx: number) => {
          // Farklı görsel stiller senaryoya/duruma göre belirlenebilir:
          const isUrgentError = order.isUrgent && order.status === "WAITING_APPROVAL";
          const isCompleted = order.status === "COMPLETED";

          if (isCompleted) {
            return (
              <div key={order.id} className="bg-tertiary rounded-xl p-5 border border-white/5 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-on-tertiary-container tracking-wider font-label">SRV-{order.orderNumber}</span>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary-container rounded-full">
                        <span className="material-symbols-outlined text-[10px] text-white" data-icon="verified">verified</span>
                        <span className="text-[10px] font-black text-white uppercase tracking-tighter">KALİTE KONTROL / TAMAMLANDI</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white">{order.vehicle?.brand} {order.vehicle?.model}</h3>
                    <p className="text-xs font-bold bg-white/10 px-2 py-1 rounded inline-block text-tertiary-fixed-dim">{order.vehicle?.plate}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-lg" data-icon="more_vert">more_vert</span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/5 rounded-xl">
                    <p className="text-[9px] font-bold text-on-tertiary-container uppercase tracking-widest font-label mb-1">Teslimat</p>
                    <p className="text-xs font-bold text-white">Hazır</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl">
                    <p className="text-[9px] font-bold text-on-tertiary-container uppercase tracking-widest font-label mb-1">Maliyet</p>
                    <p className="text-xs font-bold text-white">₺{Number(order.totalAmount).toLocaleString('tr-TR')}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-primary-fixed-dim text-[10px] font-bold uppercase tracking-widest">
                  <span className="material-symbols-outlined text-sm" data-icon="check_circle">check_circle</span>
                  Tüm işlemler tamamlandı
                </div>
              </div>
            );
          }

          if (isUrgentError) {
            return (
              <div key={order.id} className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <span className="flex h-3 w-3 bg-error rounded-full ring-4 ring-error-container/20 animate-pulse"></span>
                </div>
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-on-surface-variant tracking-wider font-label">SRV-{order.orderNumber}</span>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-error-container/10 rounded-full">
                        <span className="text-[10px] font-black text-error uppercase tracking-tighter">ONAY BEKLİYOR</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-primary">{order.vehicle?.brand} {order.vehicle?.model}</h3>
                    <p className="text-xs font-bold bg-surface-container-low px-2 py-1 rounded inline-block text-on-surface-variant">{order.vehicle?.plate}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-lg" data-icon="call">call</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-5 p-3 bg-surface-container-low rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center border-2 border-white">
                    <span className="material-symbols-outlined text-white text-sm">person</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest font-label">AÇIKLAMA</p>
                    <p className="text-sm font-bold text-on-surface">{order.complaintDescription?.substring(0, 20)}...</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-on-surface-variant uppercase tracking-widest font-label">PARÇA BEKLİYOR / ONAY</span>
                    <span className="text-primary">{order.completionPercentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full" style={{ width: `${order.completionPercentage}%` }}></div>
                  </div>
                </div>
              </div>
            );
          }

          // Normal In Progress
          return (
            <div key={order.id} className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/10 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-on-surface-variant tracking-wider font-label">SRV-{order.orderNumber}</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-secondary-container/10 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                      <span className="text-[10px] font-black text-secondary-fixed-dim uppercase tracking-tighter">İŞLEMDE</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-primary">{order.vehicle?.brand} {order.vehicle?.model}</h3>
                  <p className="text-xs font-bold bg-surface-container-low px-2 py-1 rounded inline-block text-on-surface-variant">{order.vehicle?.plate}</p>
                </div>
                <div className="flex gap-2">
                  <button className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary active:bg-primary active:text-white transition-all">
                    <span className="material-symbols-outlined text-lg" data-icon="call">call</span>
                  </button>
                  <button className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary active:bg-primary active:text-white transition-all">
                    <span className="material-symbols-outlined text-lg" data-icon="sms">sms</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-5 p-3 bg-surface-container-low rounded-xl">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center border-2 border-white">
                  <span className="material-symbols-outlined text-white text-sm">person</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-outline uppercase tracking-widest font-label">BAKIM SORUMLUSU</p>
                  <p className="text-sm font-bold text-on-surface">{order.assignedMechanic?.firstName || "Bekleniyor"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-on-surface-variant uppercase tracking-widest">Tamamlanma</span>
                  <span className="text-primary">{order.completionPercentage}%</span>
                </div>
                <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full" style={{ width: `${order.completionPercentage}%` }}></div>
                </div>
              </div>
            </div>
          );
        })}

        {orders.length === 0 && (
          <div className="text-center p-8 text-outline">Kayıtlı işlem bulunamadı.</div>
        )}
      </div>
    </>
  );
}
