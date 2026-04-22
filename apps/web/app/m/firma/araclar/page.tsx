import React from "react";
import { prisma } from "@repo/database";
import { auth } from "@/auth";

export const metadata = {
  title: "Kayıtlı Araçlar | MS Oto Servis Mobil",
};

export default async function MobileVehiclesPage() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return (
      <div className="flex justify-center p-8">
        <p className="text-error font-bold">Yetkisiz işlem. Giriş yapmalısınız.</p>
      </div>
    );
  }
  const tenantId = session.user.tenantId;

  // Tüm araçları çek (mock için ilk 50)
  const vehicles = await prisma.vehicle.findMany({
    where: { tenantId, deletedAt: null },
    include: {
      serviceOrders: {
        orderBy: { updatedAt: 'desc' },
        take: 1, // sadece en son servis durumunu göstermek için
      }
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const totalVehiclesCount = await prisma.vehicle.count({
    where: { tenantId, deletedAt: null }
  });

  // İstatistikler için
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activeServicesCount = await prisma.serviceOrder.count({
    where: {
      tenantId,
      status: { in: ["PENDING", "IN_PROGRESS", "WAITING_APPROVAL"] },
      deletedAt: null
    }
  });

  const completed30DaysCount = await prisma.serviceOrder.count({
    where: {
      tenantId,
      status: "COMPLETED",
      updatedAt: { gte: thirtyDaysAgo },
      deletedAt: null
    }
  });

  const newVehiclesCount = vehicles.filter(v => new Date(v.createdAt) >= thirtyDaysAgo).length;

  return (
    <div className="max-w-md mx-auto -mx-2">
      {/* Search & Filter Section */}
      <section className="space-y-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-outline" data-icon="search">search</span>
          </div>
          <input
            className="w-full bg-surface-container-low border-none rounded-xl py-4 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary-container transition-all shadow-sm outline-none"
            placeholder="Plaka, marka veya model ara..."
            type="text"
          />
        </div>

        {/* Summary Stats: Bento Style Mobile Scroll */}
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {/* Active in Service */}
          <div className="min-w-[160px] flex-1 bg-primary-container p-4 rounded-xl shadow-lg shadow-primary/10">
            <div className="flex justify-between items-start mb-2">
              <span className="material-symbols-outlined text-white/70" data-icon="home_repair_service">home_repair_service</span>
              <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Aktif</span>
            </div>
            <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider">Servistekiler</p>
            <p className="text-white text-3xl font-bold tracking-tight">{activeServicesCount}</p>
          </div>

          {/* Serviced in Last 30 Days */}
          <div className="min-w-[160px] flex-1 bg-surface-container-lowest border border-outline-variant/15 p-4 rounded-xl shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="material-symbols-outlined text-tertiary" data-icon="event_available">event_available</span>
              <span className="text-tertiary text-[10px] font-bold px-2 py-0.5 rounded-full bg-tertiary-fixed/30 uppercase tracking-wider">30 Gün</span>
            </div>
            <p className="text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">Tamamlanan</p>
            <p className="text-on-surface text-3xl font-bold tracking-tight">{completed30DaysCount}</p>
          </div>

          {/* New Additions */}
          <div className="min-w-[160px] flex-1 bg-surface-container-lowest border border-outline-variant/15 p-4 rounded-xl shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="material-symbols-outlined text-secondary-container" data-icon="fiber_new">fiber_new</span>
              <span className="text-secondary-container text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-fixed/50 uppercase tracking-wider">Yeni</span>
            </div>
            <p className="text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">Kayıtlar</p>
            <p className="text-on-surface text-3xl font-bold tracking-tight">{newVehiclesCount}</p>
          </div>
        </div>
      </section>

      {/* Vehicle List */}
      <section className="space-y-4 mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-on-surface font-bold text-lg tracking-tight">Kayıtlı Araçlar</h2>
          <span className="text-outline text-xs font-semibold uppercase tracking-widest">Toplam {totalVehiclesCount}</span>
        </div>

        <div className="space-y-3">
          {vehicles.length === 0 ? (
            <div className="p-4 text-center text-outline text-sm bg-surface-container-lowest rounded-xl">
              Sistemde araç bulunamadı.
            </div>
          ) : (
            vehicles.map((v) => {
              const latestOrder = v.serviceOrders[0];
              const isUrgent = latestOrder?.status === "WAITING_APPROVAL";
              const isActive = latestOrder?.status === "IN_PROGRESS" || latestOrder?.status === "PENDING";

              let statusLabel = "Servis Yok";
              let statusColorClass = "bg-surface-container-high text-outline";

              if (isActive) {
                statusLabel = "Serviste";
                statusColorClass = "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant";
              }
              if (isUrgent) {
                statusLabel = "Acil";
                statusColorClass = "bg-secondary-fixed text-on-secondary-fixed-variant";
              }
              if (latestOrder?.status === "COMPLETED") {
                statusLabel = "Tamamlandı";
                statusColorClass = "bg-surface-container-high text-outline";
              }

              return (
                <div key={v.id} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/15 flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-lg bg-surface-container-low flex-shrink-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-3xl" data-icon={isUrgent ? 'minor_crash' : (isActive ? 'airport_shuttle' : 'directions_car')}>
                      {isUrgent ? 'minor_crash' : (isActive ? 'airport_shuttle' : 'directions_car')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-on-surface truncate">{v.plate}</h3>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${statusColorClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-on-surface-variant text-sm truncate">{v.brand} {v.model} • {v.year}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center text-[10px] text-outline font-semibold">
                        <span className="material-symbols-outlined text-sm mr-1" data-icon="history">history</span>
                        {latestOrder
                          ? new Date(latestOrder.updatedAt).toLocaleDateString("tr-TR")
                          : "Giriş Yok"}
                      </div>
                      <div className="flex items-center text-[10px] text-outline font-semibold">
                        <span className="material-symbols-outlined text-sm mr-1" data-icon="speed">speed</span>
                        {v.mileage.toLocaleString("tr-TR")} KM
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-outline" data-icon="chevron_right">chevron_right</span>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
