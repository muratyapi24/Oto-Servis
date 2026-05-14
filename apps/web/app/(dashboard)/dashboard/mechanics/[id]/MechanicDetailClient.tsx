"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import MechanicFormModal from "@/components/dashboard/mechanics/MechanicFormModal";
import {
  DASHBOARD_ACTIONS,
  DASHBOARD_DETAIL,
  DASHBOARD_INSIGHT_RAIL,
  dashboardStatusBadgeClass,
  type DashboardStatusTone,
} from "@/lib/dashboard-ui-standards";

interface MechanicDetailClientProps {
  mechanic: any;
}

const statusLabels: Record<string, { label: string; tone: DashboardStatusTone }> = {
  PENDING: { label: "Bekliyor", tone: "warning" },
  IN_PROGRESS: { label: "Devam Ediyor", tone: "info" },
  COMPLETED: { label: "Tamamlandı", tone: "success" },
};

const DAY_MAP: Record<string, string> = {
  MON: "Pzt", TUE: "Sal", WED: "Çar",
  THU: "Per", FRI: "Cum", SAT: "Cmt", SUN: "Paz",
};

function formatShiftTime(start: string | null, end: string | null): string {
  if (!start && !end) return "Tanımlanmamış";
  if (start && end) return `${start} – ${end}`;
  return start ?? end ?? "Tanımlanmamış";
}

function formatWorkDays(days: string[]): string {
  if (!days || days.length === 0) return "Tanımlanmamış";
  return days.map((d) => DAY_MAP[d] ?? d).join(", ");
}

export default function MechanicDetailClient({ mechanic }: MechanicDetailClientProps) {
  const [editOpen, setEditOpen] = useState(false);

  const customerName = (order: any) => {
    if (!order.customer) return "—";
    return order.customer.type === "CORPORATE"
      ? order.customer.companyName
      : `${order.customer.firstName ?? ""} ${order.customer.lastName ?? ""}`.trim();
  };

  const initials = `${mechanic.firstName?.[0] ?? ""}${mechanic.lastName?.[0] ?? ""}`.toUpperCase();
  const activeStatusTone: DashboardStatusTone = mechanic.isActive ? "success" : "neutral";

  return (
    <div className="space-y-6">
      {/* Üst Bilgi Kartı */}
      <div className={`${DASHBOARD_DETAIL.profileHeader} md:items-start md:gap-6`}>
        {/* Avatar */}
        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-primary/10 text-primary">
          {mechanic.avatarUrl ? (
            <Image
              src={mechanic.avatarUrl}
              alt={`${mechanic.firstName} ${mechanic.lastName}`}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-primary text-xl font-bold">{initials}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-on-surface">
              {mechanic.firstName} {mechanic.lastName}
            </h2>
            <span className={dashboardStatusBadgeClass(activeStatusTone, "text-[10px] uppercase px-2 py-0.5")}>
              {mechanic.isActive ? "Aktif" : "Pasif"}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-on-surface-variant mt-2">
            {mechanic.phone && (
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">phone</span>
                {mechanic.phone}
              </span>
            )}
            {mechanic.email && (
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">mail</span>
                {mechanic.email}
              </span>
            )}
            {mechanic.experienceYears != null && (
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">workspace_premium</span>
                {mechanic.experienceYears} yıl deneyim
              </span>
            )}
            {mechanic.hourlyRate != null && (
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">payments</span>
                ₺{mechanic.hourlyRate}/saat
              </span>
            )}
          </div>
          {mechanic.specialties?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {mechanic.specialties.map((s: string) => (
                <span key={s} className="text-[10px] font-bold uppercase px-2.5 py-1 bg-primary/10 text-primary rounded-lg">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className={`${DASHBOARD_ACTIONS.secondaryButton} shrink-0`}
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          Düzenle
        </button>
      </div>

      {/* Vardiya & Hedef Kartı */}
      <div className={`${DASHBOARD_DETAIL.infoCard} p-6`}>
        <h3 className={`${DASHBOARD_DETAIL.sectionTitleRow} mb-4`}>
          <span className="material-symbols-outlined text-sm">schedule</span>
          Vardiya & Günlük Hedef
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={DASHBOARD_DETAIL.infoCardStack}>
            <p className={DASHBOARD_DETAIL.relatedLabel}>Vardiya Saatleri</p>
            <p className={DASHBOARD_DETAIL.infoValue}>
              {formatShiftTime(mechanic.shiftStart ?? null, mechanic.shiftEnd ?? null)}
            </p>
          </div>
          <div className={DASHBOARD_DETAIL.infoCardStack}>
            <p className={DASHBOARD_DETAIL.relatedLabel}>Çalışma Günleri</p>
            <p className={DASHBOARD_DETAIL.infoValue}>
              {formatWorkDays(mechanic.workDays ?? [])}
            </p>
          </div>
          <div className={DASHBOARD_DETAIL.infoCardStack}>
            <p className={DASHBOARD_DETAIL.relatedLabel}>Günlük Hedef</p>
            {mechanic.dailyTarget ? (
              <div>
                <p className={DASHBOARD_DETAIL.infoValue}>
                  {mechanic.activeOrders?.length ?? 0} / {mechanic.dailyTarget} iş
                </p>
                <div className="w-full bg-outline-variant/20 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(((mechanic.activeOrders?.length ?? 0) / mechanic.dailyTarget) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">Tanımlanmamış</p>
            )}
          </div>
        </div>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Aktif İş", value: mechanic.activeOrders?.length ?? 0, icon: "pending_actions", color: "text-secondary" },
          { label: "Tamamlanan", value: mechanic.completedOrders?.length ?? 0, icon: "task_alt", color: "text-tertiary" },
          { label: "Deneyim", value: mechanic.experienceYears ? `${mechanic.experienceYears} yıl` : "—", icon: "workspace_premium", color: "text-primary" },
          { label: "Saatlik Ücret", value: mechanic.hourlyRate ? `₺${mechanic.hourlyRate}` : "—", icon: "payments", color: "text-secondary" },
        ].map((card) => (
          <div key={card.label} className={DASHBOARD_INSIGHT_RAIL.statCard}>
            <span className={`material-symbols-outlined text-2xl ${card.color}`}>{card.icon}</span>
            <p className="text-2xl font-bold text-on-surface mt-2">{card.value}</p>
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Aktif İşler */}
      <div className={DASHBOARD_DETAIL.tableShell}>
        <div className={DASHBOARD_DETAIL.tableToolbarRow}>
          <span className={`${DASHBOARD_DETAIL.tableTitleIcon} material-symbols-outlined`}>pending_actions</span>
          <h3 className={DASHBOARD_DETAIL.tableTitle}>Aktif İş Emirleri</h3>
          <span className={dashboardStatusBadgeClass("warning", "ml-auto text-xs px-2 py-0.5")}>
            {mechanic.activeOrders?.length ?? 0}
          </span>
        </div>
        {mechanic.activeOrders?.length === 0 ? (
          <div className={DASHBOARD_DETAIL.tableEmpty}>Aktif iş emri bulunmuyor.</div>
        ) : (
          <div className={DASHBOARD_DETAIL.linkList}>
            {mechanic.activeOrders.map((order: any) => (
              <Link
                key={order.id}
                href={`/dashboard/services/${order.id}`}
                className={DASHBOARD_DETAIL.linkListRow}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-on-surface">
                    #{order.orderNumber} — {order.vehicle?.plate} {order.vehicle?.brand} {order.vehicle?.model}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{customerName(order)}</p>
                </div>
                <span className={dashboardStatusBadgeClass(statusLabels[order.status]?.tone ?? "neutral", "text-[10px] uppercase px-2 py-0.5")}>
                  {statusLabels[order.status]?.label ?? order.status}
                </span>
                <span className="material-symbols-outlined text-sm text-on-surface-variant">chevron_right</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Tamamlanan İşler */}
      <div className={DASHBOARD_DETAIL.tableShell}>
        <div className={DASHBOARD_DETAIL.tableToolbarRow}>
          <span className={`${DASHBOARD_DETAIL.tableTitleIcon} material-symbols-outlined`}>task_alt</span>
          <h3 className={DASHBOARD_DETAIL.tableTitle}>Tamamlanan İş Emirleri</h3>
          <span className={dashboardStatusBadgeClass("success", "ml-auto text-xs px-2 py-0.5")}>
            {mechanic.completedOrders?.length ?? 0}
          </span>
        </div>
        {mechanic.completedOrders?.length === 0 ? (
          <div className={DASHBOARD_DETAIL.tableEmpty}>Tamamlanan iş emri bulunmuyor.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={DASHBOARD_DETAIL.tableHead}>
                <tr>
                  <th className={DASHBOARD_DETAIL.tableHeaderCellWide}>İş No</th>
                  <th className={DASHBOARD_DETAIL.tableHeaderCellWide}>Araç</th>
                  <th className={DASHBOARD_DETAIL.tableHeaderCellWide}>Tarih</th>
                  <th className={DASHBOARD_DETAIL.tableHeaderCellWideRight}>Tutar</th>
                  <th className={DASHBOARD_DETAIL.tableHeaderCellWide}></th>
                </tr>
              </thead>
              <tbody className={DASHBOARD_DETAIL.tableBody}>
                {mechanic.completedOrders.map((order: any) => (
                  <tr key={order.id} className={DASHBOARD_DETAIL.tableRow}>
                    <td className={`${DASHBOARD_DETAIL.tableCellWide} font-semibold`}>#{order.orderNumber}</td>
                    <td className={`${DASHBOARD_DETAIL.tableCellWide} ${DASHBOARD_DETAIL.tableCellMuted}`}>
                      {order.vehicle?.plate} {order.vehicle?.brand} {order.vehicle?.model}
                    </td>
                    <td className={`${DASHBOARD_DETAIL.tableCellWide} ${DASHBOARD_DETAIL.tableCellMuted}`}>
                      {format(new Date(order.receptionDate), "dd MMM yyyy", { locale: tr })}
                    </td>
                    <td className={`${DASHBOARD_DETAIL.tableCellWideRight} ${DASHBOARD_DETAIL.tableCellMoneyStrong}`}>
                      ₺{Number(order.totalAmount).toLocaleString("tr-TR")}
                    </td>
                    <td className={`${DASHBOARD_DETAIL.tableCellWide} text-right`}>
                      <Link
                        href={`/dashboard/services/${order.id}`}
                        className={DASHBOARD_DETAIL.relatedLink}
                      >
                        Detay
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MechanicFormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        mechanicData={mechanic}
      />
    </div>
  );
}
