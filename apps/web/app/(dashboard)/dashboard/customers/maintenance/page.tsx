import { getUpcomingMaintenances } from "@/lib/actions/crm.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import CrmBoardClient from "@/components/dashboard/crm/CrmBoardClient";

export const metadata = {
  title: "Bakım Takibi | MS Oto Servis",
};

export default async function CustomerMaintenancePage() {
  const result = await getUpcomingMaintenances();

  if (result.error) {
    return <PageError message={result.error} />;
  }

  return (
    <PageShell
      title="Bakım Takibi"
      subtitle="Müşteri araçlarının bakım planlarını, yaklaşan servis tarihlerini ve hatırlatmalarını takip edin."
      sectionLabel="Müşteri & Araç"
    >
      <CrmBoardClient
        plans={result.plans || []}
        stats={result.stats || { overdueCount: 0, upcomingCount: 0, totalPending: 0 }}
      />
    </PageShell>
  );
}
