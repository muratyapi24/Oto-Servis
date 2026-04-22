"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import MechanicFormModal from "@/components/dashboard/mechanics/MechanicFormModal";

interface MechanicDetailClientProps {
  mechanic: any;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Bekliyor", color: "bg-amber-100 text-amber-700" },
  IN_PROGRESS: { label: "Devam Ediyor", color: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Tamamlandı", color: "bg-green-100 text-green-700" },
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

  return (
    <div className="space-y-6">
      {/* Üst Bilgi Kartı */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 p-6 flex flex-col md:flex-row gap-6 items-start">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
          {mechanic.avatarUrl ? (
            <Image
              src={mechanic.avatarUrl}
              alt={`${mechanic.firstName} ${mechanic.lastName}`}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-xl font-bold">{initials}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-on-surface">
              {mechanic.firstName} {mechanic.lastName}
            </h2>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${mechanic.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
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
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-outline-variant/30 rounded-xl hover:bg-surface-container transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          Düzenle
        </button>
      </div>

      {/* Vardiya & Hedef Kartı */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 p-6">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">schedule</span>
          Vardiya & Günlük Hedef
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-container/50 rounded-xl p-4">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Vardiya Saatleri</p>
            <p className="text-sm font-bold text-on-surface">
              {formatShiftTime(mechanic.shiftStart ?? null, mechanic.shiftEnd ?? null)}
            </p>
          </div>
          <div className="bg-surface-container/50 rounded-xl p-4">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Çalışma Günleri</p>
            <p className="text-sm font-bold text-on-surface">
              {formatWorkDays(mechanic.workDays ?? [])}
            </p>
          </div>
          <div className="bg-surface-container/50 rounded-xl p-4">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Günlük Hedef</p>
            {mechanic.dailyTarget ? (
              <div>
                <p className="text-sm font-bold text-on-surface">
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
          { label: "Aktif İş", value: mechanic.activeOrders?.length ?? 0, icon: "pending_actions", color: "text-amber-600" },
          { label: "Tamamlanan", value: mechanic.completedOrders?.length ?? 0, icon: "task_alt", color: "text-green-600" },
          { label: "Deneyim", value: mechanic.experienceYears ? `${mechanic.experienceYears} yıl` : "—", icon: "workspace_premium", color: "text-primary" },
          { label: "Saatlik Ücret", value: mechanic.hourlyRate ? `₺${mechanic.hourlyRate}` : "—", icon: "payments", color: "text-secondary" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-outline-variant/20 p-4">
            <span className={`material-symbols-outlined text-2xl ${card.color}`}>{card.icon}</span>
            <p className="text-2xl font-bold text-on-surface mt-2">{card.value}</p>
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Aktif İşler */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-500">pending_actions</span>
          <h3 className="font-bold text-on-surface">Aktif İş Emirleri</h3>
          <span className="ml-auto text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            {mechanic.activeOrders?.length ?? 0}
          </span>
        </div>
        {mechanic.activeOrders?.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant text-sm">Aktif iş emri bulunmuyor.</div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {mechanic.activeOrders.map((order: any) => (
              <Link
                key={order.id}
                href={`/dashboard/services/${order.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-on-surface">
                    #{order.orderNumber} — {order.vehicle?.plate} {order.vehicle?.brand} {order.vehicle?.model}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{customerName(order)}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusLabels[order.status]?.color ?? ""}`}>
                  {statusLabels[order.status]?.label ?? order.status}
                </span>
                <span className="material-symbols-outlined text-sm text-on-surface-variant">chevron_right</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Tamamlanan İşler */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center gap-2">
          <span className="material-symbols-outlined text-green-500">task_alt</span>
          <h3 className="font-bold text-on-surface">Tamamlanan İş Emirleri</h3>
          <span className="ml-auto text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            {mechanic.completedOrders?.length ?? 0}
          </span>
        </div>
        {mechanic.completedOrders?.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant text-sm">Tamamlanan iş emri bulunmuyor.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container/50 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  <th className="px-6 py-3 text-left">İş No</th>
                  <th className="px-6 py-3 text-left">Araç</th>
                  <th className="px-6 py-3 text-left">Tarih</th>
                  <th className="px-6 py-3 text-right">Tutar</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {mechanic.completedOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-surface-container/30 transition-colors">
                    <td className="px-6 py-3 font-semibold">#{order.orderNumber}</td>
                    <td className="px-6 py-3 text-on-surface-variant">
                      {order.vehicle?.plate} {order.vehicle?.brand} {order.vehicle?.model}
                    </td>
                    <td className="px-6 py-3 text-on-surface-variant">
                      {format(new Date(order.receptionDate), "dd MMM yyyy", { locale: tr })}
                    </td>
                    <td className="px-6 py-3 text-right font-bold">
                      ₺{Number(order.totalAmount).toLocaleString("tr-TR")}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link
                        href={`/dashboard/services/${order.id}`}
                        className="text-primary text-xs font-semibold hover:underline"
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
