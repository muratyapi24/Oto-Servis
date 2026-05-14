import { notFound } from "next/navigation";
import { getVehicleById } from "@/lib/actions/vehicle.actions";
import PageShell from "@/components/dashboard/PageShell";
import CustomerWorkspaceNav from "@/components/dashboard/customers/CustomerWorkspaceNav";
import VehicleDetailClient from "./VehicleDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getVehicleById(id);
  if (!result.vehicle) return { title: "Araç Bulunamadı | MS Oto Servis" };

  return {
    title: `${result.vehicle.plate} — ${result.vehicle.brand} ${result.vehicle.model} | Araç Detayı | MS Oto Servis`,
  };
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getVehicleById(id);

  if (!result.vehicle) notFound();

  const vehicle = JSON.parse(JSON.stringify(result.vehicle));

  return (
    <PageShell
      title="Araç Detayı"
      sectionLabel="Müşteri & Araç"
    >
      <CustomerWorkspaceNav />
      <VehicleDetailClient vehicle={vehicle} />
    </PageShell>
  );
}
