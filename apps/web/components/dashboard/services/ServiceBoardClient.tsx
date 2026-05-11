"use client";

import { useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import 'dayjs/locale/tr';
import relativeTime from "dayjs/plugin/relativeTime";
import { Search, Filter, Plus, MoreHorizontal, Edit, AlertCircle, Wrench, CheckCircle, Trash2 } from "lucide-react";
import ServiceOrderFormModal from "./ServiceOrderFormModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { deleteServiceOrder } from "@/lib/actions/service.actions";

dayjs.extend(relativeTime);
dayjs.locale('tr');

// Enum Mapping for Kanban Columns
const STATUS_MAP = {
  PENDING: { label: "Servise Alındı / Hazırlanıyor", color: "border-slate-300", badgeBg: "bg-slate-100", badgeText: "text-slate-700" },
  WAITING_APPROVAL: { label: "Ek Onay Bekleniyor", color: "border-orange-400 border-dashed border-2", badgeBg: "bg-orange-100", badgeText: "text-orange-700" },
  IN_PROGRESS: { label: "Aktif İşlemde", color: "border-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.15)]", badgeBg: "bg-blue-100", badgeText: "text-blue-700" },
  COMPLETED: { label: "Tamamlandı / Teslime Hazır", color: "border-emerald-500", badgeBg: "bg-emerald-100", badgeText: "text-emerald-700" },
};

interface ServiceBoardProps {
  orders: any[];
  customers: any[];
  vehicles: any[];
  mechanics: any[];
}

export default function ServiceBoardClient({ orders, customers, vehicles, mechanics }: ServiceBoardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const filteredOrders = orders?.filter(o => 
    o.vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.complaintDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: "PENDING", items: filteredOrders.filter((o: any) => o.status === "PENDING") },
    { key: "WAITING_APPROVAL", items: filteredOrders.filter((o: any) => o.status === "WAITING_APPROVAL") },
    { key: "IN_PROGRESS", items: filteredOrders.filter((o: any) => o.status === "IN_PROGRESS") },
    { key: "COMPLETED", items: filteredOrders.filter((o: any) => o.status === "COMPLETED") },
  ];

  const handleDelete = async () => {
    if(!selectedOrder) return;
    setIsDeleting(true);
    await deleteServiceOrder(selectedOrder.id);
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setSelectedOrder(null);
  };

  const [viewType, setViewType] = useState<"kanban" | "list">("kanban");

  return (
    <div className="flex flex-col h-full space-y-4">
      
      {/* Search & Actions Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100 w-full md:w-auto">
           <button 
             onClick={() => setViewType("kanban")}
             className={`px-5 py-2.5 text-sm font-black rounded-xl shadow-sm transition-all ${
               viewType === "kanban" 
                 ? "bg-white text-blue-600 border border-slate-200" 
                 : "text-slate-500 bg-transparent border border-transparent hover:text-slate-700 hover:bg-slate-100"
             }`}
           >
             Kanban Board
           </button>
           <button 
             onClick={() => setViewType("list")}
             className={`px-5 py-2.5 text-sm font-black rounded-xl shadow-sm transition-all ${
               viewType === "list" 
                 ? "bg-white text-blue-600 border border-slate-200" 
                 : "text-slate-500 bg-transparent border border-transparent hover:text-slate-700 hover:bg-slate-100"
             }`}
           >
             Liste
           </button>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-72">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-colors" 
               placeholder="Plaka veya Müşteri ara..." 
               type="text"
             />
           </div>
           
           <button 
             onClick={() => setIsModalOpen(true)}
             className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-[11px] uppercase tracking-widest font-black rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all whitespace-nowrap"
           >
              <Plus className="w-4 h-4" /> YENİ İŞ EMRİ
           </button>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="mt-4 flex-1">
        {viewType === "kanban" ? (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full items-start">
            {columns.map((column) => {
              const statusConfig = STATUS_MAP[column.key as keyof typeof STATUS_MAP];
              
              return (
                <div key={column.key} className="bg-slate-50/50 p-3 rounded-3xl border border-slate-100 flex flex-col gap-4 h-[calc(100vh-280px)]">
                  
                  {/* Column Header */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-2 cursor-grab active:cursor-grabbing">
                      <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{statusConfig.label}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-black ${statusConfig.badgeBg} ${statusConfig.badgeText}`}>
                        {column.items.length}
                      </span>
                    </div>
                    <div className={`h-1.5 w-full rounded-full ${column.key === 'IN_PROGRESS' ? 'bg-blue-500' : column.key === 'COMPLETED' ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                  </div>
                  
                  {/* Cards Container */}
                  <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1 h-full pb-10">
                    {column.items.length === 0 ? (
                      <div className="h-28 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-1 opacity-60">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Boş</span>
                      </div>
                    ) : (
                      column.items.map((order: any) => (
                        <div 
                          key={order.id} 
                          className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-5 group hover:shadow-xl hover:-translate-y-0.5 transition-all relative border-l-4
                            ${statusConfig.color}`}
                        >
                          <div className="flex justify-between items-start mb-4">
                             <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-black tracking-widest uppercase">
                                {order.vehicle.plate}
                             </span>
                             <span className="text-slate-400 text-[10px] uppercase font-bold tracking-tight">
                                {dayjs(order.createdAt).fromNow(true)}
                             </span>
                          </div>
                          
                          <h4 className="text-sm font-black text-slate-900 mb-1.5 leading-tight capitalize">
                             {order.customerName}
                          </h4>
                          
                          <p className="text-xs text-slate-500 mb-6 line-clamp-2 leading-relaxed font-medium">
                             {order.complaintDescription}
                          </p>
                          
                          <div className="flex items-center justify-between pt-2">
                             <div className="flex items-center gap-2">
                               <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[10px] ring-2 ring-white shadow-sm border border-blue-100">
                                 {order.assignedMechanic ? order.assignedMechanic.firstName[0] : '?'}
                               </div>
                               {order.assignedMechanic ? (
                                 <span className="text-[10px] font-bold text-slate-600">{order.assignedMechanic.firstName} {order.assignedMechanic.lastName}</span>
                               ) : (
                                 <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-2 py-1 rounded">Usta Yok</span>
                               )}
                             </div>
                             
                             <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link href={`/dashboard/services/${order.id}`}>
                                  <div className="p-1.5 bg-slate-50 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors cursor-pointer" title="Detay / Düzenle">
                                    <Edit className="w-3.5 h-3.5" />
                                  </div>
                                </Link>
                                
                                <button 
                                  onClick={() => { setSelectedOrder(order); setIsDeleteModalOpen(true); }}
                                  className="p-1.5 bg-slate-50 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                                  title="İş Emrini Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                             </div>
                          </div>
                          
                        </div>
                      ))
                    )}
                  </div>
                  
                </div>
              );
            })}
            
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
            <div className="overflow-x-auto h-[calc(100vh-280px)] custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-widest sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4">Araç & Müşteri</th>
                    <th className="px-6 py-4">Kayıt Zamanı</th>
                    <th className="px-6 py-4">Durum</th>
                    <th className="px-6 py-4">Atanan Usta</th>
                    <th className="px-6 py-4">Şikayet/İşlem</th>
                    <th className="px-6 py-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                        Sonuç bulunamadı
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order: any) => {
                      const statusConfig = STATUS_MAP[order.status as keyof typeof STATUS_MAP] || STATUS_MAP.PENDING;
                      return (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex w-fit items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-black tracking-widest uppercase">
                                {order.vehicle.plate}
                              </span>
                              <span className="text-sm font-bold text-slate-800 capitalize">
                                {order.customerName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-700">{dayjs(order.createdAt).format("DD MMM YYYY")}</span>
                              <span className="text-xs text-slate-400">{dayjs(order.createdAt).fromNow()}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${statusConfig.badgeBg} ${statusConfig.badgeText}`}>
                              {statusConfig.label.split(" / ")[0]}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {order.assignedMechanic ? (
                                <>
                                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[9px] border border-blue-100">
                                    {order.assignedMechanic.firstName[0]}
                                  </div>
                                  <span className="text-xs font-bold text-slate-600">{order.assignedMechanic.firstName} {order.assignedMechanic.lastName}</span>
                                </>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400">Atanmadı</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-slate-500 line-clamp-2 max-w-xs" title={order.complaintDescription}>
                              {order.complaintDescription}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link href={`/dashboard/services/${order.id}`}>
                                <button className="p-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg text-slate-500 hover:text-blue-600 transition-colors" title="Detay / Düzenle">
                                  <Edit className="w-4 h-4" />
                                </button>
                              </Link>
                              <button 
                                onClick={() => { setSelectedOrder(order); setIsDeleteModalOpen(true); }}
                                className="p-1.5 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                                title="İş Emrini Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
      </section>

      <ServiceOrderFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customers={customers}
        vehicles={vehicles}
        mechanics={mechanics}
      />

      <ConfirmDialog 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="İş Emrini Sil"
        description={selectedOrder ? `Seçili araca (${selectedOrder?.vehicle?.plate}) ait servis iş emrini ve tüm alt kayıtlarını/faturalarını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.` : ""}
      />

    </div>
  );
}
