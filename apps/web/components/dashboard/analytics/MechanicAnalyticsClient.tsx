"use client";

import { useState } from "react";
import { Wrench, CheckCircle2, Clock, MapPin, Search, Calculator, TrendingUp, TrendingDown } from "lucide-react";
import { calculateCommission } from "@/lib/actions/mechanic.actions";

interface PerformanceData {
  completedCount?: any;
  totalLaborAmount?: any;
  avgDurationHours?: any;
  period?: string;
  error?: string;
  [key: string]: any;
}

interface Mechanic {
  id: string;
  firstName: string;
  lastName: string;
  specialties: string[];
  performanceCurrent: PerformanceData | null;
  performancePrevious: PerformanceData | null;
}

export default function MechanicAnalyticsClient({ mechanics, rules }: { mechanics: Mechanic[]; rules: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [commissionData, setCommissionData] = useState<{ [key: string]: any }>({});
  const [calculatingId, setCalculatingId] = useState<string | null>(null);

  const filteredMechanics = mechanics.filter(m => 
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const handleCalcCommission = async (mechanicId: string) => {
    setCalculatingId(mechanicId);
    try {
      const result = await calculateCommission(mechanicId, new Date());
      if (result && !result.error) {
        setCommissionData(prev => ({ ...prev, [mechanicId]: result }));
      } else {
        alert(result.error || "Komisyon hesaplanamadı.");
      }
    } catch (e) {
      alert("Hata oluştu.");
    } finally {
      setCalculatingId(null);
    }
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200">
         <div className="relative flex-1 max-w-sm">
           <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
           <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none" 
              placeholder="Teknisyen veya yetkinlik ara..." 
           />
         </div>
         <div className="text-sm text-slate-500 font-medium">Toplam {filteredMechanics.length} teknisyen</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredMechanics.map(mechanic => {
          const curr = mechanic.performanceCurrent || { completedCount: 0, totalLaborAmount: 0, avgDurationHours: 0 };
          const prev = mechanic.performancePrevious || { completedCount: 0, totalLaborAmount: 0, avgDurationHours: 0 };
          
          const countTrend = calculateTrend(curr.completedCount, prev.completedCount);
          const laborTrend = calculateTrend(curr.totalLaborAmount, prev.totalLaborAmount);
          const comm = commissionData[mechanic.id];

          return (
            <div key={mechanic.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <h3 className="text-xl font-bold text-slate-900">{mechanic.firstName} {mechanic.lastName}</h3>
                   <div className="flex flex-wrap gap-2 mt-2">
                     {mechanic.specialties.map(s => (
                       <span key={s} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold">{s}</span>
                     ))}
                   </div>
                 </div>
                 <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                   <Wrench className="w-6 h-6" />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="p-4 bg-slate-50 rounded-2xl">
                   <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                     <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Tamamlanan İş
                   </div>
                   <div className="text-2xl font-black text-slate-900">{curr.completedCount}</div>
                   <div className={`text-xs font-semibold mt-1 flex items-center gap-1 ${countTrend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                     {countTrend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                     {countTrend > 0 ? "+" : ""}{countTrend}% geçen aya göre
                   </div>
                 </div>
                 
                 <div className="p-4 bg-slate-50 rounded-2xl">
                   <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                     <Calculator className="w-4 h-4 text-indigo-500" /> İşçilik Geliri
                   </div>
                   <div className="text-2xl font-black text-slate-900">{formatMoney(curr.totalLaborAmount)}</div>
                   <div className={`text-xs font-semibold mt-1 flex items-center gap-1 ${laborTrend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                     {laborTrend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                     {laborTrend > 0 ? "+" : ""}{laborTrend}% geçen aya göre
                   </div>
                 </div>
               </div>

               <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                 <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                   <Clock className="w-4 h-4 text-slate-400" />
                   Ort. Süre: <span className="text-slate-900 font-bold">{curr.avgDurationHours} Saat</span>
                 </div>

                 {comm ? (
                   <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-100">
                     Hakediş: {formatMoney(comm.amount)}
                   </div>
                 ) : (
                   <button 
                     onClick={() => handleCalcCommission(mechanic.id)}
                     disabled={calculatingId === mechanic.id}
                     className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800 transition-all disabled:opacity-50"
                   >
                     {calculatingId === mechanic.id ? "Hesaplanıyor..." : "Komisyon Hesapla"}
                   </button>
                 )}
               </div>
            </div>
          );
        })}
        {filteredMechanics.length === 0 && (
          <div className="col-span-2 text-center py-12 text-slate-500">Kriterlere uygun teknisyen bulunamadı.</div>
        )}
      </div>
    </div>
  );
}
