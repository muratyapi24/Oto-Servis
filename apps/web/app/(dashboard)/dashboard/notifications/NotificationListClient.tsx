"use client";

import { useState, useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import {
  Bell, Search, Filter, ChevronLeft, ChevronRight,
  Download, RefreshCw, Loader2
} from "lucide-react";
import { exportToCsv } from "@/lib/csv-utils";
import { getNotificationCustomerName, type NotificationListItem } from "@/components/dashboard/notifications/types";

dayjs.locale("tr");

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Bekliyor", className: "bg-amber-50 text-amber-700 border border-amber-200" },
  SENT: { label: "Gönderildi", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  FAILED: { label: "Başarısız", className: "bg-red-50 text-red-700 border border-red-200" },
  SKIPPED: { label: "Atlandı", className: "bg-slate-100 text-slate-600 border border-slate-200" },
  DELIVERED: { label: "İletildi", className: "bg-blue-50 text-blue-700 border border-blue-200" },
  READ: { label: "Okundu", className: "bg-purple-50 text-purple-700 border border-purple-200" },
};

const CHANNEL_ICONS: Record<string, string> = {
  SMS: "📱",
  WHATSAPP: "💬",
  EMAIL: "📧",
  IN_APP: "🔔",
  whatsapp: "💬",
  sms: "📱",
  email: "📧",
};

const PAGE_SIZE = 50;

export default function NotificationListClient({
  notifications,
  total,
}: {
  notifications: NotificationListItem[];
  total: number;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      const matchSearch =
        !searchTerm ||
        getNotificationCustomerName(n.customer).toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.body ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || n.status === statusFilter;
      const matchChannel = channelFilter === "ALL" || n.channel.toUpperCase() === channelFilter;
      return matchSearch && matchStatus && matchChannel;
    });
  }, [notifications, searchTerm, statusFilter, channelFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExportCsv = () => {
    const rows = filtered.map((n) => ({
      Tarih: dayjs(n.createdAt).format("DD.MM.YYYY HH:mm"),
      Müşteri: getNotificationCustomerName(n.customer),
      Alıcı: n.recipient,
      Kanal: n.channel.toUpperCase(),
      Durum: STATUS_CONFIG[n.status]?.label ?? n.status,
      Mesaj: (n.body ?? "").slice(0, 100),
    }));
    exportToCsv(rows, `bildirimler-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleResend = async (notificationId: string) => {
    setResendingId(notificationId);
    try {
      // Yeniden gönderim için API çağrısı
      await fetch(`/api/notifications/${notificationId}/resend`, { method: "POST" });
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtreler */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder="Müşteri, alıcı veya mesaj ara..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
            >
              <option value="ALL">Tüm Durumlar</option>
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <select
              value={channelFilter}
              onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
            >
              <option value="ALL">Tüm Kanallar</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="EMAIL">E-posta</option>
              <option value="IN_APP">Uygulama İçi</option>
            </select>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Tarih</th>
                <th className="px-6 py-4">Müşteri</th>
                <th className="px-6 py-4">Kanal</th>
                <th className="px-6 py-4">Alıcı</th>
                <th className="px-6 py-4">Mesaj</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Bell className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-400 font-medium">Bildirim bulunamadı.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((n) => {
                  const statusCfg = STATUS_CONFIG[n.status] || { label: n.status || "Bilinmiyor", className: "bg-slate-100 text-slate-600 border border-slate-200" };
                  const channelIcon = CHANNEL_ICONS[n.channel] ?? "🔔";
                  return (
                    <tr key={n.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                        {dayjs(n.createdAt).format("DD MMM HH:mm")}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {getNotificationCustomerName(n.customer)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-base">{channelIcon}</span>
                        <span className="ml-1.5 text-xs font-bold text-slate-500">
                          {n.channel.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">{n.recipient}</td>
                      <td className="px-6 py-4 text-slate-600 text-xs max-w-xs truncate">
                        {n.body}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black ${statusCfg.className}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {n.status === "FAILED" && (
                          <button
                            onClick={() => handleResend(n.id)}
                            disabled={resendingId === n.id}
                            className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ml-auto"
                          >
                            {resendingId === n.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )}
                            Tekrar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {total} kayıt içinde {filtered.length} sonuçtan {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} gösteriliyor
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
