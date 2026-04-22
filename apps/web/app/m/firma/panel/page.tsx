import React from "react";
import { getFirmaPanelData } from "@/lib/actions/mobile.actions";

export const metadata = {
  title: "Yönetici Dashboard | MS Oto Servis",
};

export default async function FirmaMobileDashboard() {
  const dataRes = await getFirmaPanelData();

  if (dataRes.error || !dataRes.overview) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="material-symbols-outlined text-outline-variant text-6xl mb-4">error</span>
        <h2 className="text-xl font-bold mb-2">Hata Oluştu</h2>
        <p className="text-on-surface-variant text-center">{dataRes.error || "Veriler alınırken hata oluştu"}</p>
      </div>
    );
  }

  const { overview } = dataRes;
  const formatMoney = (val: number | string | any) => `₺${Number(val).toLocaleString('tr-TR')}`;

  const maxWeekly = Math.max(...(overview.weeklyTrend || [1]));
  const weekDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  return (
    <>
      {/* Period Filter & Welcome */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-blue-900">Hoş geldiniz, {overview.userName}</h2>
          <p className="text-slate-500 mt-1">İşletmenizin bugünkü performans özeti burada.</p>
        </div>
        <div className="inline-flex p-1.5 bg-surface-container rounded-2xl gap-1">
          <button className="px-6 py-2 rounded-xl text-sm font-bold bg-white text-primary shadow-sm transition-all">Bugün</button>
          <button className="px-6 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-white/50 transition-all">Bu Hafta</button>
          <button className="px-6 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-white/50 transition-all">Bu Ay</button>
        </div>
      </section>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Daily Revenue */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,35,111,0.03)] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50 rounded-xl">
              <span className="material-symbols-outlined text-blue-700">payments</span>
            </div>
            <span className="flex items-center text-xs font-bold text-secondary bg-[#6cf8bb]/20 px-2 py-1 rounded-full">
              <span className="material-symbols-outlined text-xs mr-1">trending_up</span> Canlı
            </span>
          </div>
          <div className="mt-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Günlük Ciro</p>
            <h3 className="text-2xl font-bold text-blue-900 mt-1">{formatMoney(overview.dailyRevenue)}</h3>
          </div>
        </div>

        {/* Vehicles in Service */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,35,111,0.03)] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50 rounded-xl">
              <span className="material-symbols-outlined text-blue-700">minor_crash</span>
            </div>
            <span className="text-[10px] font-bold text-blue-900 bg-blue-100 px-2 py-1 rounded-full">CANLI</span>
          </div>
          <div className="mt-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Servisteki Araç</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-blue-900 mt-1">{overview.activeServicesCount}</h3>
              <span className="text-xs text-slate-500 font-medium">({overview.approvalQueue.length} Beklemede)</span>
            </div>
          </div>
        </div>

        {/* Completed Jobs */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,35,111,0.03)] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50 rounded-xl">
              <span className="material-symbols-outlined text-blue-700">task_alt</span>
            </div>
            <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden mt-4">
              <div className="h-full bg-blue-600" style={{ width: `${Math.min(100, (overview.completedToday / (overview.completedToday + overview.activeServicesCount || 1)) * 100)}%` }}></div>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bugün Tamamlanan</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-blue-900 mt-1">{overview.completedToday} <span className="text-slate-300 font-light">/ {overview.completedToday + overview.activeServicesCount}</span></h3>
              <span className="text-[10px] font-bold text-blue-400 uppercase">Toplam Çıkan</span>
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-blue-900 p-6 rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,35,111,0.1)] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-white/10 rounded-xl">
              <span className="material-symbols-outlined text-white">notification_important</span>
            </div>
            {overview.escalations.length + overview.criticalParts.length > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a] animate-pulse"></span>
            )}
          </div>
          <div className="mt-6">
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Kritik Uyarı</p>
            <h3 className="text-2xl font-bold text-white mt-1">{overview.escalations.length + overview.criticalParts.length} Bekliyor</h3>
          </div>
        </div>
      </section>

      {/* Main Content Area: Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Revenue Area Chart Simulation */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,35,111,0.03)]">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-bold text-blue-900">Haftalık Performans Trendi</h4>
            <span className="text-xs font-semibold text-slate-400">₺ Nakit Akışı</span>
          </div>

          <div className="relative h-64 w-full flex items-end justify-between px-2 gap-4">
            {overview.weeklyTrend?.map((val: number, idx: number) => {
              const pct = Math.max(10, (val / maxWeekly) * 95);
              const isToday = idx === 6; // Since today is index 6
              return (
                <div key={idx} className="relative flex-1 group">
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-blue-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatMoney(val)}
                  </div>
                  {isToday ? (
                    <div className="w-full bg-gradient-to-t from-blue-500 to-blue-800 rounded-t-lg shadow-lg relative group-hover:from-blue-600 transition-all" style={{ height: `${pct}%` }}></div>
                  ) : (
                    <div className="w-full bg-gradient-to-t from-blue-50 to-blue-200 rounded-t-lg transition-all hover:from-blue-100 hover:to-blue-300" style={{ height: `${pct}%` }}></div>
                  )}
                  <p className={`text-center text-[10px] font-bold mt-2 ${isToday ? "text-blue-900" : "text-slate-400"}`}>{weekDays[idx]}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Critical Warnings Section */}
        <div className="bg-surface-container-low p-8 rounded-2xl space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#ba1a1a]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <h4 className="text-lg font-extrabold text-blue-900">Karmaşık Durumlar</h4>
          </div>
          <div className="space-y-4">

            {/* Stock Alert */}
            {overview.criticalParts.slice(0, 1).map((part: any) => (
              <div key={part.id} className="bg-white p-4 rounded-xl flex items-center gap-4 transition-transform hover:scale-[1.02] cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                  <span className="material-symbols-outlined">inventory_2</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-blue-900">Stok Uyarısı</p>
                  <p className="text-[11px] text-slate-500 italic">{part.name} Azaldı ({part.currentStock} Adet)</p>
                </div>
                <span className="material-symbols-outlined text-slate-300 text-sm">chevron_right</span>
              </div>
            ))}

            {/* Pending Quote / Approval */}
            {overview.approvalQueue.slice(0, 2).map((order: any) => (
              <div key={order.id} className="bg-white p-4 rounded-xl flex items-center gap-4 transition-transform hover:scale-[1.02] cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <span className="material-symbols-outlined">request_quote</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-blue-900">Onay Bekleyen İşlem</p>
                  <p className="text-[11px] text-slate-500">{order.vehicle?.plate} - {formatMoney(order.totalAmount)}</p>
                </div>
                <span className="material-symbols-outlined text-slate-300 text-sm">chevron_right</span>
              </div>
            ))}

            {/* Empty States */}
            {overview.criticalParts.length === 0 && overview.approvalQueue.length === 0 && (
              <p className="text-sm text-slate-500 font-medium">Bütün işler yolunda görünüyor.</p>
            )}

            {/* Overdue Debt Mock (Replaced by Escaped/Urgent) */}
            {overview.escalations.slice(0, 2).map((esc: any) => (
              <div key={esc.id} className="bg-white p-4 rounded-xl flex items-center gap-4 border-l-4 border-error transition-transform hover:scale-[1.02] cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                  <span className="material-symbols-outlined">notification_important</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-700">Acil Araç</p>
                  <p className="text-[11px] text-slate-500">{esc.vehicle?.plate} - {esc.complaintDescription?.substring(0, 25)}</p>
                </div>
                <span className="material-symbols-outlined text-slate-300 text-sm">chevron_right</span>
              </div>
            ))}
          </div>

          <button className="w-full py-3 rounded-xl bg-blue-900 text-white text-sm font-bold shadow-md hover:bg-blue-800 transition-colors">
            Tüm Sistem Raporunu Gör
          </button>
        </div>

        {/* Workshop Live Status Grid */}
        <div className="lg:col-span-3 bg-surface-container-lowest p-8 rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,35,111,0.03)]">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#006c49] animate-pulse"></div>
              <h4 className="text-lg font-bold text-blue-900">Servis Alanı Canlı Durumu</h4>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                <span className="w-3 h-3 rounded-full bg-slate-100"></span> Boş
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                <span className="w-3 h-3 rounded-full bg-blue-600"></span> Dolu
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">

            {Array.from({ length: 5 }).map((_, i) => {
              const activeBay = overview.activeBays[i];

              if (activeBay) {
                // Occupied
                const isWaiting = activeBay.status === "WAITING_APPROVAL";
                const badgeColor = isWaiting ? "bg-amber-500" : "bg-emerald-600";
                const badgeText = isWaiting ? "BEKLEMEDE" : "İŞLEMDE";

                return (
                  <div key={i} className="p-5 rounded-2xl bg-blue-900 text-white flex flex-col shadow-[0_10px_20px_rgba(0,35,111,0.15)] transition-transform hover:-translate-y-1 cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <span className="material-symbols-outlined text-white/50 text-3xl">precision_manufacturing</span>
                      <span className={`text-[9px] font-extrabold ${badgeColor} text-white px-2 py-1 rounded`}>{badgeText}</span>
                    </div>
                    <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">LİFT {i + 1}</p>
                    <h5 className="text-lg font-bold mt-1 truncate">{activeBay.vehicle?.plate || "Plakasız"}</h5>
                    <p className="text-xs text-blue-100/70 mt-2 font-medium truncate">
                      {activeBay.assignedMechanic?.firstName || "Bekliyor"}
                    </p>
                  </div>
                );
              }

              // Empty
              return (
                <div key={i} className="p-5 rounded-2xl bg-surface-container-low border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-white hover:border-blue-200 transition-all">
                  <span className="material-symbols-outlined text-slate-300 text-4xl mb-2 group-hover:text-blue-300">garage_home</span>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">LİFT {i + 1}</p>
                  <p className="text-sm font-bold text-slate-500 mt-1">BOŞ</p>
                </div>
              );
            })}

          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-24 right-6 md:bottom-12 md:right-12 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-900 text-white rounded-2xl shadow-2xl flex items-center justify-center group active:scale-95 transition-all z-40">
        <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform duration-500">add</span>
      </button>
    </>
  );
}
