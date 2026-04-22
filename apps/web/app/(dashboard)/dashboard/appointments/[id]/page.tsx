import { notFound } from "next/navigation";
import Link from "next/link";
import { getAppointmentById } from "@/lib/actions/appointment.actions";
import PageShell from "@/components/dashboard/PageShell";
import AppointmentDetailClient from "./AppointmentDetailClient";

export const metadata = { title: "Randevu Detayı | MS Oto Servis" };

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getAppointmentById(id);

  if (!result.appointment) notFound();

  return (
    <PageShell
      title="Randevu Detayı"
      subtitle="Randevu bilgileri ve durum yönetimi"
      sectionLabel="Randevular"
      actions={
        <Link
          href="/dashboard/appointments"
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-on-surface-variant border border-outline-variant/30 rounded-xl hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Geri
        </Link>
      }
    >
      <AppointmentDetailClient appointment={result.appointment} />
    </PageShell>
  );
}
