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
import {
  DASHBOARD_ACTIONS,
  DASHBOARD_FORMS,
  DASHBOARD_LIST,
  DASHBOARD_SURFACES,
  dashboardStatusBadgeClass,
  type DashboardStatusTone,
} from "@/lib/dashboard-ui-standards";

dayjs.locale("tr");

const STATUS_CONFIG: Record<string, { label: string; tone: DashboardStatusTone }> = {
  PENDING: { label: "Bekliyor", tone: "warning" },
  SENT: { label: "Gönderildi", tone: "success" },
  FAILED: { label: "Başarısız", tone: "danger" },
  SKIPPED: { label: "Atlandı", tone: "neutral" },
  DELIVERED: { label: "İletildi", tone: "info" },
  READ: { label: "Okundu", tone: "info" },
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
      <div className={`${DASHBOARD_SURFACES.panel} p-4`}>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder="Müşteri, alıcı veya mesaj ara..."
              className={`${DASHBOARD_FORMS.control} pl-9 pr-4 py-2`}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-on-surface-variant/70 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className={`${DASHBOARD_FORMS.select} md:w-auto py-2 px-3`}
            >
              <option value="ALL">Tüm Durumlar</option>
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <select
              value={channelFilter}
              onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
              className={`${DASHBOARD_FORMS.select} md:w-auto py-2 px-3`}
            >
              <option value="ALL">Tüm Kanallar</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="EMAIL">E-posta</option>
              <option value="IN_APP">Uygulama İçi</option>
            </select>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 bg-tertiary-fixed/30 hover:bg-tertiary-fixed/40 text-on-tertiary-fixed-variant border border-tertiary-fixed-dim/40 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className={DASHBOARD_LIST.shell}>
        <div className={DASHBOARD_LIST.tableScroll}>
          <table className="w-full text-sm text-left">
            <thead className={DASHBOARD_LIST.headRow}>
              <tr>
                <th className={DASHBOARD_LIST.headerCell}>Tarih</th>
                <th className={DASHBOARD_LIST.headerCell}>Müşteri</th>
                <th className={DASHBOARD_LIST.headerCell}>Kanal</th>
                <th className={DASHBOARD_LIST.headerCell}>Alıcı</th>
                <th className={DASHBOARD_LIST.headerCell}>Mesaj</th>
                <th className={DASHBOARD_LIST.headerCell}>Durum</th>
                <th className={DASHBOARD_LIST.headerCellRight}>İşlem</th>
              </tr>
            </thead>
            <tbody className={DASHBOARD_LIST.body}>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Bell className="w-10 h-10 mx-auto text-on-surface-variant/40 mb-3" />
                    <p className="text-on-surface-variant font-medium">Bildirim bulunamadı.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((n) => {
                  const statusCfg = STATUS_CONFIG[n.status] || { label: n.status || "Bilinmiyor", tone: "neutral" as const };
                  const channelIcon = CHANNEL_ICONS[n.channel] ?? "🔔";
                  return (
                    <tr key={n.id} className={DASHBOARD_LIST.row}>
                      <td className="px-6 py-4 text-on-surface-variant text-xs whitespace-nowrap">
                        {dayjs(n.createdAt).format("DD MMM HH:mm")}
                      </td>
                      <td className="px-6 py-4 font-medium text-on-surface">
                        {getNotificationCustomerName(n.customer)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-base">{channelIcon}</span>
                        <span className="ml-1.5 text-xs font-bold text-on-surface-variant">
                          {n.channel.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant text-xs">{n.recipient}</td>
                      <td className="px-6 py-4 text-on-surface-variant text-xs max-w-xs truncate">
                        {n.body}
                      </td>
                      <td className="px-6 py-4">
                        <span className={dashboardStatusBadgeClass(statusCfg.tone, "text-xs")}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {n.status === "FAILED" && (
                          <button
                            onClick={() => handleResend(n.id)}
                            disabled={resendingId === n.id}
                            className="flex items-center gap-1 bg-secondary-container/20 hover:bg-secondary-container/30 text-on-secondary-container border border-secondary-container/40 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ml-auto"
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
          <div className="px-6 py-4 border-t border-outline-variant/20 flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">
              {total} kayıt içinde {filtered.length} sonuçtan {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} gösteriliyor
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`${DASHBOARD_ACTIONS.iconButton} p-1.5 disabled:opacity-40`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-on-surface">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`${DASHBOARD_ACTIONS.iconButton} p-1.5 disabled:opacity-40`}
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
