"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import dayjs from "dayjs";
import 'dayjs/locale/tr';
import relativeTime from "dayjs/plugin/relativeTime";
import { 
  Search, 
  Download, 
  TrendingUp, 
  Receipt,
  CreditCard,
  AlertTriangle,
  Hourglass,
  Network
} from "lucide-react";

dayjs.extend(relativeTime);
dayjs.locale('tr');

const PaymentFormModal = dynamic(() => import("./PaymentFormModal"), {
  ssr: false,
  loading: () => null,
});
const InvoiceFormModal = dynamic(() => import("./InvoiceFormModal"), {
  ssr: false,
  loading: () => null,
});

interface FinanceBoardProps {
  metrics: {
    unpaidInvoices: any[];
    cashMetrics: {
      dailyCashIn: number;
      dailyTrend: number;
      netCash: number;
      totalInflow: number;
      totalOutflow: number;
    };
    receivables: {
      aging_0_30: number;
      aging_31_60: number;
      aging_60_plus: number;
    };
    upcomingExpenses: any[];
  };
  customers: any[];
}

export default function FinanceBoardClient({ metrics, customers }: FinanceBoardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<any>(null);

  const { cashMetrics, receivables, unpaidInvoices, upcomingExpenses } = metrics;
  
  // Arama filtresi
  const filteredInvoices = unpaidInvoices.filter(inv => 
    inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Formatting utils
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
  };
  
  // Total receivables for progress bar calculation
  const totalReceivables = receivables.aging_0_30 + receivables.aging_31_60 + receivables.aging_60_plus || 1; // avoid division by zero
  const pct30 = (receivables.aging_0_30 / totalReceivables) * 100;
  const pct60 = (receivables.aging_31_60 / totalReceivables) * 100;
  const pct90 = (receivables.aging_60_plus / totalReceivables) * 100;

  return (
    <div className="flex-1 space-y-8 min-h-screen pb-12">
      
      {/* Top action bar is assumed to be handled by layout/sidebar or internal to the page */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
         <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input 
                 type="text" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-gray-700 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none" 
                 placeholder="Fatura No, Müşteri ara..." 
              />
            </div>
         </div>
         <div className="flex items-center gap-3">
            <Link href="/dashboard/finances/invoices" className="flex items-center gap-2 bg-white dark:bg-gray-800 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
               <Receipt className="w-4 h-4" /> Tüm Faturalar
            </Link>
            <Link href="/dashboard/finances/payments" className="flex items-center gap-2 bg-white dark:bg-gray-800 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
               <CreditCard className="w-4 h-4" /> Ödemeler
            </Link>
            <Link href="/dashboard/finances/reports" className="flex items-center gap-2 bg-white dark:bg-gray-800 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
               <TrendingUp className="w-4 h-4" /> Aylık Rapor
            </Link>
            <button className="flex items-center gap-2 bg-white dark:bg-gray-800 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
               <Download className="w-4 h-4" /> Excel&apos;e Aktar
            </button>
            <button 
               onClick={() => setIsInvoiceModalOpen(true)}
               className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
               + Yeni Fatura
            </button>
         </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Daily Cash Flow */}
        <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between overflow-hidden relative group">
          <div className="z-10 relative">
             <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">Günlük Nakit Girişi (Tahsilat)</span>
             <h3 className="text-4xl md:text-5xl font-black text-blue-700 dark:text-blue-400 mt-2 tracking-tighter">
                {formatMoney(cashMetrics.dailyCashIn)}
             </h3>
             <p className={`text-xs font-bold flex items-center mt-2 ${cashMetrics.dailyTrend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
               <TrendingUp className="w-4 h-4 mr-1" />
               {cashMetrics.dailyTrend >= 0 ? '+' : ''}{cashMetrics.dailyTrend}% dünkünden farklı
             </p>
          </div>
          {/* Decorative bars */}
          <div className="mt-8 h-20 flex items-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
            <div className="flex-1 bg-blue-100 h-[40%] rounded-t-md"></div>
            <div className="flex-1 bg-blue-100 h-[60%] rounded-t-md"></div>
            <div className="flex-1 bg-blue-100 h-[55%] rounded-t-md"></div>
            <div className="flex-1 bg-blue-100 h-[80%] rounded-t-md"></div>
            <div className="flex-1 bg-blue-600 h-[95%] rounded-t-md shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
          </div>
        </div>

        {/* Receivables Aging */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">Tahsilat Yaşlandırma</span>
          <div className="mt-6 space-y-4">
             <div>
                <div className="flex justify-between items-center mb-1.5">
                   <span className="text-xs font-bold">0-30 Gün</span>
                   <span className="text-xs font-black">{formatMoney(receivables.aging_0_30)}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-blue-600 h-full rounded-full" style={{ width: `${pct30}%` }}></div>
                </div>
             </div>
             <div>
                <div className="flex justify-between items-center mb-1.5">
                   <span className="text-xs font-bold">31-60 Gün (Gecikmeli)</span>
                   <span className="text-xs font-black text-orange-600">{formatMoney(receivables.aging_31_60)}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-orange-500 h-full rounded-full" style={{ width: `${pct60}%` }}></div>
                </div>
             </div>
             <div>
                <div className="flex justify-between items-center mb-1.5">
                   <span className="text-xs font-black text-red-600">60+ Gün (Kritik)</span>
                   <span className="text-xs font-black text-red-600">{formatMoney(receivables.aging_60_plus)}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-red-600 h-full rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)]" style={{ width: `${pct90}%` }}></div>
                </div>
             </div>
          </div>
        </div>

        {/* Integration Status Demo */}
        <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
           <div className="absolute -right-4 -bottom-4 opacity-10">
              <Network className="w-32 h-32" />
           </div>
           <div className="relative z-10">
              <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">Entegrasyon Durumu</span>
              <div className="mt-5 space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 bx-shadow-glow"></span>
                       <span className="text-xs font-bold">E-Fatura (GİB)</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Aktif</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 bx-shadow-glow"></span>
                       <span className="text-xs font-bold">Akbank Açık Bankacılık</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Aktif</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                       <span className="text-xs font-bold text-slate-300 dark:text-slate-600">Garanti (Hesap Hareketleri)</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Senkronize Ediliyor...</span>
                 </div>
              </div>
           </div>
           <button className="mt-4 text-[9px] font-black underline text-slate-400 dark:text-slate-500 hover:text-white uppercase tracking-widest text-left relative z-10">APİ BAĞLANTISI EKLE</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 content-start h-full pb-8">
        
        {/* Unpaid Invoices / Tahsilat Bekleyen Faturalar */}
        <div className="xl:col-span-8 space-y-6">
           <div className="flex items-center justify-between">
              <h4 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Tahsilat Bekleyen Faturalar</h4>
           </div>

           <div className="space-y-4">
             {filteredInvoices.length === 0 ? (
               <div className="p-10 border border-dashed border-slate-300 dark:border-gray-600 rounded-2xl flex flex-col items-center justify-center text-center">
                 <Receipt className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                 <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Tahsilat bekleyen faturanız bulunmuyor.</p>
               </div>
             ) : (
               filteredInvoices.map((inv: any) => {
                 const remainingInfo = Number(inv.totalAmount) - Number(inv.paidAmount);
                 const pastDue = dayjs().isAfter(dayjs(inv.dueDate));
                 const isCritial = pastDue && dayjs().diff(dayjs(inv.dueDate), 'day') > 15;

                 let Icon = Receipt;
                 let iconColor = "text-blue-600";
                 let bgClass = "bg-blue-50";
                 let statusBadge = "Beklemede";
                 let statusColor = "text-slate-400";

                 if(isCritial) {
                   Icon = AlertTriangle; iconColor = "text-red-600"; bgClass = "bg-red-50";
                   statusBadge = "Kritik Gecikme"; statusColor = "text-red-500";
                 } else if (pastDue) {
                   Icon = Hourglass; iconColor = "text-orange-600"; bgClass = "bg-orange-50";
                   statusBadge = "Vadesi Geçti"; statusColor = "text-orange-500";
                 } else if (Number(inv.paidAmount) > 0) {
                   // Kısmi ödeme yapılmışsa
                   statusBadge = "Kısmi Tahsilat"; statusColor = "text-emerald-500";
                 }

                 return (
                   <div key={inv.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow border border-slate-100">
                     <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgClass} ${iconColor}`}>
                         <Icon className="w-6 h-6" />
                       </div>
                       <div>
                         <Link href={`/dashboard/finances/invoices/${inv.id}`} className="text-sm font-black text-slate-900 dark:text-white hover:text-primary hover:underline">
                           {inv.invoiceNumber}
                         </Link>
                         <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                           {inv.customerName} • {inv.dueDate ? `Vade: ${dayjs(inv.dueDate).format("DD MMM YYYY")}` : `Oluşturulma: ${dayjs(inv.issueDate).format("DD MMM")}`}
                         </p>
                       </div>
                     </div>
                     <div className="flex items-center gap-6 sm:gap-10 w-full sm:w-auto justify-between sm:justify-end">
                       <div className="text-right">
                         <span className="text-lg font-black block text-slate-900 dark:text-white">{formatMoney(remainingInfo)}</span>
                         <span className={`text-[9px] uppercase font-black tracking-widest ${statusColor}`}>{statusBadge}</span>
                       </div>
                       <button 
                         onClick={() => setPaymentInvoice(inv)}
                         className="bg-slate-100 dark:bg-gray-700 text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200:border-emerald-800 border-2 border-transparent border-dashed px-4 py-2 rounded-xl text-[11px] font-black tracking-widest flex items-center gap-2 transition-all">
                         TAHSİL ET
                       </button>
                     </div>
                   </div>
                 );
               })
             )}
           </div>
        </div>

        {/* Sidebar Panel -> Cash Master */}
        <div className="xl:col-span-4 space-y-6">
           
           {/* Vault Total Card */}
           <div className="bg-blue-700 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden bx-shadow-glow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white dark:bg-gray-800/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <h4 className="text-lg font-black tracking-tight">Kasa Geneli / Net Değer</h4>
              <p className="text-[10px] uppercase font-bold tracking-widest text-blue-200 mt-1 opacity-80">Toplam Harcanabilir Limit</p>
              
              <div className="mt-8">
                 <span className="text-4xl font-black">{formatMoney(cashMetrics.netCash)}</span>
              </div>
              
              <div className="mt-10 grid grid-cols-2 gap-4">
                 <div className="bg-white dark:bg-gray-800/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                   <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Toplam Gelir</span>
                   <p className="text-sm font-black mt-1 text-emerald-300">{formatMoney(cashMetrics.totalInflow)}</p>
                 </div>
                 <div className="bg-white dark:bg-gray-800/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                   <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Toplam Gider</span>
                   <p className="text-sm font-black mt-1 text-red-300 line-through decoration-red-500/50">{formatMoney(cashMetrics.totalOutflow)}</p>
                 </div>
              </div>
           </div>

           {/* Upcoming Expenses */}
           <div className="bg-white dark:bg-gray-800 border border-slate-100 p-6 rounded-3xl shadow-sm">
             <h5 className="text-sm font-black mb-6 uppercase tracking-widest text-slate-600 dark:text-slate-400">Yaklaşan Gider/Ödemeler</h5>
             <div className="space-y-4">
               {upcomingExpenses.length === 0 ? (
                 <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Yaklaşan ödeme kaydı bulunmuyor.</p>
               ) : (
                 upcomingExpenses.map((expense: any, idx: number) => {
                   const remaining = expense.amount - (expense.paidAmount || 0);
                   return (
                   <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                     <div className="flex items-center gap-3 flex-1">
                       <div className="w-1.5 h-10 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)] shrink-0"></div>
                       <div>
                         <p className="text-sm font-bold text-slate-900 dark:text-white capitalize line-clamp-1">{expense.title}</p>
                         <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">Vade: {expense.dueDate ? dayjs(expense.dueDate).format("DD MMM YYYY") : 'Belirsiz'}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-4 justify-between sm:justify-end w-full sm:w-auto">
                       <span className="text-sm font-black text-slate-900 bg-slate-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
                         {formatMoney(remaining)}
                       </span>
                       <button
                         onClick={() => setPaymentInvoice({ id: expense.id, type: "OUTGOING", totalAmount: expense.amount, paidAmount: expense.paidAmount, supplierId: expense.supplierId, invoiceNumber: expense.title })}
                         className="bg-slate-100 dark:bg-gray-700 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border-2 border-transparent border-dashed px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all shrink-0">
                         ÖDEME YAP
                       </button>
                     </div>
                   </div>
                 )})
               )}
             </div>
             <button 
               onClick={() => setPaymentInvoice({ id: undefined, type: "OUTGOING", totalAmount: 0, paidAmount: 0 })}
               className="w-full mt-8 py-3 bg-red-50 dark:bg-red-900/30 text-red-600 text-xs font-black rounded-xl hover:bg-red-100 hover:text-red-700 transition-colors uppercase tracking-widest">
               Manuel Gider Özeti / Ödeme Ekle
             </button>
           </div>

        </div>
      </div>

      {paymentInvoice && (
        <PaymentFormModal
          isOpen={!!paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          invoice={paymentInvoice.id ? paymentInvoice : null}
          customers={customers}
        />
      )}
      {isInvoiceModalOpen && (
        <InvoiceFormModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          customers={customers}
        />
      )}
    </div>
  );
}
