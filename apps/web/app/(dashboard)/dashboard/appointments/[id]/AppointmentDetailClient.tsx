"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { updateAppointmentStatus, updateAppointment } from "@/lib/actions/appointment.actions";

interface AppointmentDetailClientProps {
  appointment: any;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Onay Bekliyor", color: "bg-amber-100 text-amber-700" },
  CONFIRMED: { label: "Onaylandı", color: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Tamamlandı", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "İptal", color: "bg-red-100 text-red-700" },
  NO_SHOW: { label: "Gelmedi", color: "bg-slate-100 text-slate-600" },
};

const statusActions = [
  { value: "CONFIRMED", label: "Onayla", icon: "check_circle", color: "bg-blue-600 text-white" },
  { value: "COMPLETED", label: "Servise Al", icon: "build", color: "bg-green-600 text-white" },
  { value: "CANCELLED", label: "İptal Et", icon: "cancel", color: "bg-red-600 text-white" },
  { value: "NO_SHOW", label: "Gelmedi", icon: "person_off", color: "bg-slate-500 text-white" },
];

export default function AppointmentDetailClient({ appointment }: AppointmentDetailClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Edit form state
  const [editType, setEditType] = useState(appointment.type ?? "");
  const [editNotes, setEditNotes] = useState(appointment.notes ?? "");
  const [editDate, setEditDate] = useState(
    format(new Date(appointment.appointmentDate), "yyyy-MM-dd")
  );
  const [editTime, setEditTime] = useState(appointment.appointmentTime);
  const [editLoading, setEditLoading] = useState(false);

  const customerName = appointment.customer
    ? appointment.customer.type === "CORPORATE"
      ? appointment.customer.companyName
      : `${appointment.customer.firstName ?? ""} ${appointment.customer.lastName ?? ""}`.trim()
    : "—";

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const res = await updateAppointmentStatus({ id: appointment.id, status: newStatus as any });
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(res.success ?? "Durum güncellendi.");
      router.refresh();
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    const res = await updateAppointment({
      id: appointment.id,
      customerId: appointment.customer.id,
      vehicleId: appointment.vehicle?.id ?? null,
      appointmentDate: new Date(editDate),
      appointmentTime: editTime,
      type: editType,
      notes: editNotes,
    });
    setEditLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setEditOpen(false);
      router.refresh();
    }
  };

  const isFinished = appointment.status === "COMPLETED" || appointment.status === "CANCELLED" || appointment.status === "NO_SHOW";

  return (
    <div className="space-y-6">
      {/* Bilgi Kartı */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-2xl">calendar_month</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-bold text-on-surface">{appointment.type ?? "Randevu"}</h2>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusLabels[appointment.status]?.color}`}>
                  {statusLabels[appointment.status]?.label ?? appointment.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  {format(new Date(appointment.appointmentDate), "dd MMMM yyyy", { locale: tr })}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  {appointment.appointmentTime}
                </span>
              </div>
              {appointment.notes && (
                <p className="text-sm text-on-surface-variant mt-2 italic">"{appointment.notes}"</p>
              )}
            </div>
          </div>
          {!isFinished && (
            <button
              onClick={() => setEditOpen(!editOpen)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-outline-variant/30 rounded-xl hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Düzenle
            </button>
          )}
        </div>

        {/* Edit Form */}
        {editOpen && (
          <form onSubmit={handleEdit} className="mt-6 pt-6 border-t border-outline-variant/10 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Tarih</label>
              <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                className="w-full bg-surface-container px-3 py-2 rounded-xl text-sm border border-outline-variant/20 focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Saat</label>
              <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)}
                className="w-full bg-surface-container px-3 py-2 rounded-xl text-sm border border-outline-variant/20 focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Tür</label>
              <input value={editType} onChange={(e) => setEditType(e.target.value)}
                className="w-full bg-surface-container px-3 py-2 rounded-xl text-sm border border-outline-variant/20 focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Notlar</label>
              <input value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                className="w-full bg-surface-container px-3 py-2 rounded-xl text-sm border border-outline-variant/20 focus:outline-none focus:border-primary" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={editLoading}
                className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
                {editLoading ? "Kaydediliyor..." : "Kaydet"}
              </button>
              <button type="button" onClick={() => setEditOpen(false)}
                className="px-6 py-2 text-sm font-semibold border border-outline-variant/30 rounded-xl hover:bg-surface-container transition-colors">
                İptal
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Müşteri & Araç */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-outline-variant/20 p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">Müşteri</p>
          <Link href={`/dashboard/customers/${appointment.customer.id}`}
            className="flex items-center gap-3 hover:text-primary transition-colors group">
            <span className="material-symbols-outlined text-primary">person</span>
            <div>
              <p className="font-semibold text-sm group-hover:underline">{customerName}</p>
              <p className="text-xs text-on-surface-variant">{appointment.customer.phone}</p>
            </div>
            <span className="material-symbols-outlined text-sm text-on-surface-variant ml-auto">chevron_right</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-outline-variant/20 p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">Araç</p>
          {appointment.vehicle ? (
            <Link href={`/dashboard/vehicles/${appointment.vehicle.id}`}
              className="flex items-center gap-3 hover:text-primary transition-colors group">
              <span className="material-symbols-outlined text-primary">directions_car</span>
              <div>
                <p className="font-semibold text-sm group-hover:underline">{appointment.vehicle.plate}</p>
                <p className="text-xs text-on-surface-variant">{appointment.vehicle.brand} {appointment.vehicle.model}</p>
              </div>
              <span className="material-symbols-outlined text-sm text-on-surface-variant ml-auto">chevron_right</span>
            </Link>
          ) : (
            <p className="text-sm text-on-surface-variant italic">Araç atanmamış</p>
          )}
        </div>
      </div>

      {/* Durum Güncelleme */}
      {!isFinished && (
        <div className="bg-white rounded-2xl border border-outline-variant/20 p-6">
          <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">update</span>
            Durum Güncelle
          </h3>
          {error && <p className="text-sm text-error bg-error/10 p-3 rounded-xl mb-4">{error}</p>}
          {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-xl mb-4">{success}</p>}
          <div className="flex flex-wrap gap-3">
            {statusActions
              .filter((a) => a.value !== appointment.status)
              .map((action) => (
                <button
                  key={action.value}
                  onClick={() => handleStatusChange(action.value)}
                  disabled={loading}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-colors disabled:opacity-50 ${action.color}`}
                >
                  <span className="material-symbols-outlined text-sm">{action.icon}</span>
                  {action.label}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Tamamlandı — Servis linki */}
      {appointment.status === "COMPLETED" && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-3">
          <span className="material-symbols-outlined text-green-600 text-2xl">task_alt</span>
          <div>
            <p className="font-bold text-green-800 text-sm">Randevu servise alındı</p>
            <Link href="/dashboard/services" className="text-xs text-green-700 hover:underline">
              Servis iş emirlerini görüntüle →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
