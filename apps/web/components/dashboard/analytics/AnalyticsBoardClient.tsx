"use client";

import { exportToPdf, exportToExcel } from "@/lib/report-export";

/**
 * AnalyticsBoardClient — Dashboard standardında analitik sayfası.
 * Material Symbols ikonları, design-token renkleri, light-only.
 */

interface AnalyticsProps {
  data: {
    metrics: {
      totalCustomers: number;
      newCustomersThisMonth: number;
      customerGrowthPercent: number;
      totalVehicles: number;
      serviceOrdersThisMonth: number;
      serviceGrowthPercent: number;
      completedServicesThisMonth: number;
      activeServices: number;
      monthlyRevenue: number;
      monthlyCollected: number;
      revenueChangePercent: number;
      totalParts: number;
      lowStockParts: number;
      appointmentsThisMonth: number;
      totalMechanics: number;
      activeMechanics: number;
      successRate: number;
    };
    monthlyTrend: { month: string; revenue: number }[];
    serviceDistribution: { status: string; count: number }[];
    recentActivity: {
      id: string;
      plate: string;
      vehicleName: string;
      status: string;
      updatedAt: string;
    }[];
  };
}

function formatCurrency(amount: number) {
  if (amount >= 1000000) return `₺${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `₺${(amount / 1000).toFixed(1)}k`;
  return `₺${amount.toLocaleString("tr-TR")}`;
}

function calcDashOffset(percent: number) {
  const circumference = 2 * Math.PI * 40;
  return circumference - (circumference * percent) / 100;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Beklemede",
  IN_PROGRESS: "İşlemde",
  WAITING_APPROVAL: "Onay Bekliyor",
  COMPLETED: "Tamamlandı",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-slate-400",
  IN_PROGRESS: "bg-primary",
  WAITING_APPROVAL: "bg-secondary-container",
  COMPLETED: "bg-tertiary-container",
};

export default function AnalyticsBoardClient({ data }: AnalyticsProps) {
  const { metrics, monthlyTrend, serviceDistribution, recentActivity } = data;
  const maxRevenue = Math.max(...monthlyTrend.map((m) => m.revenue), 1);

  const totalServiceDist = serviceDistribution.reduce((a, s) => a + s.count, 0) || 1;

  return (
    <div className="space-y-8">
      {/* Top Actions */}
      <div className="flex flex-wrap gap-2 justify-end mb-2">
        <button
          onClick={() =>
            exportToPdf({
              title: "Aylık Gelir Trendi Raporu",
              filename: `gelir-trendi-${new Date().toLocaleDateString("tr-TR").replace(/\./g, "-")}`,
              columns: [
                { header: "Ay", dataKey: "month" },
                { header: "Gelir (₺)", dataKey: "revenue" },
              ],
              data: monthlyTrend,
            })
          }
          className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-outline-variant/30 text-on-surface px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-surface-dim transition-all"
        >
          <span className="material-symbols-outlined text-[18px] text-error">picture_as_pdf</span>
          PDF İndir
        </button>
        <button
          onClick={() =>
            exportToExcel({
              title: "Aylık Gelir Trendi",
              filename: `gelir-trendi-${new Date().toLocaleDateString("tr-TR").replace(/\./g, "-")}`,
              columns: [
                { header: "Ay", dataKey: "month" },
                { header: "Gelir (₺)", dataKey: "revenue" },
              ],
              data: monthlyTrend,
            })
          }
          className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-outline-variant/30 text-on-surface px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-surface-dim transition-all"
        >
          <span className="material-symbols-outlined text-[18px] text-secondary">table_chart</span>
          Excel İndir
        </button>
      </div>

      {/* KPI Bento Grid — 4 sütun */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Aylık Gelir */}
        <div className="bg-surface-container-highest p-6 rounded-2xl ambient-shadow border-b-4 border-primary">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded ${metrics.revenueChangePercent >= 0 ? "text-tertiary-container bg-tertiary-fixed/30" : "text-error bg-error/10"}`}>
              {metrics.revenueChangePercent >= 0 ? "+" : ""}{metrics.revenueChangePercent}%
            </span>
          </div>
          <p className="text-3xl font-black text-on-surface">{formatCurrency(metrics.monthlyRevenue)}</p>
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Aylık Gelir</p>
        </div>

        {/* Toplam Servis */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl ambient-shadow border-b-4 border-secondary-container">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary-fixed/50 rounded-lg text-on-secondary-container">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>build</span>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded ${metrics.serviceGrowthPercent >= 0 ? "text-tertiary-container bg-tertiary-fixed/30" : "text-error bg-error/10"}`}>
              {metrics.serviceGrowthPercent >= 0 ? "+" : ""}{metrics.serviceGrowthPercent}%
            </span>
          </div>
          <p className="text-3xl font-black text-on-surface">{metrics.serviceOrdersThisMonth}</p>
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Bu Ay Servis Emri</p>
        </div>

        {/* Müşteri Büyümesi */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl ambient-shadow border-b-4 border-tertiary-container">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-tertiary-fixed/30 rounded-lg text-on-tertiary-fixed-variant">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>group_add</span>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded ${metrics.customerGrowthPercent >= 0 ? "text-tertiary-container bg-tertiary-fixed/30" : "text-error bg-error/10"}`}>
              {metrics.customerGrowthPercent >= 0 ? "+" : ""}{metrics.customerGrowthPercent}%
            </span>
          </div>
          <p className="text-3xl font-black text-on-surface">{metrics.newCustomersThisMonth}</p>
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Yeni Müşteri</p>
        </div>

        {/* Başarı Oranı */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl ambient-shadow border-b-4 border-primary">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">PERFORMANS</span>
          </div>
          <p className="text-3xl font-black text-on-surface">%{metrics.successRate}</p>
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Tamamlanma Oranı</p>
        </div>
      </section>

      {/* Gelir Trendi + Servis Dağılımı */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Gelir Bar Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-gray-800 p-6 rounded-3xl ambient-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-on-surface">Aylık Gelir Trendi</h3>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Son 6 Ay</span>
          </div>
          <div className="flex items-end gap-3 h-48">
            {monthlyTrend.map((m, i) => {
              const heightPct = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
              const isLast = i === monthlyTrend.length - 1;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">{formatCurrency(m.revenue)}</span>
                  <div className="w-full flex items-end h-36">
                    <div
                      className={`w-full rounded-t-lg transition-all ${isLast ? "bg-primary" : "bg-primary/20"}`}
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Servis Dağılımı + Hızlı İstatistik */}
        <div className="lg:col-span-4 space-y-6">
          {/* Servis Status Dağılımı */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl ambient-shadow">
            <h3 className="text-lg font-bold text-on-surface mb-4">Servis Durumu Dağılımı</h3>
            <div className="space-y-4">
              {serviceDistribution.map((s) => (
                <div key={s.status} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-400">{STATUS_LABEL[s.status] || s.status}</span>
                    <span className="text-on-surface">{s.count}</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div
                      className={`${STATUS_COLOR[s.status] || "bg-slate-400"} h-full rounded-full`}
                      style={{ width: `${(s.count / totalServiceDist) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Başarı Oranı — Circular */}
          <div className="bg-surface-container-high p-6 rounded-3xl flex flex-col justify-center items-center text-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-white" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8" />
                <circle className="text-secondary" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={calcDashOffset(metrics.successRate).toString()} strokeWidth="8" />
              </svg>
              <span className="absolute text-lg font-black text-on-surface">%{metrics.successRate}</span>
            </div>
            <p className="mt-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Başarı Oranı</p>
          </div>
        </div>
      </div>

      {/* Alt Bölüm: Genel İstatistik + Son Aktiviteler */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Genel İstatistikler  */}
        <div className="lg:col-span-1 space-y-6">
          {/* Toplam Kaynaklar */}
          <div className="bg-inverse-surface p-6 rounded-3xl text-white">
            <h3 className="text-lg font-bold mb-4">Kaynak Durumu</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">Toplam Müşteri</span>
                <span className="text-lg font-black">{metrics.totalCustomers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">Araç Kayıtları</span>
                <span className="text-lg font-black">{metrics.totalVehicles}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">Personel (Aktif)</span>
                <span className="text-lg font-black">{metrics.activeMechanics}/{metrics.totalMechanics}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">Stok Kalem</span>
                <span className="text-lg font-black">{metrics.totalParts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">Randevu (Bu Ay)</span>
                <span className="text-lg font-black">{metrics.appointmentsThisMonth}</span>
              </div>
            </div>
          </div>

          {/* Aylık Tahsilat Oranı  */}
          <div className="bg-surface-container-high p-6 rounded-3xl">
            <p className="text-[11px] font-bold text-primary uppercase tracking-widest">Tahsilat/Fatura</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-2xl font-black">{formatCurrency(metrics.monthlyCollected)}</p>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">/ {formatCurrency(metrics.monthlyRevenue)}</span>
            </div>
            <div className="w-full bg-white dark:bg-gray-800 h-2 rounded-full overflow-hidden mt-4">
              <div
                className="bg-tertiary-container h-full rounded-full"
                style={{ width: `${metrics.monthlyRevenue > 0 ? (metrics.monthlyCollected / metrics.monthlyRevenue) * 100 : 0}%` }}
              />
            </div>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-2">
              Bu ay kesilen faturalardan tahsil edilen oran.
            </p>
          </div>
        </div>

        {/* Son Aktiviteler */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl ambient-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-on-surface">Son Servis Hareketleri</h3>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Güncel Akış</span>
          </div>

          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">history</span>
              <p className="text-sm text-slate-400 dark:text-slate-500">Henüz servis hareketi bulunmuyor.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="text-left py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Plaka</th>
                    <th className="text-left py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Araç</th>
                    <th className="text-left py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Durum</th>
                    <th className="text-right py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Güncelleme</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {recentActivity.map((a) => (
                    <tr key={a.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 font-mono text-xs font-black text-primary">{a.plate}</td>
                      <td className="py-3 text-xs font-medium text-slate-600 dark:text-slate-400">{a.vehicleName}</td>
                      <td className="py-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                          a.status === "COMPLETED" ? "bg-tertiary-fixed/30 text-on-tertiary-fixed-variant" :
                          a.status === "IN_PROGRESS" ? "bg-primary/10 text-primary" :
                          a.status === "WAITING_APPROVAL" ? "bg-secondary-fixed/50 text-on-secondary-container" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {STATUS_LABEL[a.status] || a.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        {new Date(a.updatedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
