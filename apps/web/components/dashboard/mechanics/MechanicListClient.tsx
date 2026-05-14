"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { deleteMechanic } from "@/lib/actions/mechanic.actions";
import { Calendar, MoreVertical, Edit, Trash2 } from "lucide-react";

const MechanicFormModal = dynamic(() => import("./MechanicFormModal"), {
  ssr: false,
  loading: () => null,
});

export default function MechanicListClient({ initialMechanics }: { initialMechanics: any[] }) {
  const [mechanics, setMechanics] = useState(initialMechanics);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleEdit = (mechanic: any) => {
    setSelectedMechanic(mechanic);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (mechanic: any) => {
    setSelectedMechanic(mechanic);
    setIsDeleteModalOpen(true);
  };
  
  const confirmDelete = async () => {
    if(!selectedMechanic) return;
    setIsDeleting(true);
    await deleteMechanic(selectedMechanic.id);
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setSelectedMechanic(null);
  };

  // Mock helpers for visual styling
  const calcWorkload = (count: number) => Math.min(Math.round((count / 4) * 100), 100);
  const calcEfficiency = (years: number) => Math.min((years || 1) * 5 + 75 + Math.random() * 5, 99).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          <button className="px-4 py-2 text-xs font-bold bg-white dark:bg-gray-800 text-slate-600 rounded-lg hover:bg-slate-50:bg-slate-800 transition-colors border border-slate-200 shadow-sm">
            Uzmanlık Filtresi
          </button>
          <button className="px-4 py-2 text-xs font-bold bg-white dark:bg-gray-800 text-slate-600 rounded-lg hover:bg-slate-50:bg-slate-800 transition-colors border border-slate-200 shadow-sm">
            Verimliliğe Göre
          </button>
        </div>
        <button 
          onClick={() => setIsFormModalOpen(true)}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
        >
          + Yeni Personel
        </button>
      </div>

      <div className="space-y-4">
        {initialMechanics.length === 0 ? (
          <div className="bg-slate-50 dark:bg-gray-800/50 text-slate-500 p-8 rounded-2xl text-center text-sm font-bold border border-slate-200 border-dashed">
            Henüz sisteme personel eklenmemiş. Lütfen sağ üstten personel ekleyin.
          </div>
        ) : initialMechanics.map((mechanic: any) => {
          
          const openJobsCount = mechanic._count?.serviceOrders || 0;
          const workloadPercent = calcWorkload(openJobsCount);
          const efficiency = calcEfficiency(mechanic.experienceYears);
          const isHighWorkload = workloadPercent > 80;

          return (
            <div key={mechanic.id} className="group bg-white dark:bg-gray-800 hover:bg-slate-50:bg-slate-800/80 p-5 rounded-3xl transition-all duration-300 flex items-center gap-6 shadow-sm border border-slate-200 relative overflow-hidden">
              
              {mechanic.isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-green-500 rounded-r-full"></div>
              )}
              
              <div className="relative pl-3">
                <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xl font-black uppercase ring-4 ring-white shadow-sm transition-transform group-hover:scale-105">
                  {mechanic.firstName[0]}{mechanic.lastName[0]}
                </div>
                {!mechanic.isActive && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-red-400 border-2 border-white rounded-full" title="Pasif/Kapalı"></div>
                )}
              </div>
              
              <div className="flex-1">
                <h4 className="font-black text-slate-900 dark:text-white text-base leading-tight">
                  {mechanic.firstName} {mechanic.lastName}
                </h4>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-1">
                  {mechanic.specialties?.length > 0 ? mechanic.specialties.join(", ") : "Genel Personel"}
                </p>
              </div>
              
              <div className="hidden md:block px-6 w-48">
                <div className="flex justify-between items-end mb-1.5">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Anlık İş Yükü</p>
                  <span className={`text-[10px] font-black ${isHighWorkload ? 'text-red-500' : 'text-blue-600'}`}>{workloadPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                     className={`h-full ${isHighWorkload ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                     style={{ width: `${workloadPercent}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="hidden sm:block text-right px-6 border-l border-slate-100 dark:border-gray-700">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Günlük Verim</p>
                <p className="text-[15px] font-black text-emerald-600 border border-emerald-100 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 rounded-lg inline-block">
                  {efficiency}%
                </p>
              </div>
              
              <div className="flex gap-2">
                 <Link href={`/dashboard/mechanics/${mechanic.id}`} className="p-2.5 bg-slate-50 dark:bg-gray-800/50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Detay">
                   <Calendar className="w-4 h-4" />
                 </Link>
                 
                 {/* Interactions Group */}
                 <div className="flex gap-1 bg-slate-50 dark:bg-gray-800/50 p-1 rounded-xl">
                   <button onClick={() => handleEdit(mechanic)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white dark:bg-gray-800:bg-slate-700 rounded-lg transition-colors">
                     <Edit className="w-4 h-4" />
                   </button>
                   <button onClick={() => handleDeleteClick(mechanic)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white dark:bg-gray-800:bg-slate-700 rounded-lg transition-colors">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
              </div>
            </div>
          )
        })}
      </div>

      {isFormModalOpen && (
        <MechanicFormModal
           isOpen={isFormModalOpen}
           onClose={() => setIsFormModalOpen(false)}
           mechanicData={selectedMechanic}
        />
      )}

      <ConfirmDialog 
         isOpen={isDeleteModalOpen}
         onClose={() => setIsDeleteModalOpen(false)}
         onConfirm={confirmDelete}
         isLoading={isDeleting}
         title="Personeli Sistemden Çıkar"
         description={selectedMechanic ? `${selectedMechanic.firstName} ${selectedMechanic.lastName} isimli ustayı kadrodan çıkarmak/silmek istediğinize emin misiniz?` : ""}
      />
    </div>
  );
}
