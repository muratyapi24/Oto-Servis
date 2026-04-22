import React from "react";
import { getDashboardOverview } from "@/lib/actions/dashboard.actions";

export const metadata = {
  title: "Analiz Paneli | MS Oto Servis",
};

export default async function MobileAnalizPage() {
  const dataRes = await getDashboardOverview();

  if ("error" in dataRes || !dataRes.overview) {
    return (
      <div className="flex justify-center p-8">
        <p className="text-error font-bold text-center">Analiz verileri yüklenemedi: {('error' in dataRes ? dataRes.error : null)}</p>
      </div>
    );
  }

  const { overview } = dataRes;
  const { finance, kanban, stats } = overview;

  // Revenue styling from DNA
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(val);
  };

  const revenueBars = finance.revenueBarHeights || [20, 40, 60, 80, 100, 70, 50]; // fallback
  const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  // Reorder days based on current day
  const todayIndex = new Date().getDay(); // 0 is Sunday
  const sortedDays: string[] = [];
  for (let i = 6; i >= 0; i--) {
    let dIdx = todayIndex - i;
    if (dIdx < 0) dIdx += 7;
    // Convert JS day index (0=Sun, 1=Mon) to our string array (which logic maps?) -> days[dIdx-1]
    const trDayArray = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
    sortedDays.push(trDayArray[dIdx] ?? "");
  }

  return (
    <div className="max-w-md mx-auto -mx-2">
      {/* Dashboard Header */}
      <section className="relative mb-6">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-[11px] uppercase text-secondary tracking-[0.2em]">Sistem Raporu</span>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tighter">Analiz Paneli</h2>
        </div>
        <div className="absolute -top-4 -right-2 opacity-10">
          <span className="material-symbols-outlined text-8xl" data-icon="analytics">analytics</span>
        </div>
      </section>

      {/* High-End Metric Card (Editorial Style) */}
      <section className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_16px_32px_-4px_rgba(30,64,175,0.06)] relative overflow-hidden mb-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/5 rounded-full -mr-16 -mt-16"></div>
        <p className="font-bold text-[11px] uppercase text-outline tracking-wider mb-2">Haftalık Nakit Akışı</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-primary tracking-tighter">{formatMoney(finance.weeklyRevenue)}</span>
          <span className={`${finance.revenueChangePercent >= 0 ? 'text-tertiary' : 'text-error'} font-bold text-xs flex items-center`}>
            <span className="material-symbols-outlined text-sm shrink-0 mr-1" data-icon={finance.revenueChangePercent >= 0 ? "trending_up" : "trending_down"}>
              {finance.revenueChangePercent >= 0 ? "trending_up" : "trending_down"}
            </span>
            {Math.abs(finance.revenueChangePercent)}%
          </span>
        </div>

        <div className="mt-6 flex justify-between items-end gap-2 overflow-x-auto pb-2 no-scrollbar">
          {revenueBars.map((heightPercent, idx) => {
            const isToday = idx === 6; // last bar is today
            const isHighest = heightPercent === 100;
            return (
              <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className={`w-full rounded-t-sm shadow-sm ${isToday ? 'bg-secondary-container shadow-orange-500/20' : (isHighest ? 'bg-primary shadow-primary/20' : 'bg-surface-container')}`}
                  style={{ height: `${Math.max(15, heightPercent)}%`, minHeight: '20px' }}>
                </div>
                <span className={`text-[9px] font-bold ${isToday ? 'text-secondary' : 'text-outline'}`}>{sortedDays[idx]}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bento Grid Section */}
      <section className="grid grid-cols-2 gap-4 mb-4">
        {/* Service Distribution Donut (Mock Data mapped to template) */}
        <div className="col-span-2 bg-primary-container text-white rounded-xl p-6 shadow-[0_16px_32px_-4px_rgba(30,64,175,0.06)] overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="font-bold text-sm mb-4">Servis Dağılımı</h3>
            <div className="flex items-center justify-between">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                  <circle className="text-white/20" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                  <circle className="text-secondary-container" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * (stats.successRate || 72) / 100)} strokeWidth="8"></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black">{stats.successRate || 72}%</span>
                  <span className="text-[8px] uppercase font-bold text-white/70">Başarı</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
                  <span className="text-[10px] font-semibold text-white/90">Tamamlanan ({kanban.readyCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white/40"></span>
                  <span className="text-[10px] font-semibold text-white/90">Aktif İşlem ({kanban.inProgress.length + kanban.pending.length + kanban.testing.length})</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 text-white/5">
            <span className="material-symbols-outlined text-[120px]" data-icon="donut_large">donut_large</span>
          </div>
        </div>

        {/* Customer Loyalty Metric */}
        <div className="bg-surface-container-highest rounded-xl p-4 flex flex-col justify-between aspect-square">
          <span className="material-symbols-outlined text-primary text-3xl" data-icon="loyalty">loyalty</span>
          <div>
            <h4 className="font-bold text-[11px] uppercase text-on-surface-variant">Kayıtlı Müşteri</h4>
            <p className="text-2xl font-black text-primary">{stats.totalCustomers}</p>
          </div>
        </div>

        {/* Staff Performance Preview */}
        <div className="bg-surface-container-low rounded-xl p-4 flex flex-col justify-between aspect-square">
          <span className="material-symbols-outlined text-tertiary text-3xl" data-icon="groups">groups</span>
          <div>
            <h4 className="font-bold text-[11px] uppercase text-on-surface-variant">Usta Kapasitesi</h4>
            <p className="text-2xl font-black text-tertiary-container">%{kanban.inProgress.length > 0 ? 'Yüksek' : 'Stabil'}</p>
          </div>
        </div>
      </section>

      {/* Activity Feed / Trend Summary */}
      <section className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_16px_32px_-4px_rgba(30,64,175,0.06)] space-y-4">
        <h3 className="font-bold text-sm border-b border-outline-variant/15 pb-3">Haftalık Özet Raporu</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary" data-icon="calendar_today">calendar_today</span>
              </div>
              <div>
                <p className="text-xs font-bold">Tamamlanan İşlem</p>
                <p className="text-[10px] text-outline">Bugünkü kapanan</p>
              </div>
            </div>
            <span className="text-sm font-bold text-primary">{overview.metrics.completedTodayCount}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary-container/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary" data-icon="error">error</span>
              </div>
              <div>
                <p className="text-xs font-bold">Bekleyen Onay</p>
                <p className="text-[10px] text-outline">Test ve Müşteri Onayı</p>
              </div>
            </div>
            <span className="text-sm font-bold text-secondary">{kanban.testing.length}</span>
          </div>
        </div>
        <button className="w-full py-3 mt-2 bg-surface-container text-primary font-bold text-[11px] uppercase tracking-widest rounded-lg hover:bg-surface-container-high transition-colors">
          Detaylı Rapor İndir
        </button>
      </section>
    </div>
  );
}
