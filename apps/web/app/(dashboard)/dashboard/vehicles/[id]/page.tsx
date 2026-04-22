import { notFound } from "next/navigation";
import { getVehicleById } from "@/lib/actions/vehicle.actions";
import PageShell from "@/components/dashboard/PageShell";
import Link from "next/link";
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
      sectionLabel="Araç Yönetimi"
      actions={
        <Link
          href="/dashboard/vehicles"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Araçlara Dön
        </Link>
      }
    >
      <VehicleDetailClient vehicle={vehicle} />
    </PageShell>
  );
}
