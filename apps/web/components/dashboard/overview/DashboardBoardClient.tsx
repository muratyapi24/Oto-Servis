"use client";

import Link from "next/link";

/*
  firma_ana_panel.html şablonunun birebir JSX karşılığı.
  Tüm veriler `data` prop'undan (DB'den) geliyor. Hiç mock veri yok.
*/

interface DashboardClientProps {
  data: {
    userName: string;
    metrics: {
      activeServicesCount: number;
      completedTodayCount: number;
      pendingInvoicesTotal: number;
      lowStockCount: number;
    };
    kanban: {
      pending: any[];
      inProgress: any[];
      testing: any[];
      readyCount: number;
    };
    appointments: any[];
    utilization: { name: string; spec: string; value: number }[];
    finance: {
      weeklyRevenue: number;
      revenueChangePercent: number;
      revenueBarHeights: number[];
    };
    stats: {
      successRate: number;
      totalCustomers: number;
    };
    recentActivities: { id: string; description: string; color: string; customerName: string; timeAgo: string }[];
  };
}

// Başarı oranı dairesel grafik için strokeDashoffset hesaplama
function calcDashOffset(percent: number) {
  const circumference = 2 * Math.PI * 40; // r=40 → 251.2
  return circumference - (circumference * percent) / 100;
}

// Türkçe tarih
function getTodayLabel() {
  return new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
}

// Para formatı
function formatCurrency(amount: number) {
  if (amount >= 1000) {
    return `₺${(amount / 1000).toFixed(1)}k`;
  }
  return `₺${amount.toLocaleString("tr-TR")}`;
}

export default function DashboardBoardClient({ data }: DashboardClientProps) {
  const { userName, metrics, kanban, appointments, utilization, finance, stats, recentActivities } = data;

  // Usta doluluk barları için renkler (şablondaki sırayla)
  const utilizationBarColors = ["bg-tertiary-fixed", "bg-secondary-fixed-dim", "bg-primary-fixed-dim"];

  return (
    <>
      {/* Stats Ticker / Headline Section */}
      <div className="bg-primary-container text-white py-2 px-8 overflow-hidden whitespace-nowrap">
        <div className="inline-flex space-x-12 items-center animate-pulse">
          <span className="text-[10px] font-bold tracking-widest flex items-center">
            <span className="w-2 h-2 bg-secondary rounded-full mr-2"></span> CANLI DURUM:
          </span>
          <span className="text-xs">Aktif Servis: {metrics.activeServicesCount} İşlem</span>
          <span className="text-xs">Bugün Kapanan: {metrics.completedTodayCount} İşlem</span>
          {metrics.lowStockCount > 0 && (
            <span className="text-xs">Stok Alarmı: {metrics.lowStockCount} Kalem (Kritik)</span>
          )}
          <span className="text-xs">Bekleyen Fatura: ₺{metrics.pendingInvoicesTotal.toLocaleString("tr-TR")}</span>
          <span className="text-xs">Bekleyen Onay: {kanban.testing.length} İşlem</span>
        </div>
      </div>

      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <section className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-2">
            <h2 className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-widest uppercase">Overview</h2>
            <h1 className="text-4xl font-bold text-on-surface dark:text-white tracking-tight">Merhaba {userName}! 👋</h1>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              Bugün yapılması gereken {metrics.activeServicesCount} aktif servis ve {appointments.length} yeni randevu var.
            </p>
          </div>
          <div className="flex space-x-3">
            <Link href="/dashboard/customers" className="flex items-center px-6 py-3 bg-white dark:bg-gray-800 border border-outline-variant/20 dark:border-gray-700 rounded-xl text-primary font-bold text-sm hover:bg-blue-50 dark:hover:bg-gray-700 transition-all ambient-shadow">
              <span className="material-symbols-outlined mr-2">person_add</span> + Yeni Müşteri
            </Link>
            <Link href="/dashboard/services" className="flex items-center px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all transform active:scale-95 shadow-blue-900/20">
              <span className="material-symbols-outlined mr-2">add_circle</span> + Yeni Servis Emri
            </Link>
          </div>
        </section>

        {/* Key Metrics Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Aktif Servisler */}
          <div className="bg-surface-container-highest dark:bg-gray-800 p-6 rounded-2xl ambient-shadow border-b-4 border-primary">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg text-primary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>engineering</span>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded">CANLI</span>
            </div>
            <p className="text-3xl font-black text-on-surface dark:text-white">{metrics.activeServicesCount}</p>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Aktif Servisler</p>
          </div>

          {/* Bugün Tamamlanan */}
          <div className="bg-surface-container-lowest dark:bg-gray-800 p-6 rounded-2xl ambient-shadow border-b-4 border-tertiary-container">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-tertiary-fixed/30 dark:bg-green-900/30 rounded-lg text-on-tertiary-fixed-variant dark:text-green-400">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <span className="text-xs font-bold text-on-tertiary-fixed-variant dark:text-green-400 bg-tertiary-fixed/30 dark:bg-green-900/30 px-2 py-1 rounded">TAMAMLANAN</span>
            </div>
            <p className="text-3xl font-black text-on-surface dark:text-white">{metrics.completedTodayCount}</p>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Bugün Tamamlanan</p>
          </div>

          {/* Tahsil Edilecek */}
          <div className="bg-surface-container-lowest dark:bg-gray-800 p-6 rounded-2xl ambient-shadow border-b-4 border-secondary-container">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-secondary-fixed/50 dark:bg-orange-900/30 rounded-lg text-on-secondary-container dark:text-orange-400">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              </div>
              <span className="text-xs font-bold text-on-secondary-container dark:text-orange-400 bg-secondary-fixed/50 dark:bg-orange-900/30 px-2 py-1 rounded">VADESİ GELEN</span>
            </div>
            <p className="text-3xl font-black text-on-surface dark:text-white">₺{metrics.pendingInvoicesTotal.toLocaleString("tr-TR")}</p>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Tahsil Edilecek</p>
          </div>

          {/* Stok Uyarıları */}
          <div className="bg-error-container dark:bg-red-900/30 p-6 rounded-2xl ambient-shadow border-b-4 border-error">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-error/10 dark:bg-error/20 rounded-lg text-error dark:text-red-400">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
              </div>
              <span className="text-xs font-bold text-error dark:text-red-400 bg-error/10 dark:bg-error/20 px-2 py-1 rounded">KRİTİK</span>
            </div>
            <p className="text-3xl font-black text-error dark:text-red-400">{metrics.lowStockCount}</p>
            <p className="text-[11px] font-bold text-error/70 dark:text-red-400/70 uppercase tracking-wider mt-1">Stok Uyarıları</p>
          </div>
        </section>

        {/* Main Interactive Area: Kanban & Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Active Services Kanban (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-on-surface dark:text-white">Aktif Servis Kanvanı</h3>
              <Link href="/dashboard/services" className="text-primary font-bold text-sm flex items-center hover:underline">
                Tümünü Gör <span className="material-symbols-outlined ml-1">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Beklemede */}
              <div className="bg-surface-container-low dark:bg-gray-800/50 p-3 rounded-2xl space-y-3 min-h-[400px]">
                <h4 className="px-2 py-1 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter flex items-center border-b border-outline-variant/20 dark:border-gray-700 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 mr-2"></span> Muayene Beklemede ({kanban.pending.length})
                </h4>
                {kanban.pending.map((order: any) => (
                  <div key={order.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl ambient-shadow space-y-3 cursor-pointer hover:ring-2 ring-primary/20 transition-all border border-transparent dark:border-gray-700">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded font-bold uppercase truncate max-w-[120px]">
                        {order.complaintDescription?.substring(0, 20) || "Servis"}
                      </span>
                      <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-sm">more_vert</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold dark:text-white">{order.vehicle.plate}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{order.vehicle.brand} {order.vehicle.model}</p>
                    </div>
                    {order.assignedMechanic && (
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300">
                          {order.assignedMechanic.firstName.charAt(0)}{order.assignedMechanic.lastName.charAt(0)}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{order.assignedMechanic.firstName} {order.assignedMechanic.lastName}</p>
                      </div>
                    )}
                  </div>
                ))}
                {kanban.pending.length === 0 && <p className="text-xs text-slate-400 dark:text-slate-500 text-center pt-8">Boş</p>}
              </div>

              {/* İşlemde */}
              <div className="bg-surface-container-low dark:bg-gray-800/50 p-3 rounded-2xl space-y-3 min-h-[400px]">
                <h4 className="px-2 py-1 text-[11px] font-black text-secondary-container dark:text-orange-400 uppercase tracking-tighter flex items-center border-b border-outline-variant/20 dark:border-gray-700 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-container dark:bg-orange-500 mr-2"></span> İşlemde ({kanban.inProgress.length})
                </h4>
                {kanban.inProgress.map((order: any) => (
                  <div key={order.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl ambient-shadow space-y-3 ring-2 ring-secondary/10 dark:ring-orange-500/20 border border-transparent dark:border-gray-700">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded font-bold uppercase truncate max-w-[120px]">
                        {order.complaintDescription?.substring(0, 20) || "Bakım"}
                      </span>
                      <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-sm">more_vert</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold dark:text-white">{order.vehicle.plate}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{order.vehicle.brand} {order.vehicle.model}</p>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-secondary dark:bg-orange-500 h-full w-[65%]"></div>
                    </div>
                  </div>
                ))}
                {kanban.inProgress.length === 0 && <p className="text-xs text-slate-400 dark:text-slate-500 text-center pt-8">Boş</p>}
              </div>

              {/* Test Ediliyor */}
              <div className="bg-surface-container-low dark:bg-gray-800/50 p-3 rounded-2xl space-y-3 min-h-[400px]">
                <h4 className="px-2 py-1 text-[11px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-tighter flex items-center border-b border-outline-variant/20 dark:border-gray-700 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span> Test Ediliyor ({kanban.testing.length})
                </h4>
                {kanban.testing.map((order: any) => (
                  <div key={order.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl ambient-shadow space-y-3 border-l-4 border-blue-500 dark:border-blue-600">
                    <p className="text-sm font-bold dark:text-white">{order.vehicle.plate}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{order.vehicle.brand} {order.vehicle.model}</p>
                    <div className="flex items-center text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                      <span className="material-symbols-outlined text-xs mr-1">speed</span> Yol Testi Başlatıldı
                    </div>
                  </div>
                ))}
                {kanban.testing.length === 0 && <p className="text-xs text-slate-400 dark:text-slate-500 text-center pt-8">Boş</p>}
              </div>

              {/* Teslime Hazır */}
              <div className="bg-surface-container-low dark:bg-gray-800/50 p-3 rounded-2xl space-y-3 min-h-[400px]">
                <h4 className="px-2 py-1 text-[11px] font-black text-tertiary-container dark:text-green-400 uppercase tracking-tighter flex items-center border-b border-outline-variant/20 dark:border-gray-700 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container dark:bg-green-500 mr-2"></span> Teslime Hazır ({kanban.readyCount})
                </h4>
                {kanban.readyCount > 0 ? (
                  <div className="bg-tertiary-fixed/10 dark:bg-green-900/20 p-4 rounded-xl space-y-3 border border-tertiary-container/20 dark:border-green-800">
                    <p className="text-sm font-bold text-center dark:text-white">{kanban.readyCount} araç teslime hazır</p>
                    <Link href="/dashboard/services" className="block w-full py-2 bg-tertiary-container dark:bg-green-600 text-white text-[10px] font-bold rounded-lg uppercase text-center">
                      Fatura Kes
                    </Link>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center pt-8">Boş</p>
                )}
              </div>
            </div>
          </div>

          {/* Timeline & Quick Stats (4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            {/* Bugünkü Randevular */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl ambient-shadow border border-transparent dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold dark:text-white">Bugünkü Randevular</h3>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{getTodayLabel()}</span>
              </div>
              {appointments.length > 0 ? (
                <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-container-high dark:before:bg-gray-700">
                  {appointments.slice(0, 5).map((app: any, idx: number) => {
                    const colors = ["primary", "secondary", "primary", "secondary", "primary"];
                    const icons = ["event", "warning", "event", "warning", "event"];
                    const bgColor = `bg-${colors[idx % colors.length]}`;
                    const textColor = `text-${colors[idx % colors.length]}`;
                    const customerName = app.customer.type === "CORPORATE"
                      ? app.customer.companyName
                      : `${app.customer.firstName || ""} ${app.customer.lastName || ""}`;

                    return (
                      <div key={app.id} className="relative pl-10">
                        <div className={`absolute left-0 top-1 w-6 h-6 rounded-full ${bgColor} text-white flex items-center justify-center z-10`}>
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icons[idx % icons.length]}</span>
                        </div>
                        <div className="space-y-1">
                          <p className={`text-xs font-black ${textColor}`}>{app.appointmentTime}</p>
                          <p className="text-sm font-bold dark:text-white">{app.type || "Araç Kabul Başvurusu"}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Müşteri: {customerName}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-700 mb-2">event_busy</span>
                  <p className="text-sm text-slate-400 dark:text-slate-500">Bugün randevu bulunmuyor.</p>
                </div>
              )}
            </div>

            {/* Usta Doluluk Oranı */}
            <div className="bg-inverse-surface dark:bg-gray-800 p-6 rounded-3xl text-white border border-transparent dark:border-gray-700">
              <h3 className="text-lg font-bold mb-4">Usta Doluluk Oranı</h3>
              {utilization.length > 0 ? (
                <div className="space-y-4">
                  {utilization.map((mech, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider opacity-70">
                        <span>{mech.name} ({mech.spec})</span>
                        <span>{mech.value}%</span>
                      </div>
                      <div className="w-full bg-white dark:bg-gray-800/10 h-2 rounded-full overflow-hidden">
                        <div className={`${utilizationBarColors[i % utilizationBarColors.length]} h-full`} style={{ width: `${mech.value}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/50">Kayıtlı usta bulunmuyor.</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity & Stats Cluster */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Son Aktiviteler */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-3xl ambient-shadow border border-transparent dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Son Aktiviteler</h3>
            {recentActivities.length > 0 ? (
              <ul className="space-y-4">
                {recentActivities.slice(0, 5).map((activity) => (
                  <li key={activity.id} className="flex items-start space-x-3">
                    <div className={`mt-1 w-2 h-2 rounded-full bg-${activity.color}`}></div>
                    <div className="text-xs">
                      <span className="font-bold text-on-surface dark:text-white">{activity.description}</span>
                      <p className="text-slate-400 dark:text-slate-500 mt-0.5">{activity.timeAgo}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500">Henüz aktivite yok.</p>
            )}
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Haftalık Gelir */}
            <div className="bg-surface-container-high dark:bg-gray-800 p-6 rounded-3xl flex flex-col justify-between border border-transparent dark:border-gray-700">
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest">Haftalık Gelir</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-black dark:text-white">{formatCurrency(finance.weeklyRevenue)}</p>
                <span className={`text-xs font-bold ${finance.revenueChangePercent >= 0 ? "text-tertiary-container dark:text-green-400" : "text-error dark:text-red-400"}`}>
                  {finance.revenueChangePercent >= 0 ? "+" : ""}{finance.revenueChangePercent}%
                </span>
              </div>
              <div className="w-full h-12 mt-4 flex items-end space-x-1">
                {finance.revenueBarHeights.map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t ${i === finance.revenueBarHeights.length - 1 ? "bg-primary" : "bg-primary/20 dark:bg-primary/30"}`}
                    style={{ height: `${Math.max(h, 5)}%` }}
                  ></div>
                ))}
              </div>
            </div>

            {/* Başarı Oranı */}
            <div className="bg-surface-container-high dark:bg-gray-800 p-6 rounded-3xl flex flex-col justify-center items-center text-center border border-transparent dark:border-gray-700">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle className="text-white dark:text-gray-700" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                  <circle className="text-secondary dark:text-orange-500" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={calcDashOffset(stats.successRate).toString()} strokeWidth="8"></circle>
                </svg>
                <span className="absolute text-lg font-black text-on-surface dark:text-white">{stats.successRate}%</span>
              </div>
              <p className="mt-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Başarı Oranı</p>
            </div>

            {/* Müşteri İstatistikleri */}
            <div className="bg-surface-container-high dark:bg-gray-800 p-6 rounded-3xl flex flex-col justify-between border border-transparent dark:border-gray-700">
              <div>
                <p className="text-[11px] font-bold text-primary uppercase tracking-widest">Toplam Müşteri</p>
                <p className="text-3xl font-black mt-1 dark:text-white">{stats.totalCustomers}</p>
              </div>
              <div className="flex text-secondary-container dark:text-orange-400 mt-4">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-2 self-center">Kayıtlı Müşteri</span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-2">Aktif müşteri portföyü.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="w-full mt-auto bg-white dark:bg-gray-800 border-t border-slate-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 py-8 w-full max-w-7xl mx-auto">
          <div className="mb-4 md:mb-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">MS OTO SERVİS</p>
            <p className="text-xs font-normal text-slate-500 dark:text-slate-400">© 2026 MS OTO SERVİS. All rights reserved.</p>
          </div>
          <div className="flex space-x-6">
            <Link href="#" className="text-xs font-normal text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-opacity">Privacy Policy</Link>
            <Link href="#" className="text-xs font-normal text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-opacity">Terms of Service</Link>
            <Link href="#" className="text-xs font-normal text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-opacity">Contact Support</Link>
          </div>
        </div>
      </footer>

      {/* Quick Action FAB */}
      <Link href="/dashboard/services" className="fixed bottom-8 right-8 w-16 h-16 bg-secondary-container text-white rounded-full flex items-center justify-center ambient-shadow hover:scale-110 active:scale-95 transition-all z-50 group">
        <span className="material-symbols-outlined text-3xl transition-transform group-hover:rotate-90">add</span>
      </Link>
    </>
  );
}
