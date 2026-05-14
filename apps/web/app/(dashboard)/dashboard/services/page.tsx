import { getServiceDashboard } from "@/lib/actions/service.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import ServiceBoardClient from "@/components/dashboard/services/ServiceBoardClient";
import ServiceWorkspaceNav from "@/components/dashboard/services/ServiceWorkspaceNav";

export const metadata = {
  title: "Servis İşlemleri | MS Oto Servis",
};

export default async function ServicesKanbanPage() {
  const dataRes = await getServiceDashboard();

  if ("error" in dataRes) {
    return <PageError message={dataRes.error!} />;
  }

  return (
    <PageShell
      title="Servis Operasyonu"
      subtitle="İş emirleri, randevular ve teklifleri tek servis hattında yönetin."
      sectionLabel="Atölye Akışı"
    >
      <ServiceWorkspaceNav />
      <ServiceBoardClient
        orders={dataRes.orders || []}
        customers={dataRes.customers || []}
        vehicles={dataRes.vehicles || []}
        mechanics={dataRes.mechanics || []}
      />
    </PageShell>
  );
}
