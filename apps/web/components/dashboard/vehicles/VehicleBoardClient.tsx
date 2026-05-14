"use client";

import { useState } from "react";
import dayjs from "dayjs";
import 'dayjs/locale/tr';
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import { 
  Search, 
  CloudDownload, 
  PlusCircle,
  TrendingUp,
  Car,
  CarFront,
  Zap,
  Activity,
  MoreVertical,
  CalendarCheck,
  CalendarClock,
  Clock,
  BookOpen
} from "lucide-react";
import { VehicleDialog } from "@/app/(dashboard)/dashboard/vehicles/VehicleDialog";

dayjs.extend(relativeTime);
dayjs.locale('tr');

interface VehicleBoardProps {
  data: {
    metrics: {
      total: number;
      avgAge: number;
      evRate: number;
    };
    recentRegistrations: any[];
    vehiclesList: any[];
  };
  customers: { id: string; name: string }[];
}

export default function VehicleBoardClient({ data, customers }: VehicleBoardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("TÜMÜ");
  const [viewType, setViewType] = useState<"GRID" | "LIST">("GRID");

  const { metrics, recentRegistrations, vehiclesList } = data;

  // Filtreleme (Arama ve Buton filterı)
  const filteredVehicles = vehiclesList.filter(v => {
    const term = searchTerm.toLowerCase();
    const searchMatch = v.plate?.toLowerCase().includes(term) || 
                        v.brand?.toLowerCase().includes(term) || 
                        v.model?.toLowerCase().includes(term) ||
                        v.ownerName?.toLowerCase().includes(term);
    
    // Status Buton grupları için filter (ALL, READY, IN QUEUE, URGENT)
    const statusMatch = filterStatus === "TÜMÜ" ? true : v.statusLabel === filterStatus;
    
    return searchMatch && statusMatch;
  });

  return (
    <div className="space-y-8">
      
      {/* Action Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative group flex-1 md:max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm">search</span>
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
            placeholder="Plaka veya Müşteri ara..." 
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-800 border border-outline-variant/20 rounded-xl text-primary font-bold hover:bg-blue-50 transition-all ambient-shadow text-sm">
            <span className="material-symbols-outlined text-sm">download</span>
            PDF Aktar
          </button>
          <VehicleDialog customers={customers} />
        </div>
      </div>

      {/* Bento Filter & Metrics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
         <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="space-y-2">
                   <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Servis Durumu Filitresi</label>
                   <div className="flex flex-wrap items-center gap-2 mt-2">
                     <button 
                       onClick={() => setFilterStatus("TÜMÜ")}
                       className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${filterStatus === "TÜMÜ" ? "bg-slate-800 text-white border-slate-800" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"}`}>
                       TÜMÜ
                     </button>
                     <button 
                       onClick={() => setFilterStatus("BOŞTA")}
                       className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${filterStatus === "BOŞTA" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700"}`}>
                       BOŞTA
                     </button>
                     <button 
                       onClick={() => setFilterStatus("SERVİSTE")}
                       className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${filterStatus === "SERVİSTE" ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-700"}`}>
                       SERVİSTE
                     </button>
                     <button 
                       onClick={() => setFilterStatus("BEKLİYOR")}
                       className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${filterStatus === "BEKLİYOR" ? "bg-red-100 text-red-800 border-red-200" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-red-50 hover:text-red-700"}`}>
                       BEKLİYOR
                     </button>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hızlı Arama</label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2">Mobil cihazlarda sağ üstten de sonuç arayabilirsiniz.</p>
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full lg:hidden block p-2 bg-slate-50 dark:bg-gray-800/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Şase, plaka..." 
                  />
                </div>

            </div>
         </div>

         {/* Right Primary Counter Bento Box */}
         <div className="bg-blue-800 p-6 rounded-2xl flex flex-col justify-between text-white relative overflow-hidden shadow-lg shadow-blue-800/30">
            <div className="relative z-10">
               <h4 className="text-4xl lg:text-5xl font-black mb-1 tracking-tighter">{metrics.total}</h4>
               <p className="text-xs opacity-80 font-medium">Sistemdeki Aktif Araçlar</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-blue-200 text-xs font-bold relative z-10">
               <TrendingUp className="w-4 h-4" /> Sürekli büyüme
            </div>
            <Car className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10" />
         </div>
      </div>

      {/* View Switcher Headline */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 md:px-4 mt-4 gap-4">
        <h3 className="text-lg font-black text-slate-800 dark:text-gray-200">Araç Veritabanı</h3>
        <div className="flex items-center gap-4">
           <div className="flex items-center bg-slate-100 dark:bg-gray-700 p-1 rounded-lg">
             <button onClick={() => setViewType("GRID")} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewType === 'GRID' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Kart</button>
             <button onClick={() => setViewType("LIST")} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewType === 'LIST' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Liste</button>
           </div>
           <span className="text-xs font-bold bg-white dark:bg-gray-800 px-3 py-1 border border-slate-200 rounded-full shadow-sm text-slate-500 hidden sm:inline-block">
              {filteredVehicles.length} sonuç listeleniyor
           </span>
        </div>
      </div>

      {/* Grid or List of Vehicles */}
      {viewType === "GRID" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {filteredVehicles.length === 0 ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16 bg-white dark:bg-gray-800 border border-slate-100 rounded-3xl">
               <CarFront className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
               <p className="text-slate-500 dark:text-slate-400 font-bold">Aranan kriterlerde araç bulunamadı.</p>
            </div>
          ) : (
            filteredVehicles.map(v => {
              
              // Status Renkleri
              let statusBadge = "bg-emerald-100 text-emerald-800";
              let mainIcon = <CarFront className="w-8 h-8" />;
                 
              if (v.statusLabel === "SERVİSTE") {
                 statusBadge = "bg-amber-100 text-amber-800";
                 mainIcon = <Activity className="w-8 h-8" />;
              } else if (v.statusLabel === "BEKLİYOR") {
                 statusBadge = "bg-red-100 text-red-800";
                 mainIcon = <Clock className="w-8 h-8" />;
              }
              // Elektrikliyse ikon farklı
              if (v.fuelType?.toLowerCase().includes("elektrik") || v.fuelType?.toLowerCase().includes("ev")) {
                 mainIcon = <Zap className="w-8 h-8" />;
              }

              return (
                <div key={v.id} className="group bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 border border-transparent hover:border-blue-500/10 flex flex-col justify-between">
                  <div>
                     <div className="flex justify-between items-start mb-6 gap-2">
                       <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-gray-800/50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-inner">
                             {mainIcon}
                          </div>
                          <div>
                             <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{v.plate}</p>
                             <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight mt-0.5">{v.brand} {v.model}</h4>
                             <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">Sahibi: <span className="text-slate-700 dark:text-gray-300 font-bold">{v.ownerName}</span></p>
                          </div>
                       </div>
                       <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider whitespace-nowrap ${statusBadge}`}>
                          {v.statusLabel}
                       </span>
                     </div>

                     <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                       <div>
                         <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><CalendarCheck className="w-3 h-3"/> Son Servis</p>
                         <p className="text-xs font-black text-slate-800 dark:text-gray-200">
                            {v.lastServiceDate ? dayjs(v.lastServiceDate).format('DD MMM YYYY') : "Kayıt Yok"}
                         </p>
                       </div>
                       <div>
                         <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><CalendarClock className="w-3 h-3"/> Randevu</p>
                         <p className={`text-xs font-black ${v.statusLabel === 'BEKLİYOR' ? 'text-red-500' : 'text-amber-600'}`}>
                            {v.nextAppointmentDate ? dayjs(v.nextAppointmentDate).fromNow() : "Bekleyen Yok"}
                         </p>
                       </div>
                     </div>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <Link href={`/dashboard/vehicles/${v.id}`} className="flex-1 bg-slate-50 dark:bg-gray-800/50 text-blue-700 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all text-center">
                      Geçmişi Gör
                    </Link>
                    {v.statusLabel === "BOŞTA" ? (
                      <Link href={`/dashboard/services/new?vehicleId=${v.id}`} className="flex-1 bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-700/20 hover:bg-blue-800 transition-all active:scale-95 text-center flex items-center justify-center gap-1">
                        <PlusCircle className="w-3.5 h-3.5"/> Servis Aç
                      </Link>
                    ) : (
                      <button disabled className="flex-1 bg-slate-100 dark:bg-gray-700 text-slate-400 py-2.5 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1 cursor-not-allowed" title="Araç zaten serviste">
                        <PlusCircle className="w-3.5 h-3.5"/> Servis Aç
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 dark:bg-gray-800/50/50 border-b border-slate-100">
                 <tr>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Araç & Plaka</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Müşteri</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Durum</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Son Servis</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Randevu</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">İşlem</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {filteredVehicles.length === 0 ? (
                   <tr>
                     <td colSpan={6} className="text-center py-12 text-slate-500 dark:text-slate-400 font-bold">Aranan kriterlerde araç bulunamadı.</td>
                   </tr>
                 ) : (
                   filteredVehicles.map(v => {
                      let statusBadge = "bg-emerald-100 text-emerald-800";
                      let mainIcon = <CarFront className="w-6 h-6" />;
                         
                      if (v.statusLabel === "SERVİSTE") {
                         statusBadge = "bg-amber-100 text-amber-800";
                         mainIcon = <Activity className="w-6 h-6" />;
                      } else if (v.statusLabel === "BEKLİYOR") {
                         statusBadge = "bg-red-100 text-red-800";
                         mainIcon = <Clock className="w-6 h-6" />;
                      }
                      if (v.fuelType?.toLowerCase().includes("elektrik") || v.fuelType?.toLowerCase().includes("ev")) {
                         mainIcon = <Zap className="w-6 h-6" />;
                      }

                     return (
                       <tr key={v.id} className="hover:bg-slate-50 dark:bg-gray-800/50/50 transition-colors group">
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                {mainIcon}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{v.brand} {v.model}</p>
                                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 tracking-widest">{v.plate}</p>
                              </div>
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <span className="text-xs font-bold text-slate-700 dark:text-gray-300">{v.ownerName}</span>
                         </td>
                         <td className="px-6 py-4">
                           <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider whitespace-nowrap ${statusBadge}`}>
                             {v.statusLabel}
                           </span>
                         </td>
                         <td className="px-6 py-4">
                           <span className="text-xs font-bold text-slate-800 dark:text-gray-200">
                              {v.lastServiceDate ? dayjs(v.lastServiceDate).format('DD MMM YYYY') : "Kayıt Yok"}
                           </span>
                         </td>
                         <td className="px-6 py-4">
                           <span className={`text-xs font-bold ${v.statusLabel === 'BEKLİYOR' ? 'text-red-500' : 'text-amber-600'}`}>
                              {v.nextAppointmentDate ? dayjs(v.nextAppointmentDate).fromNow() : "Bekleyen Yok"}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Link href={`/dashboard/vehicles/${v.id}`} className="p-2 bg-slate-100 dark:bg-gray-700 text-blue-700 rounded-lg hover:bg-blue-600 hover:text-white transition-all" title="Geçmişi Gör">
                                 <BookOpen className="w-4 h-4" />
                               </Link>
                               {v.statusLabel === "BOŞTA" ? (
                                 <Link href={`/dashboard/services/new?vehicleId=${v.id}`} className="p-2 bg-blue-100 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-700 hover:text-white transition-all" title="Servis Aç">
                                   <PlusCircle className="w-4 h-4" />
                                 </Link>
                               ) : (
                                 <button disabled className="p-2 bg-slate-100 dark:bg-gray-700 text-slate-300 rounded-lg cursor-not-allowed" title="Araç zaten serviste">
                                   <PlusCircle className="w-4 h-4" />
                                 </button>
                               )}
                            </div>
                         </td>
                       </tr>
                     );
                   })
                 )}
               </tbody>
             </table>
          </div>
        </div>
      )}

      {/* Bottom Summary Section - Table & Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-12">
         
         <div className="xl:col-span-2">
           <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm border border-slate-100">
              <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800 dark:text-gray-200 text-sm">Son Kayıt Olan Araçlar</h3>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-gray-800/50/50">
                       <tr>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Araç Modeli</th>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Plaka</th>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kayıt Tarihi</th>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right"></th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {recentRegistrations.length === 0 ? (
                         <tr><td colSpan={4} className="text-center py-6 text-slate-500 dark:text-slate-400 font-medium">Kayıtlı veri yok.</td></tr>
                       ) : (
                         recentRegistrations.map((v: any, idx) => (
                           <tr key={idx} className="hover:bg-slate-50 dark:bg-gray-800/50:bg-slate-800/50 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-gray-700 flex items-center justify-center text-slate-500">
                                      <Car className="w-4 h-4" />
                                   </div>
                                   <div>
                                     <p className="text-sm font-bold text-slate-800 dark:text-gray-200">{v.brand} {v.model}</p>
                                     <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Sahibi: {v.ownerName}</p>
                                   </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-mono text-xs font-black tracking-widest text-blue-600">
                                 {v.plate}
                              </td>
                              <td className="px-6 py-4 text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-wider">
                                 {dayjs(v.createdAt).fromNow()}
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600 dark:text-slate-400">
                                   <MoreVertical className="w-4 h-4" />
                                 </button>
                              </td>
                           </tr>
                         ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
         </div>

         {/* Quick Analytics Sidebar */}
         <div className="space-y-6">
            <div className="bg-gradient-to-br from-white to-slate-50 p-8 rounded-3xl border border-slate-200 dark:border-gray-700/50 relative overflow-hidden shadow-sm">
               <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 block flex items-center gap-2"><Activity className="w-3.5 h-3.5"/> Hızlı Analitik</span>
               <div className="space-y-6">
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                       <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Filo Yaş Ortalaması</p>
                       <p className="text-xl font-black text-slate-800 dark:text-gray-200">{metrics.avgAge} Yıl</p>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                       <div className="w-[66%] h-full bg-blue-600 rounded-full"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                       <p className="text-xs font-bold text-slate-500 dark:text-slate-400">EV (Elektrikli) Adaptasyon Oranı</p>
                       <p className="text-xl font-black text-slate-800 dark:text-gray-200">%{metrics.evRate}</p>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                       <div className="h-full bg-amber-500 rounded-full" style={{ width: `${metrics.evRate || 0}%` }}></div>
                    </div>
                  </div>

               </div>
            </div>

            <div className="bg-blue-800 text-white p-8 rounded-3xl shadow-xl shadow-blue-800/20 group cursor-pointer overflow-hidden relative">
               <div className="relative z-10">
                 <h4 className="text-lg font-black mb-2 flex items-center gap-2"><BookOpen className="w-5 h-5"/> Teknik Bültenler</h4>
                 <p className="text-[11px] font-medium opacity-80 mb-5 leading-relaxed">Üretici servis geri çağırmaları (recall) ve teknik altyapı güncellemelerini görüntüleyin.</p>
                 <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-lg group-hover:bg-white dark:bg-gray-800 group-hover:text-blue-800 transition-colors inline-block">Kütüphaneye Git</span>
               </div>
               <div className="absolute -right-4 -bottom-4 bg-white/5 w-32 h-32 rounded-full blur-2xl group-hover:bg-white dark:bg-gray-800/10 transition-colors"></div>
            </div>
         </div>

      </div>

    </div>
  );
}
