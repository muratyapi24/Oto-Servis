"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import dayjs from "dayjs";
import 'dayjs/locale/tr';
import relativeTime from "dayjs/plugin/relativeTime";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { deleteServiceOrder } from "@/lib/actions/service.actions";
import {
  DASHBOARD_ACTIONS,
  DASHBOARD_FORMS,
  DASHBOARD_LIST,
  DASHBOARD_SURFACES,
} from "@/lib/dashboard-ui-standards";

dayjs.extend(relativeTime);
dayjs.locale('tr');

const ServiceOrderFormModal = dynamic(() => import("./ServiceOrderFormModal"), {
  ssr: false,
  loading: () => null,
});

// Enum Mapping for Kanban Columns
const STATUS_MAP = {
  PENDING: {
    label: "Servise Alındı / Hazırlanıyor",
    color: "border-l-outline-variant",
    badgeBg: "bg-surface-container-low",
    badgeText: "text-on-surface-variant",
    accent: "bg-outline-variant",
  },
  WAITING_APPROVAL: {
    label: "Ek Onay Bekleniyor",
    color: "border-l-secondary border-dashed",
    badgeBg: "bg-secondary-container/20",
    badgeText: "text-on-secondary-container",
    accent: "bg-secondary",
  },
  IN_PROGRESS: {
    label: "Aktif İşlemde",
    color: "border-l-primary shadow-[0_4px_20px_rgba(55,85,195,0.15)]",
    badgeBg: "bg-primary/10",
    badgeText: "text-primary",
    accent: "bg-primary",
  },
  COMPLETED: {
    label: "Tamamlandı / Teslime Hazır",
    color: "border-l-tertiary",
    badgeBg: "bg-tertiary-fixed/30",
    badgeText: "text-on-tertiary-fixed-variant",
    accent: "bg-tertiary",
  },
};

function viewToggleClass(isActive: boolean) {
  return [
    "px-5 py-2.5 text-sm font-black rounded-lg shadow-sm transition-all border",
    isActive
      ? "bg-surface-container-lowest text-primary border-outline-variant/25"
      : "text-on-surface-variant bg-transparent border-transparent hover:text-on-surface hover:bg-surface-container-lowest/60",
  ].join(" ");
}

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

  const filteredOrders = orders.filter(o =>
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
      <section className={`${DASHBOARD_SURFACES.panel} flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4`}>
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/25 w-full md:w-auto">
           <button 
             onClick={() => setViewType("kanban")}
             className={viewToggleClass(viewType === "kanban")}
           >
             Kanban Board
           </button>
           <button 
             onClick={() => setViewType("list")}
             className={viewToggleClass(viewType === "list")}
           >
             Liste
           </button>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-72">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70" />
             <input 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className={`${DASHBOARD_FORMS.control} pl-9 pr-4 py-2.5 font-bold`}
               placeholder="Plaka veya Müşteri ara..." 
               type="text"
             />
           </div>
           
           <button 
             onClick={() => setIsModalOpen(true)}
             className={`${DASHBOARD_ACTIONS.primaryButton} text-[11px] uppercase tracking-widest whitespace-nowrap active:scale-95`}
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
                <div key={column.key} className={`${DASHBOARD_SURFACES.mutedPanel} p-3 flex flex-col gap-4 h-[calc(100vh-280px)]`}>
                  
                  {/* Column Header */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-2 cursor-grab active:cursor-grabbing">
                      <h3 className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest">{statusConfig.label}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-black ${statusConfig.badgeBg} ${statusConfig.badgeText}`}>
                        {column.items.length}
                      </span>
                    </div>
                    <div className={`h-1.5 w-full rounded-full ${statusConfig.accent}`}></div>
                  </div>
                  
                  {/* Cards Container */}
                  <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1 h-full pb-10">
                    {column.items.length === 0 ? (
                      <div className="h-28 border-2 border-dashed border-outline-variant/40 rounded-xl flex flex-col items-center justify-center text-on-surface-variant gap-1 opacity-70">
                         <span className="text-[10px] font-black uppercase tracking-widest">Boş</span>
                      </div>
                    ) : (
                      column.items.map((order: any) => (
                        <div 
                          key={order.id} 
                          className={`${DASHBOARD_SURFACES.card} p-5 group hover:shadow-xl hover:-translate-y-0.5 transition-all relative border-l-4
                            ${statusConfig.color}`}
                        >
                          <div className="flex justify-between items-start mb-4">
                             <span className={DASHBOARD_LIST.badge}>
                                {order.vehicle.plate}
                             </span>
                             <span className="text-on-surface-variant/70 text-[10px] uppercase font-bold tracking-tight">
                                {dayjs(order.createdAt).fromNow(true)}
                             </span>
                          </div>
                          
                          <h4 className="text-sm font-black text-on-surface mb-1.5 leading-tight capitalize">
                             {order.customerName}
                          </h4>
                          
                          <p className="text-xs text-on-surface-variant mb-6 line-clamp-2 leading-relaxed font-medium">
                             {order.complaintDescription}
                          </p>
                          
                          <div className="flex items-center justify-between pt-2">
                             <div className="flex items-center gap-2">
                               <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] ring-2 ring-surface-container-lowest shadow-sm border border-primary/15">
                                 {order.assignedMechanic ? order.assignedMechanic.firstName[0] : '?'}
                               </div>
                               {order.assignedMechanic ? (
                                 <span className="text-[10px] font-bold text-on-surface-variant">{order.assignedMechanic.firstName} {order.assignedMechanic.lastName}</span>
                               ) : (
                                 <span className="text-[9px] font-black text-on-secondary-container uppercase tracking-widest bg-secondary-container/20 px-2 py-1 rounded">Usta Yok</span>
                               )}
                             </div>
                             
                             <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link href={`/dashboard/services/${order.id}`}>
                                  <div className={`${DASHBOARD_ACTIONS.iconButtonPrimary} p-1.5 cursor-pointer`} title="Detay / Düzenle">
                                    <Edit className="w-3.5 h-3.5" />
                                  </div>
                                </Link>
                                
                                 <button
                                   onClick={() => { setSelectedOrder(order); setIsDeleteModalOpen(true); }}
                                  className={`${DASHBOARD_ACTIONS.iconButtonDanger} p-1.5`}
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
          <div className={`${DASHBOARD_LIST.shell} h-full`}>
            <div className="overflow-x-auto h-[calc(100vh-280px)] custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className={`${DASHBOARD_LIST.headRow} sticky top-0 z-10`}>
                  <tr>
                    <th className={DASHBOARD_LIST.headerCell}>Araç & Müşteri</th>
                    <th className={DASHBOARD_LIST.headerCell}>Kayıt Zamanı</th>
                    <th className={DASHBOARD_LIST.headerCell}>Durum</th>
                    <th className={DASHBOARD_LIST.headerCell}>Atanan Usta</th>
                    <th className={DASHBOARD_LIST.headerCell}>Şikayet/İşlem</th>
                    <th className={DASHBOARD_LIST.headerCellRight}>İşlem</th>
                  </tr>
                </thead>
                <tbody className={DASHBOARD_LIST.body}>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant font-medium">
                        Sonuç bulunamadı
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order: any) => {
                      const statusConfig = STATUS_MAP[order.status as keyof typeof STATUS_MAP] || STATUS_MAP.PENDING;
                      return (
                        <tr key={order.id} className={DASHBOARD_LIST.row}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span className={`${DASHBOARD_LIST.badge} w-fit`}>
                                {order.vehicle.plate}
                              </span>
                              <span className="text-sm font-bold text-on-surface capitalize">
                                {order.customerName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-bold text-on-surface">{dayjs(order.createdAt).format("DD MMM YYYY")}</span>
                              <span className="text-xs text-on-surface-variant/70">{dayjs(order.createdAt).fromNow()}</span>
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
                                  <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 flex items-center justify-center font-bold text-[9px] border border-blue-100">
                                    {order.assignedMechanic.firstName[0]}
                                  </div>
                                  <span className="text-xs font-bold text-on-surface-variant">{order.assignedMechanic.firstName} {order.assignedMechanic.lastName}</span>
                                </>
                              ) : (
                                <span className="text-[10px] font-bold text-on-surface-variant/70">Atanmadı</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-on-surface-variant line-clamp-2 max-w-xs" title={order.complaintDescription}>
                              {order.complaintDescription}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link href={`/dashboard/services/${order.id}`}>
                                <button className={`${DASHBOARD_ACTIONS.iconButtonPrimary} p-1.5`} title="Detay / Düzenle">
                                  <Edit className="w-4 h-4" />
                                </button>
                              </Link>
                              <button 
                                onClick={() => { setSelectedOrder(order); setIsDeleteModalOpen(true); }}
                                className={`${DASHBOARD_ACTIONS.iconButtonDanger} p-1.5`}
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

      {isModalOpen && (
        <ServiceOrderFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          customers={customers}
          vehicles={vehicles}
          mechanics={mechanics}
        />
      )}

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
