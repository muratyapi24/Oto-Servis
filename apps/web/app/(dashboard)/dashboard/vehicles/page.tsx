import { getVehicleDashboard } from "@/lib/actions/vehicle.actions";
import { getCustomers } from "@/lib/actions/customer.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import CustomerWorkspaceNav from "@/components/dashboard/customers/CustomerWorkspaceNav";
import VehicleBoardClient from "@/components/dashboard/vehicles/VehicleBoardClient";

export const metadata = {
  title: "Araç Filosu & Veritabanı | MS Oto Servis"
};

export default async function VehiclesPage() {
  const [dataRes, customersRes] = await Promise.all([
    getVehicleDashboard(),
    getCustomers()
  ]);

  if (dataRes.error) {
    return <PageError message={dataRes.error} />;
  }

  const safeData = {
    metrics: dataRes.metrics || { total: 0, avgAge: 0, evRate: 0 },
    recentRegistrations: dataRes.recentRegistrations || [],
    vehiclesList: dataRes.vehiclesList || []
  };

  const formattedCustomers = ('customers' in customersRes ? customersRes.customers : []).map(c => ({
    id: c.id,
    name: c.type === "CORPORATE" ? c.companyName || "Şirket" : `${c.firstName || ""} ${c.lastName || ""}`.trim()
  }));

  return (
    <PageShell
      title="Garaj ve Veritabanı"
      subtitle="Müşteri filolarının profesyonel yönetimi; teknik bakım geçmişlerinin, randevu pencerelerinin takip edilmesi."
      sectionLabel="Araç Filo Envanteri"
    >
      <CustomerWorkspaceNav />
      <VehicleBoardClient data={safeData} customers={formattedCustomers} />
    </PageShell>
  );
}
