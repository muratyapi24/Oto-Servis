import { getServiceDashboard } from "@/lib/actions/service.actions";
import { PageError } from "@/components/dashboard/PageShell";
import ServiceBoardClient from "@/components/dashboard/services/ServiceBoardClient";

export const metadata = {
  title: "Servis İşlemleri | MS Oto Servis",
};

export default async function ServicesKanbanPage() {
  const dataRes = await getServiceDashboard();

  if ("error" in dataRes) {
    return <PageError message={dataRes.error!} />;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <ServiceBoardClient
        orders={dataRes.orders || []}
        customers={dataRes.customers || []}
        vehicles={dataRes.vehicles || []}
        mechanics={dataRes.mechanics || []}
      />
    </div>
  );
}
