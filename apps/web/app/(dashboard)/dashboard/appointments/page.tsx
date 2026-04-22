import { getAppointments, getAppointmentStats } from "@/lib/actions/appointment.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import AppointmentBoardClient from "@/components/dashboard/appointments/AppointmentBoardClient";

export const metadata = {
  title: "Randevu Yönetimi | MS Oto Servis",
};

export default async function AppointmentsPage() {
  const [aptsRes, statsRes] = await Promise.all([
    getAppointments(),
    getAppointmentStats()
  ]);

  const { appointments = [], customers = [], vehicles = [], error } = aptsRes;

  if (error) {
    return <PageError message={error} />;
  }

  const stats = statsRes?.stats || { todayCount: 0, pendingCount: 0, confirmedCount: 0, weeklyCount: 0, noShowCount: 0 };

  return (
    <PageShell
      title="Randevu Yönetimi"
      subtitle="Müşteri randevularını planlayın, takvim üzerinden yönetin ve SMS hatırlatmaları gönderin."
      sectionLabel="Planlama"
    >
      <AppointmentBoardClient
        appointments={appointments}
        customers={customers}
        vehicles={vehicles}
        stats={stats}
      />
    </PageShell>
  );
}
