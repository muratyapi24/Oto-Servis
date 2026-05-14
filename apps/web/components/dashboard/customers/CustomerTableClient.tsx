"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { deleteCustomer } from "@/lib/actions/customer.actions";
import { History, Star, Edit, Trash2, UserPlus, Search } from "lucide-react";
import { getCustomerDisplayName, type CustomerListItem } from "./types";
import {
  DASHBOARD_ACTIONS,
  DASHBOARD_FORMS,
  DASHBOARD_LIST,
} from "@/lib/dashboard-ui-standards";

const CustomerFormModal = dynamic(() => import("./CustomerFormModal"), {
  ssr: false,
  loading: () => null,
});

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
    <div className={DASHBOARD_LIST.shell}>
      
      <div className={DASHBOARD_LIST.toolbar}>
        <div className={DASHBOARD_LIST.searchWrapper}>
          <span className={DASHBOARD_LIST.searchIcon}>
             <Search className="w-4 h-4" />
          </span>
          <input 
             className={`${DASHBOARD_FORMS.control} ${DASHBOARD_LIST.searchInput}`}
             placeholder="Müşteri adı veya plaka ara..." 
             type="text"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={handleCreate}
          className={`${DASHBOARD_ACTIONS.primaryButton} active:scale-95`}
        >
          <UserPlus className={DASHBOARD_ACTIONS.icon} />
          Yeni Müşteri
        </button>
      </div>
      
      <div className={DASHBOARD_LIST.tableScroll}>
        <table className={DASHBOARD_LIST.table}>
          <thead>
            <tr className={DASHBOARD_LIST.headRow}>
              <th className={DASHBOARD_LIST.headerCell}>Müşteri Profili</th>
              <th className={DASHBOARD_LIST.headerCell}>Araçlar</th>
              <th className={DASHBOARD_LIST.headerCell}>Puan / Tip</th>
              <th className={DASHBOARD_LIST.headerCell}>Bakiye</th>
              <th className={DASHBOARD_LIST.headerCellRight}>İşlemler</th>
            </tr>
          </thead>
          <tbody className={DASHBOARD_LIST.body}>
            {filteredCustomers.length === 0 ? (
              <tr><td colSpan={5} className={DASHBOARD_LIST.empty}>Sistemde aramayla eşleşen müşteri yok.</td></tr>
            ) : (
              filteredCustomers.map((customer) => {
                const name = getCustomerDisplayName(customer);
                const initial = name?.charAt(0) || 'U';
                const vehicle = customer.vehicles?.[0];
                
                return (
                  <tr key={customer.id} className={DASHBOARD_LIST.row}>
                    <td className={DASHBOARD_LIST.cell}>
                      <div className="flex items-center gap-4">
                        <div className={DASHBOARD_LIST.avatar}>
                          {initial}
                        </div>
                        <div>
                          <div className={DASHBOARD_LIST.primaryText}>{name}</div>
                          <div className={DASHBOARD_LIST.secondaryText}>{customer.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className={DASHBOARD_LIST.cell}>
                      {vehicle ? (
                        <div className="flex flex-col gap-1 items-start">
                          <span className={DASHBOARD_LIST.badge}>
                            {vehicle.plate}
                          </span>
                          <span className={`${DASHBOARD_LIST.secondaryText} font-bold`}>{vehicle.brand} {vehicle.model}</span>
                        </div>
                      ) : (
                        <span className={DASHBOARD_LIST.mutedText}>Araç Kaydı Yok</span>
                      )}
                    </td>
                    
                    <td className={DASHBOARD_LIST.cell}>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <Star className={DASHBOARD_LIST.scoreIcon} />
                          <span className="text-sm font-bold text-on-surface">Standart</span>
                        </div>
                        <span className={DASHBOARD_LIST.typeLabel}>
                          {customer.type === 'CORPORATE' ? 'KURUMSAL' : 'BİREYSEL'}
                        </span>
                      </div>
                    </td>
                    <td className={DASHBOARD_LIST.cell}>
                      {customer.balance > 0 ? (
                        <div>
                          <div className={DASHBOARD_LIST.balanceDueValue}>₺ {customer.balance.toLocaleString('tr-TR')}</div>
                          <div className={DASHBOARD_LIST.balanceDueLabel}>Tahsil Edilecek</div>
                        </div>
                      ) : customer.balance < 0 ? (
                        <div>
                          <div className={DASHBOARD_LIST.balanceCreditValue}>₺ {(Math.abs(customer.balance)).toLocaleString('tr-TR')}</div>
                          <div className={DASHBOARD_LIST.balanceCreditLabel}>Bakiyeli (Alacak)</div>
                        </div>
                      ) : (
                        <div>
                          <div className={DASHBOARD_LIST.balanceNeutralValue}>₺ 0</div>
                          <div className={DASHBOARD_LIST.balanceNeutralLabel}>Temiz</div>
                        </div>
                      )}
                    </td>
                    
                    <td className={DASHBOARD_LIST.cellRight}>
                      <div className={DASHBOARD_LIST.actionGroup}>
                        <Link href={`/dashboard/customers/${customer.id}`} className={DASHBOARD_ACTIONS.iconButton} title="Detay">
                          <History className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleEdit(customer)} className={DASHBOARD_ACTIONS.iconButtonPrimary}>
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(customer)} className={DASHBOARD_ACTIONS.iconButtonDanger}>
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
      
      {isFormModalOpen && (
        <CustomerFormModal
           isOpen={isFormModalOpen}
           onClose={() => setIsFormModalOpen(false)}
           customerData={selectedCustomer}
        />
      )}
      
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
