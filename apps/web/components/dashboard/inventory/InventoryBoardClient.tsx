"use client";

import { useState, useRef, useEffect } from "react";
import dayjs from "dayjs";
import 'dayjs/locale/tr';
import relativeTime from "dayjs/plugin/relativeTime";
import { 
  Search, 
  Download, 
  TrendingUp, 
  PackageSearch,
  AlertTriangle,
  Layers,
  Box,
  Tags,
  History,
  Tag,
  Building2,
  MoreVertical
} from "lucide-react";
import Link from "next/link";
import { CategoryDialog } from "@/app/(dashboard)/dashboard/inventory/CategoryDialog";
import { PartDialog } from "@/app/(dashboard)/dashboard/inventory/PartDialog";
import { PurchaseDialog } from "@/app/(dashboard)/dashboard/inventory/purchases/PurchaseDialog";
import StockAdjustDialog from "./StockAdjustDialog";
import BarcodeScannerDialog from "./BarcodeScannerDialog";
import { deletePart, sendLowStockAlert } from "@/lib/actions/inventory.actions";
import { Trash2, Edit, Target, Send, ScanBarcode } from "lucide-react";

// Not: Component dizinleri yerine app içinden geliyorsa import yollarını oraya çektim. 
// Gerekirse CategoryDialog ve PartDialog refactor edilecek.

dayjs.extend(relativeTime);
dayjs.locale('tr');

interface InventoryBoardProps {
  data: {
    metrics: {
      totalPartsTypes: number;
      totalItems: number;
      totalStockValue: number;
      lowStockCount: number;
    };
    lowStockItems: any[];
    allParts: any[];
    categories: any[];
    recentMovements: any[];
    suppliers: { id: string; name: string }[];
  }
}

export default function InventoryBoardClient({ data }: InventoryBoardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [adjustingPart, setAdjustingPart] = useState<any>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isAlertSending, setIsAlertSending] = useState(false);
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);

  const { metrics, lowStockItems, allParts, categories, recentMovements } = data;
  const suppliers = data.suppliers || [];

  // Use an effect to click outside dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSendLowStockAlert = async () => {
    setIsAlertSending(true);
    try {
      const res = await sendLowStockAlert();
      if (res.success) {
        alert(res.success);
      } else {
        alert(res.error || "Gönderim başarısız");
      }
    } catch (err) {
      alert("SMS gönderilirken hata oluştu");
    } finally {
      setIsAlertSending(false);
    }
  };

  // Arama filtresi
  const filteredParts = allParts.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.partNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);
  };

  const categoryOptions = categories?.map(c => ({ id: c.id, name: c.name })) || [];

  return (
    <div className="flex-1 space-y-8 min-h-screen pb-12">
      
      {/* Top action bar */}
      <div className="space-y-3 mb-8">
         {/* Row 1: Arama + Ana Aksiyonlar */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                 type="text" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 outline-none transition-all shadow-sm" 
                 placeholder="Ürün adı, barkod, kategori ara..." 
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
               <CategoryDialog categories={categoryOptions} />
               <PartDialog categories={categoryOptions} suppliers={suppliers} existingParts={allParts} />
               <PurchaseDialog />
               <button
                 onClick={() => setBarcodeScannerOpen(true)}
                 className="flex items-center gap-2 whitespace-nowrap bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-amber-600 transition-all">
                 <ScanBarcode className="w-4 h-4" /> Barkod Tara
               </button>
            </div>
         </div>

         {/* Row 2: İkincil Linkler */}
         <div className="flex flex-wrap items-center gap-2">
            <Link 
              href="/dashboard/inventory/purchases"
              className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all">
               <History className="w-3.5 h-3.5" /> Alım Geçmişi
            </Link>
            <Link 
              href="/dashboard/inventory/reports"
              className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all">
               <TrendingUp className="w-3.5 h-3.5" /> Raporlar
            </Link>
            {metrics.lowStockCount > 0 && (
              <button 
                onClick={handleSendLowStockAlert}
                disabled={isAlertSending}
                className="flex items-center gap-1.5 text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 transition-all disabled:opacity-50 ml-auto">
                 <Send className="w-3.5 h-3.5" /> 
                 {isAlertSending ? "Gönderiliyor..." : "Stok Uyarısı SMS"}
              </button>
            )}
         </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Total Stock Value */}
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden text-white">
          <div className="absolute right-0 bottom-0 opacity-10 blur-xl">
             <Layers className="w-48 h-48" />
          </div>
          <div className="z-10 relative">
             <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Toplam Stok (Depo) Değeri</span>
             <h3 className="text-4xl md:text-5xl font-black text-amber-500 mt-2 tracking-tighter drop-shadow-sm">
                {formatMoney(metrics.totalStockValue)}
             </h3>
             <p className={`text-xs font-medium flex items-center mt-3 text-slate-300`}>
               Depoda bulunan toplam {metrics.totalItems} adet malzemenin alış fiyatı maliyeti üzerinden hesaplanmıştır.
             </p>
          </div>
        </div>

        {/* Categories Analysis */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Stok Çeşitliliği</span>
            <div className="mt-3 flex items-end gap-3">
               <span className="text-3xl font-black text-slate-800">{metrics.totalPartsTypes}</span>
               <span className="text-sm font-bold text-slate-400 mb-1">Farklı Ürün</span>
            </div>
          </div>
          <div className="mt-6">
             <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
               <span>Kategori Sayısı</span>
               <span>{categories.length} Adet</span>
             </div>
             <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full w-full"></div>
             </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-between transition-colors ${
          metrics.lowStockCount > 0 
            ? 'bg-red-50 border-red-200' 
            : 'bg-emerald-50 border-emerald-200'
        }`}>
           <div>
              <div className="flex items-center justify-between">
                 <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Kritik Stok Uyarısı</span>
                 {metrics.lowStockCount > 0 ? (
                   <span className="flex h-3 w-3 relative">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                   </span>
                 ) : (
                   <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                 )}
              </div>
              <div className="mt-3 flex items-end gap-3">
                 <span className={`text-4xl font-black ${metrics.lowStockCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                   {metrics.lowStockCount}
                 </span>
                 <span className="text-sm font-bold text-slate-500 mb-1">Ürün</span>
              </div>
           </div>
           
           <button className={`mt-4 w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${
             metrics.lowStockCount > 0 
               ? 'bg-red-100 text-red-700 hover:bg-red-200' 
               : 'bg-emerald-100 text-emerald-700'
           }`}>
             Detayları Gör
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 content-start h-full pb-8">
        
        {/* Full Inventory List */}
        <div className="xl:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
           <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
                 <Box className="w-5 h-5 text-amber-500" />
                 Depo Envanteri
              </h4>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Ürün Bilgisi</th>
                    <th className="px-6 py-4">Kategori & Konum</th>
                    <th className="px-6 py-4">Stok Seviyesi</th>
                    <th className="px-6 py-4">Satış Fiyatı</th>
                    <th className="px-6 py-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <PackageSearch className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                        Arama kriterlerine uygun ürün bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredParts.map((p) => {
                      const isLowStock = p.currentStock <= p.minStockLevel;
                      const taxMultiplier = 1 + (p.taxRate / 100);
                      const finalPrice = p.sellingPrice * taxMultiplier;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 mb-0.5">{p.name}</div>
                            <div className="flex items-center gap-2">
                               <div className="text-[10px] font-black tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">
                                 {p.partNumber}
                               </div>
                               {p.brand && <span className="text-xs font-medium text-slate-400">{p.brand}</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs mb-1">
                              <Tags className="w-3.5 h-3.5 text-slate-400" />
                              {p.category?.name || 'Kategorisiz'}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              Raf: {p.location || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center justify-center font-black text-sm px-3 py-1 rounded-lg ${
                                isLowStock 
                                  ? 'bg-red-50 text-red-700 border border-red-200' 
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {p.currentStock} {p.unit}
                              </span>
                              {isLowStock && <AlertTriangle className="w-4 h-4 text-red-500" />}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-black text-slate-900">
                              {formatMoney(finalPrice)}
                            </div>
                            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                              + %{p.taxRate} KDV
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="relative inline-block text-left" ref={openDropdown === p.id ? dropdownRef : null}>
                              <button 
                                onClick={() => setOpenDropdown(openDropdown === p.id ? null : p.id)}
                                className="text-slate-400 hover:text-amber-600 p-2 transition-colors rounded-xl hover:bg-amber-50"
                              >
                                <MoreVertical className="w-5 h-5 ml-auto" />
                              </button>
                              
                              {openDropdown === p.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                                  <PartDialog categories={categoryOptions} suppliers={suppliers} existingParts={allParts} initialData={p} />
                                  <button 
                                    onClick={() => { setAdjustingPart(p); setOpenDropdown(null); }} 
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                                  >
                                    <Target className="w-4 h-4" /> Stok Sayımı / Düzelt
                                  </button>
                                  <button 
                                    onClick={async () => {
                                      if(confirm("Bu parçayı silmek istediğinize emin misiniz?")) {
                                        await deletePart(p.id);
                                        setOpenDropdown(null);
                                      }
                                    }} 
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 border-t border-slate-100"
                                  >
                                    <Trash2 className="w-4 h-4" /> Parçayı Sil
                                  </button>
                                </div>
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

        {/* Sidebar Panel -> Low Stock & Movements */}
        <div className="xl:col-span-4 space-y-6">
           
           {/* Low Stock Urgent Table */}
           <div className="bg-red-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <h4 className="text-sm font-black tracking-tight flex items-center gap-2">
                 <AlertTriangle className="w-5 h-5 text-red-200" />
                 Sipariş Verilmesi Gerekenler
              </h4>
              <p className="text-[10px] uppercase font-bold tracking-widest text-red-200 mt-1">Kritik Stok Seviyesi Altındakiler</p>
              
              <div className="mt-6 space-y-3 relative z-10">
                 {lowStockItems.length === 0 ? (
                    <div className="bg-white/10 p-4 rounded-xl text-xs font-bold text-center border border-white/10">
                       Kritik stokta ürün bulunmuyor.
                    </div>
                 ) : (
                    lowStockItems.slice(0, 4).map((item: any, idx) => (
                      <div key={idx} className="bg-white/10 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                         <div>
                            <p className="text-xs font-bold leading-tight line-clamp-1">{item.name}</p>
                            <p className="text-[9px] text-red-200 mt-0.5 tracking-widest uppercase">MİN: {item.minStockLevel} {item.unit} / VAR: {item.currentStock}</p>
                         </div>
                         <button className="bg-white text-red-700 hover:bg-red-50 text-[10px] font-black px-3 py-1.5 rounded-lg transition-colors">
                            SİPARİŞ
                         </button>
                      </div>
                    ))
                 )}
              </div>
           </div>

           {/* Recent Stock Movements */}
           <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
             <h5 className="text-xs font-black mb-6 uppercase tracking-widest text-slate-600 flex items-center gap-2">
                <History className="w-4 h-4" /> 
                Son Stok Hareketleri
             </h5>
             
             <div className="space-y-4">
               {recentMovements.length === 0 ? (
                 <p className="text-xs font-bold text-slate-400">Son zamanlarda stok hareketi kaydedilmemiş.</p>
               ) : (
                 recentMovements.map((mov: any, idx: number) => {
                   let movTypeStyle = "bg-slate-100 text-slate-600";
                   let sign = "";
                   let label = "DÜZELTME";

                   if(mov.type === "IN") {
                     movTypeStyle = "bg-emerald-100 text-emerald-700";
                     sign = "+";
                     label = "GİRİŞ";
                   } else if(mov.type === "OUT") {
                     movTypeStyle = "bg-red-100 text-red-700";
                     sign = "-";
                     label = "ÇIKIŞ";
                   }

                   return (
                     <div key={idx} className="flex items-start gap-4 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                       <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${movTypeStyle}`}>
                         {sign}{mov.quantity}
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="text-sm font-bold text-slate-900 truncate">{mov.partName}</p>
                         <p className="text-[10px] text-slate-500 mt-0.5">{mov.reason || 'Neden belirtilmemiş'} • {dayjs(mov.date).fromNow()}</p>
                       </div>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-1 bg-slate-50 rounded">
                         {label}
                       </span>
                     </div>
                   );
                 })
               )}
             </div>
             
             <button className="w-full mt-6 py-2.5 bg-slate-50 text-slate-600 text-xs font-black rounded-xl hover:bg-slate-100:bg-slate-700 transition-colors uppercase tracking-widest">
               Tüm Hareketleri Gör
             </button>
           </div>

        </div>
      </div>

      {adjustingPart && (
        <StockAdjustDialog 
          part={adjustingPart} 
          onClose={() => setAdjustingPart(null)} 
          onSuccess={() => setAdjustingPart(null)} 
        />
      )}

      <BarcodeScannerDialog
        open={barcodeScannerOpen}
        onClose={() => setBarcodeScannerOpen(false)}
        onSuccess={() => setBarcodeScannerOpen(false)}
      />
    </div>
  );
}
