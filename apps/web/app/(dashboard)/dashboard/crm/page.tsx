import { getUpcomingMaintenances } from "@/lib/actions/crm.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import CrmBoardClient from "@/components/dashboard/crm/CrmBoardClient";

export const metadata = {
  title: "CRM & Bakım Takibi | MS Oto Servis",
};

export default async function CrmPage() {
  const result = await getUpcomingMaintenances();

  if (result.error) {
    return <PageError message={result.error} />;
  }

  return (
    <PageShell
      title="CRM & Bakım Takibi"
      subtitle="Tüm müşterilerinizin araç bakım planlarını, yaklaşan servis tarihlerini ve hatırlatmalarını merkezi olarak takip edin."
      sectionLabel="Müşteri İlişkileri"
    >
      <CrmBoardClient
        plans={result.plans || []}
        stats={result.stats || { overdueCount: 0, upcomingCount: 0, totalPending: 0 }}
      />
    </PageShell>
  );
}
