"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  Search,
  Send,
  SendHorizonal,
  CheckCircle2,
  Car,
  User,
  Gauge,
} from "lucide-react";
import Link from "next/link";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import { sendMaintenanceReminderSms, sendBulkMaintenanceReminders } from "@/lib/actions/crm.actions";

dayjs.locale("tr");

interface MaintenancePlan {
  id: string;
  title: string;
  dueDate: string | null;
  dueMileage: number | null;
  isOverdue: boolean;
  isUpcoming: boolean;
  isMileageDue: boolean;
  vehicleId: string;
  plate: string;
  vehicleName: string;
  vehicleYear: number | null;
  currentMileage: number;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  createdAt: string;
}

interface CrmBoardProps {
  plans: MaintenancePlan[];
  stats: { overdueCount: number; upcomingCount: number; totalPending: number };
}

type FilterType = "all" | "overdue" | "upcoming" | "mileage";

export default function CrmBoardClient({ plans, stats }: CrmBoardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [isBulkSending, setIsBulkSending] = useState(false);

  const filteredPlans = plans.filter((p) => {
    // Arama filtresi
    const matchesSearch =
      p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.vehicleName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Kategori filtresi
    if (filter === "overdue") return p.isOverdue;
    if (filter === "upcoming") return p.isUpcoming && !p.isOverdue;
    if (filter === "mileage") return p.isMileageDue;
    return true;
  });

  const handleSendSms = async (planId: string) => {
    setSendingId(planId);
    try {
      const res = await sendMaintenanceReminderSms(planId);
      if (res.success) {
        setSentIds((prev) => new Set(prev).add(planId));
      } else {
        alert(res.error || "SMS gönderilemedi.");
      }
    } catch {
      alert("SMS gönderilirken hata oluştu.");
    } finally {
      setSendingId(null);
    }
  };

  const handleBulkSend = async () => {
    if (!confirm("Gecikmiş ve yaklaşan tüm bakım planları için toplu SMS göndermek istediğinizden emin misiniz?")) return;
    setIsBulkSending(true);
    try {
      const res = await sendBulkMaintenanceReminders();
      if (res.success) {
        alert(res.success);
      } else {
        alert(res.error || "Toplu gönderim başarısız.");
      }
    } catch {
      alert("Toplu gönderim sırasında hata oluştu.");
    } finally {
      setIsBulkSending(false);
    }
  };

  const getStatusBadge = (plan: MaintenancePlan) => {
    if (plan.isOverdue) {
      return <span className="px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 border border-red-200 rounded-lg text-[10px] font-black tracking-wider uppercase">Gecikmiş</span>;
    }
    if (plan.isMileageDue) {
      return <span className="px-2 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-600 border border-orange-200 rounded-lg text-[10px] font-black tracking-wider uppercase">KM Aşıldı</span>;
    }
    if (plan.isUpcoming) {
      return <span className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-[10px] font-black tracking-wider uppercase">Yaklaşıyor</span>;
    }
    return <span className="px-2 py-1 bg-slate-50 dark:bg-gray-800/50 text-slate-500 border border-slate-200 rounded-lg text-[10px] font-black tracking-wider uppercase">Planlandı</span>;
  };

  const filterButtons: { key: FilterType; label: string; count: number; color: string }[] = [
    { key: "all", label: "Tümü", count: plans.length, color: "bg-slate-900 text-white" },
    { key: "overdue", label: "Gecikmiş", count: stats.overdueCount, color: "bg-red-50 text-red-600 border-red-200" },
    { key: "upcoming", label: "Yaklaşan (30 gün)", count: stats.upcomingCount, color: "bg-amber-50 text-amber-600 border-amber-200" },
    { key: "mileage", label: "KM Aşıldı", count: plans.filter((p) => p.isMileageDue).length, color: "bg-orange-50 text-orange-600 border-orange-200" },
  ];

  return (
    <div className="flex-1 space-y-8">
      {/* KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
          <div className="absolute right-4 bottom-2 opacity-10">
            <AlertTriangle className="w-24 h-24" />
          </div>
          <span className="text-[10px] font-black tracking-widest text-red-100 uppercase">Gecikmiş Bakımlar</span>
          <p className="text-4xl font-black mt-2">{stats.overdueCount}</p>
          <p className="text-xs text-red-200 mt-1">Tarihi geçmiş veya KM aşılmış</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
          <div className="absolute right-4 bottom-2 opacity-10">
            <CalendarClock className="w-24 h-24" />
          </div>
          <span className="text-[10px] font-black tracking-widest text-amber-100 uppercase">Yaklaşan (30 Gün)</span>
          <p className="text-4xl font-black mt-2">{stats.upcomingCount}</p>
          <p className="text-xs text-amber-200 mt-1">Önümüzdeki 30 gün içinde planlanmış</p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
          <div className="absolute right-4 bottom-2 opacity-10">
            <ClipboardList className="w-24 h-24" />
          </div>
          <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">Toplam Bekleyen Bakım</span>
          <p className="text-4xl font-black mt-2">{stats.totalPending}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Tamamlanmamış tüm bakım planları</p>
        </div>
      </div>

      {/* Araç Çubuğu */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {filterButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                filter === btn.key
                  ? btn.key === "all"
                    ? "bg-slate-900 text-white border-slate-900"
                    : btn.color + " border"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {btn.label} ({btn.count})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none w-64"
              placeholder="Müşteri, plaka, bakım ara..."
            />
          </div>
          <button
            onClick={handleBulkSend}
            disabled={isBulkSending || stats.overdueCount + stats.upcomingCount === 0}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            <SendHorizonal className="w-4 h-4" />
            {isBulkSending ? "Gönderiliyor..." : "Toplu SMS Gönder"}
          </button>
        </div>
      </div>

      {/* Bakım Planları Listesi */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 p-12 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-3" />
          <p className="text-lg font-bold text-slate-700 dark:text-gray-300">Bu filtredeki tüm bakımlar güncel!</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Gecikmiş veya yaklaşan bakım planı bulunamadı.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200">
                  <th className="text-left py-3.5 px-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Durum</th>
                  <th className="text-left py-3.5 px-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bakım Planı</th>
                  <th className="text-left py-3.5 px-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> Müşteri</span>
                  </th>
                  <th className="text-left py-3.5 px-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Car className="w-3 h-3" /> Araç</span>
                  </th>
                  <th className="text-left py-3.5 px-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tarih</th>
                  <th className="text-left py-3.5 px-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Gauge className="w-3 h-3" /> KM</span>
                  </th>
                  <th className="text-right py-3.5 px-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50 dark:bg-gray-800/50/50 transition-colors">
                    <td className="py-3.5 px-4">{getStatusBadge(plan)}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-white">{plan.title}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Link href={`/dashboard/customers/${plan.customerId}`} className="text-primary font-semibold hover:underline">
                        {plan.customerName}
                      </Link>
                      {plan.customerPhone && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{plan.customerPhone}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Link href={`/dashboard/vehicles/${plan.vehicleId}`} className="text-primary font-mono font-bold text-xs hover:underline">
                        {plan.plate}
                      </Link>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{plan.vehicleName}{plan.vehicleYear ? ` (${plan.vehicleYear})` : ""}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      {plan.dueDate ? (
                        <span className={`text-xs font-bold ${plan.isOverdue ? "text-red-600" : "text-slate-700"}`}>
                          {dayjs(plan.dueDate).format("DD MMM YYYY")}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {plan.dueMileage ? (
                        <div>
                          <span className={`text-xs font-bold ${plan.isMileageDue ? "text-orange-600" : "text-slate-700"}`}>
                            {plan.dueMileage.toLocaleString("tr-TR")} km
                          </span>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">Mevcut: {plan.currentMileage.toLocaleString("tr-TR")} km</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {sentIds.has(plan.id) ? (
                        <span className="text-emerald-600 text-xs font-bold flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-4 h-4" /> Gönderildi
                        </span>
                      ) : plan.customerPhone ? (
                        <button
                          onClick={() => handleSendSms(plan.id)}
                          disabled={sendingId === plan.id}
                          className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50 ml-auto"
                        >
                          <Send className="w-3 h-3" />
                          {sendingId === plan.id ? "..." : "SMS Gönder"}
                        </button>
                      ) : (
                        <span className="text-xs text-red-400 font-medium">Tel. Yok</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
