"use client";

import { useState } from "react";
import Link from "next/link";
import CustomerFormModal from "./CustomerFormModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { deleteCustomer } from "@/lib/actions/customer.actions";
import { History, Star, Edit, Trash2, UserPlus, Search } from "lucide-react";
import { getCustomerDisplayName, type CustomerListItem } from "./types";

export default function CustomerTableClient({ initialCustomers }: { initialCustomers: CustomerListItem[] }) {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerListItem | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerListItem | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");

  const handleCreate = () => {
    setSelectedCustomer(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (customer: CustomerListItem) => {
    setSelectedCustomer(customer);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (customer: CustomerListItem) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };
  
  const confirmDelete = async () => {
    if(!customerToDelete) return;
    setIsDeleting(true);
    await deleteCustomer(customerToDelete.id);
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setCustomerToDelete(null);
  };

  // Filter based on search
  const filteredCustomers = initialCustomers.filter(c => {
    const term = searchTerm.toLowerCase();
    const name = getCustomerDisplayName(c);
    const phone = c.phone ?? "";
    const plate = c.vehicles?.[0]?.plate || "";
    return name?.toLowerCase().includes(term) || phone.includes(term) || plate.toLowerCase().includes(term);
  });

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
      
      <div className="p-4 border-b border-slate-200 flex justify-between items-center gap-4 bg-slate-50/30">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
             <Search className="w-4 h-4" />
          </span>
          <input 
             className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600/20 w-72 text-sm font-medium outline-none text-slate-900 shadow-sm" 
             placeholder="Müşteri adı veya plaka ara..." 
             type="text"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={handleCreate}
          className="bg-orange-600 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all hover:bg-orange-700 active:scale-95 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Yeni Müşteri
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-200">
              <th className="px-6 py-4">Müşteri Profili</th>
              <th className="px-6 py-4">Araçlar</th>
              <th className="px-6 py-4">Puan / Tip</th>
              <th className="px-6 py-4">Bakiye</th>
              <th className="px-6 py-4 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCustomers.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-sm font-bold text-slate-400">Sistemde aramayla eşleşen müşteri yok.</td></tr>
            ) : (
              filteredCustomers.map((customer) => {
                const name = getCustomerDisplayName(customer);
                const initial = name?.charAt(0) || 'U';
                const vehicle = customer.vehicles?.[0];
                
                return (
                  <tr key={customer.id} className="hover:bg-slate-50:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg shadow-sm">
                          {initial}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-tight">{name}</div>
                          <div className="text-xs text-slate-500 font-medium">{customer.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {vehicle ? (
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-black border border-slate-200 uppercase tracking-widest">
                            {vehicle.plate}
                          </span>
                          <span className="text-xs font-bold text-slate-500">{vehicle.brand} {vehicle.model}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">Araç Kaydı Yok</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                          <span className="text-sm font-bold text-slate-900">Standart</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {customer.type === 'CORPORATE' ? 'KURUMSAL' : 'BİREYSEL'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {customer.balance > 0 ? (
                        <div>
                          <div className="text-sm font-black text-red-600">₺ {customer.balance.toLocaleString('tr-TR')}</div>
                          <div className="text-[10px] font-bold text-red-600/70 uppercase">Tahsil Edilecek</div>
                        </div>
                      ) : customer.balance < 0 ? (
                        <div>
                          <div className="text-sm font-black text-emerald-600">₺ {(Math.abs(customer.balance)).toLocaleString('tr-TR')}</div>
                          <div className="text-[10px] font-bold text-emerald-600/70 uppercase">Bakiyeli (Alacak)</div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm font-black text-slate-900">₺ 0</div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase">Temiz</div>
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/dashboard/customers/${customer.id}`} className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-600 hover:text-white transition-all border border-slate-200" title="Detay">
                          <History className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleEdit(customer)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white:bg-blue-600 transition-all border border-blue-100">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(customer)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white:bg-red-600 transition-all border border-red-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
            
          </tbody>
        </table>
      </div>
      
      <CustomerFormModal 
         isOpen={isFormModalOpen} 
         onClose={() => setIsFormModalOpen(false)} 
         customerData={selectedCustomer} 
      />
      
      <ConfirmDialog 
         isOpen={isDeleteModalOpen}
         onClose={() => setIsDeleteModalOpen(false)}
         onConfirm={confirmDelete}
         isLoading={isDeleting}
         title="Müşteriyi Sil"
         description={customerToDelete ? `${customerToDelete.firstName || customerToDelete.companyName} isimli müşteriyi silmek istediğinize emin misiniz? Arka planda korunacaktır ancak sistemden kaldırılacaktır.` : ""}
      />
    </div>
  );
}
