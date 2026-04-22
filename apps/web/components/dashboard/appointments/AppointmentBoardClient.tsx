"use client";

import { useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import 'dayjs/locale/tr';
import relativeTime from "dayjs/plugin/relativeTime";
import AppointmentFormModal from "./AppointmentFormModal";
import { updateAppointmentStatus, sendAppointmentReminder } from "@/lib/actions/appointment.actions";
import { 
  ChevronLeft, 
  ChevronRight, 
  Wrench, 
  X,
  CalendarCheck,
  Building2,
  Users,
  Search,
  Bell,
  Settings,
  Plus
} from "lucide-react";

dayjs.extend(relativeTime);
dayjs.locale('tr');

interface BoardProps {
  appointments: any[];
  customers: any[];
  vehicles: any[];
  stats: {
    todayCount: number;
    pendingCount: number;
    confirmedCount: number;
    weeklyCount: number;
    noShowCount: number;
  };
}

export default function AppointmentBoardClient({ appointments, customers, vehicles, stats }: BoardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [reminderStatus, setReminderStatus] = useState<Record<string, string>>({});
  
  // Takvim jenerasyonu
  const daysInMonth = currentDate.daysInMonth();
  const firstDayOfMonth = currentDate.startOf('month').day(); 
  
  const calendarDays = [];
  for (let i = 1; i < (firstDayOfMonth === 0 ? 7 : firstDayOfMonth); i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const upcomingApts = appointments.filter((a: any) => a.status === "CONFIRMED" || a.status === "PENDING").slice(0, 5);
  const historicApts = appointments.filter((a: any) => a.status === "CANCELLED" || a.status === "COMPLETED").slice(0, 3);
  const displayApts = [...upcomingApts, ...historicApts];

  const handleStatusChange = async (id: string, status: "CONFIRMED" | "CANCELLED" | "COMPLETED") => {
    await updateAppointmentStatus({ id, status });
  };

  const handleNewObj = () => {
    setSelectedApt(null);
    setIsModalOpen(true);
  };

  const handleReminder = async (aptId: string) => {
    setReminderStatus(prev => ({ ...prev, [aptId]: "sending" }));
    const res = await sendAppointmentReminder(aptId);
    if (res.success) {
      setReminderStatus(prev => ({ ...prev, [aptId]: "sent" }));
      setTimeout(() => setReminderStatus(prev => ({ ...prev, [aptId]: "" })), 4000);
    } else {
      setReminderStatus(prev => ({ ...prev, [aptId]: "error" }));
      alert(res.error);
    }
  };

  return (
    <>
      {/* Action Buttons */}
      <div className="flex justify-end mb-6">
        <button 
          onClick={handleNewObj}
          className="flex items-center px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all transform active:scale-95 shadow-blue-900/20 gap-2"
        >
          <Plus className="w-4 h-4" />
          Yeni Randevu
        </button>
      </div>

      <div className="space-y-8">

        {/* İstatistik Gösterimi */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bugünkü</p>
            <p className="text-3xl font-black text-blue-700 mt-2">{stats.todayCount}</p>
            <p className="text-xs text-slate-500 mt-1">randevu</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Bekleyen</p>
            <p className="text-3xl font-black text-orange-600 mt-2">{stats.pendingCount}</p>
            <p className="text-xs text-slate-500 mt-1">onay bekliyor</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Onaylı</p>
            <p className="text-3xl font-black text-emerald-600 mt-2">{stats.confirmedCount}</p>
            <p className="text-xs text-slate-500 mt-1">doğrulanmış</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Haftalık</p>
            <p className="text-3xl font-black text-blue-600 mt-2">{stats.weeklyCount}</p>
            <p className="text-xs text-slate-500 mt-1">önümüzdeki 7 gün</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Gelmedi</p>
            <p className="text-3xl font-black text-red-600 mt-2">{stats.noShowCount}</p>
            <p className="text-xs text-slate-500 mt-1">no-show</p>
          </div>
        </div>

        {/* Takvim ve Sağ Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="col-span-1 lg:col-span-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black text-slate-900 capitalize">{currentDate.format('MMMM YYYY')}</h2>
                <div className="flex bg-white border border-slate-200 rounded-xl shadow-sm p-1">
                  <button onClick={() => setCurrentDate(p => p.subtract(1, 'month'))} className="p-1 hover:bg-slate-50:bg-slate-800 rounded-md text-slate-500 transition-colors"><ChevronLeft className="w-5 h-5"/></button>
                  <button onClick={() => setCurrentDate(dayjs())} className="px-4 py-1.5 text-xs font-bold border-x border-slate-100 text-slate-700 hover:bg-slate-50 transition-colors">Bugün</button>
                  <button onClick={() => setCurrentDate(p => p.add(1, 'month'))} className="p-1 hover:bg-slate-50:bg-slate-800 rounded-md text-slate-500 transition-colors"><ChevronRight className="w-5 h-5"/></button>
                </div>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button className="px-5 py-2 text-xs font-bold bg-white shadow-sm rounded-lg text-blue-600">Ay</button>
                <button className="px-5 py-2 text-xs font-bold text-slate-500 hover:text-slate-700:text-white transition-colors">Hafta</button>
                <button className="px-5 py-2 text-xs font-bold text-slate-500 hover:text-slate-700:text-white transition-colors">Gün</button>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-7 border-b border-slate-100">
                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day, ix) => (
                   <div key={day} className={`py-4 text-center text-[10px] font-black uppercase tracking-widest ${ix >= 5 ? 'text-orange-500' : 'text-slate-400'}`}>
                     {day}
                   </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 min-h-[600px] auto-rows-fr">
                {calendarDays.map((dayNum, idx) => {
                  if (dayNum === null) {
                    return <div key={`empty-${idx}`} className="p-2 border-r border-b border-slate-100 bg-slate-50/30"></div>;
                  }

                  const targetDate = currentDate.date(dayNum).format('YYYY-MM-DD');
                  const dayAppointments = appointments.filter((a: any) => dayjs(a.appointmentDate).format('YYYY-MM-DD') === targetDate);
                  const isToday = dayNum === dayjs().date() && currentDate.isSame(dayjs(), 'month');

                  return (
                    <div 
                      key={`day-${dayNum}`} 
                      className={`p-2 border-r border-b border-slate-100 flex flex-col gap-1 transition-colors group hover:bg-slate-50:bg-slate-800/50 ${isToday ? 'bg-blue-50/50' : ''}`}
                    >
                      <span className={`text-sm font-bold block mb-2 ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                        {dayNum}
                      </span>
                      
                      <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar pr-1 cursor-pointer">
                        {dayAppointments.map((apt: any) => (
                          <div 
                            key={apt.id} 
                            onClick={() => { setSelectedApt(apt); setIsModalOpen(true); }}
                            className={`text-[10px] p-1.5 rounded-lg border-l-[3px] truncate transition-colors font-bold
                              ${apt.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border-blue-500 hover:bg-blue-100' : 
                                apt.status === 'PENDING' ? 'bg-orange-50 text-orange-700 border-orange-500 hover:bg-orange-100' : 
                                apt.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-500 hover:bg-red-100' : 
                                'bg-slate-100 text-slate-600 border-slate-400 hover:bg-slate-200'}
                            `}
                            title={`${apt.vehicle?.plate || 'Araç Yok'} - ${apt.type}`}
                          >
                            {apt.appointmentTime} {apt.vehicle?.plate || apt.customerName.split(' ')[0]}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800">Randevu Akışı</h3>
            </div>
            
            <div className="space-y-4">
              {displayApts.length === 0 ? (
                <div className="bg-slate-50 text-slate-500 p-8 rounded-2xl text-center text-sm font-bold border border-slate-200 border-dashed">
                  Aktif randevu planlaması bulunamadı.
                </div>
              ) : displayApts.map((apt: any) => {
                const isCancelled = apt.status === "CANCELLED";
                const isPending = apt.status === "PENDING";
                
                return (
                  <div key={apt.id} className={`bg-white p-5 rounded-2xl border border-slate-200 transition-all group ${isCancelled ? 'opacity-50 grayscale hover:grayscale-0' : 'shadow-sm hover:shadow-md'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg 
                          ${isCancelled ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600'}`}>
                          {apt.customerName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p onClick={() => { setSelectedApt(apt); setIsModalOpen(true); }} className={`cursor-pointer text-sm font-black hover:text-blue-600 transition-colors ${isCancelled ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                             {apt.customerName}
                          </p>
                          <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mt-0.5">{apt.vehicleTitle}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black px-2 py-1 rounded-md tracking-widest uppercase
                        ${apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 
                          isPending ? 'bg-orange-100 text-orange-700' : 
                          isCancelled ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {apt.status === "CONFIRMED" ? "ONAYLANDI" : apt.status === "PENDING" ? "BEKLİYOR" : apt.status === "CANCELLED" ? "İPTAL" : "TAMAMLANDI"}
                      </span>
                      <Link href={`/dashboard/appointments/${apt.id}`} className="p-1.5 bg-slate-50 text-slate-400 hover:text-primary rounded-lg transition-colors" title="Detay">
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                      </Link>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-xs text-slate-600 mb-5 font-medium">
                      <div className="flex items-center gap-1.5 border border-slate-100 rounded-md px-2 py-1">
                        <CalendarCheck className="w-3 h-3 text-slate-400" />
                        {dayjs(apt.appointmentDate).format('DD MMM YYYY')} - {apt.appointmentTime}
                      </div>
                      <div className="flex items-center gap-1.5 border border-slate-100 rounded-md px-2 py-1">
                        <Wrench className="w-3 h-3 text-slate-400" />
                        {apt.type}
                      </div>
                    </div>
                    
                    {!isCancelled && apt.status !== "COMPLETED" && (
                      <div className="flex gap-2">
                        {isPending && (
                          <button 
                             onClick={() => handleStatusChange(apt.id, "CONFIRMED")}
                             className="flex-1 bg-blue-600 text-white text-[10px] font-black py-2.5 rounded-lg hover:bg-blue-700 transition-colors uppercase tracking-widest"
                          >
                             ONAYLA
                          </button>
                        )}
                        {apt.status === 'CONFIRMED' && (
                           <button 
                              onClick={() => handleStatusChange(apt.id, "COMPLETED")}
                              className="flex-1 bg-emerald-50 max-w-full text-emerald-600 text-[10px] font-black py-2.5 rounded-lg hover:bg-emerald-100 transition-colors uppercase tracking-widest"
                           >
                             İŞ EMRİNE ÇEVİR
                           </button>
                        )}
                        <button 
                          onClick={() => handleReminder(apt.id)}
                          disabled={reminderStatus[apt.id] === "sending"}
                          className={`px-3 py-2 rounded-lg transition-colors text-[10px] font-black flex items-center gap-1 ${reminderStatus[apt.id] === "sent" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
                          title="SMS Hatırlatma Gönder"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          {reminderStatus[apt.id] === "sending" ? "..." : reminderStatus[apt.id] === "sent" ? "✓" : "SMS"}
                        </button>
                        <button 
                           onClick={() => handleStatusChange(apt.id, "CANCELLED")}
                           className="px-3 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors focus:ring focus:ring-red-200"
                           title="Randevuyu İptal Et"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-5 border border-slate-800 overflow-hidden relative shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl"></div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                <span>Teknisyen Durumu (Aktif)</span>
                <Users className="w-4 h-4 text-slate-500" />
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                    <span className="text-sm font-bold">Ahmet Usta</span>
                  </div>
                  <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded text-slate-300">Uygunluk Var</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <AppointmentFormModal 
         isOpen={isModalOpen}
         onClose={() => setIsModalOpen(false)}
         appointmentData={selectedApt}
         customers={customers}
         vehicles={vehicles}
      />
    </>
  );
}
