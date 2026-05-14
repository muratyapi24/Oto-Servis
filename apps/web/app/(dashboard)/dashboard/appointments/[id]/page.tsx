import { notFound } from "next/navigation";
import { getAppointmentById } from "@/lib/actions/appointment.actions";
import PageShell from "@/components/dashboard/PageShell";
import ServiceWorkspaceNav from "@/components/dashboard/services/ServiceWorkspaceNav";
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
    >
      <ServiceWorkspaceNav />
      <AppointmentDetailClient appointment={result.appointment} />
    </PageShell>
  );
}
