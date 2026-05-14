"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { deleteVehicle } from "@/lib/actions/vehicle.actions";
import { ServiceOrderDialog } from "@/app/(dashboard)/dashboard/services/ServiceOrderDialog";
import { Car, Clock, Wrench, Edit, Trash2 } from "lucide-react";

const VehicleFormModal = dynamic(() => import("./VehicleFormModal"), {
  ssr: false,
  loading: () => null,
});

interface VehicleListProps {
  vehicles: any[];
  customers: any[];
  mechanics: any[];
}

export default function VehicleListClient({ vehicles, customers, mechanics }: VehicleListProps) {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Arama metni örneği
  const [searchTerm, setSearchTerm] = useState("");

  const handleEdit = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setIsFormModalOpen(true);
  };

  const handleNewVehicle = () => {
    setSelectedVehicle(null);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setIsDeleteModalOpen(true);
  };
  
  const confirmDelete = async () => {
    if(!selectedVehicle) return;
    setIsDeleting(true);
    await deleteVehicle(selectedVehicle.id);
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setSelectedVehicle(null);
  };

  // Basit filtre
  const filteredVehicles = vehicles?.filter(v => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">Araç Garajı</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
            Müşterilerinize ait kayıtlı tüm araçlar ve servis verileri.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
           <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Plaka veya Araç Ara..."
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold shadow-sm"
           />
           <button 
             onClick={handleNewVehicle}
             className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-blue-700 active:scale-95 shadow-[0_4px_15px_rgba(37,99,235,0.3)] text-sm"
           >
             + Yeni Araç
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!filteredVehicles || filteredVehicles.length === 0 ? (
          <div className="col-span-full py-16 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-slate-300 text-center text-slate-500 shadow-sm flex flex-col items-center">
            <Car className="w-16 h-16 text-slate-200 mb-4" />
            <p className="font-bold">Aramanıza uygun araç bulunamadı.</p>
            <p className="text-xs mt-1">Sisteme yeni bir araç kaydedin.</p>
          </div>
        ) : (
          filteredVehicles.map((v) => (
            <div key={v.id} className="bg-white dark:bg-gray-800 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all p-6 flex flex-col group relative">
              
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(v)} className="p-2 bg-slate-50 dark:bg-gray-800/50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteClick(v)} className="p-2 bg-slate-50 dark:bg-gray-800/50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-between items-start mb-5">
                <div>
                  <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-black tracking-widest border border-blue-100 mb-2">
                    {v.plate}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white capitalize">
                    {v.brand} <span className="text-slate-500 dark:text-slate-400 font-bold">{v.model}</span>
                  </h3>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">
                    Sahibi: {v.customer?.type === 'INDIVIDUAL' ? `${v.customer.firstName} ${v.customer.lastName}` : v.customer?.companyName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-6 bg-slate-50 dark:bg-gray-800/50 rounded-xl p-3 border border-slate-100">
                <div className="flex justify-between border-b border-slate-200 dark:border-gray-700 pb-1">
                  <span className="font-bold text-slate-400 dark:text-slate-500">Yıl</span> <span className="font-black text-slate-700 dark:text-gray-300">{v.year || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-gray-700 pb-1">
                  <span className="font-bold text-slate-400 dark:text-slate-500">Km</span> <span className="font-black text-slate-700 dark:text-gray-300">{v.mileage ? `${v.mileage.toLocaleString('tr-TR')} km` : '-'}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="font-bold text-slate-400 dark:text-slate-500">Yakıt</span> <span className="font-black text-slate-700 dark:text-gray-300 capitalize">{v.fuelType?.toLowerCase() || '-'}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="font-bold text-slate-400 dark:text-slate-500">Vites</span> <span className="font-black text-slate-700 dark:text-gray-300 capitalize">{v.transmission?.toLowerCase() || '-'}</span>
                </div>
              </div>

              <div className="mt-auto flex gap-2">
                <Link
                  href={`/dashboard/vehicles/${v.id}`}
                  className="flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 text-blue-600 p-2.5 rounded-xl text-xs font-black transition-all border border-blue-100"
                  title="Detay"
                >
                  <Car className="w-4 h-4" />
                </Link>
                {/* Legacy component trigger */}
                <ServiceOrderDialog 
                  customers={customers}
                  vehicles={vehicles.map(vx => ({ id: vx.id, plate: vx.plate, customerId: vx.customerId }))}
                  mechanics={mechanics}
                  defaultCustomerId={v.customerId}
                  defaultVehicleId={v.id}
                  trigger={
                    <button className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100:bg-emerald-900/40 text-emerald-600 py-2.5 rounded-xl text-xs font-black transition-all border border-emerald-100 uppercase tracking-widest">
                      <Wrench className="w-4 h-4" /> Servis Aç
                    </button>
                  }
                />
                
                <Link 
                  href={`/dashboard/services?plate=${v.plate}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200:bg-slate-700 text-slate-600 py-2.5 rounded-xl text-xs font-black transition-colors border border-slate-200 uppercase tracking-widest"
                >
                  <Clock className="w-4 h-4" /> Geçmiş
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {isFormModalOpen && (
        <VehicleFormModal
           isOpen={isFormModalOpen}
           onClose={() => setIsFormModalOpen(false)}
           vehicleData={selectedVehicle}
           customers={customers}
        />
      )}

      <ConfirmDialog 
         isOpen={isDeleteModalOpen}
         onClose={() => setIsDeleteModalOpen(false)}
         onConfirm={confirmDelete}
         isLoading={isDeleting}
         title="Aracı Sil"
         description={selectedVehicle ? `${selectedVehicle.plate} plakalı aracı ve tüm veri bağlarını kalıcı olarak silmek istediğinize emin misiniz?` : ""}
      />
    </>
  );
}
