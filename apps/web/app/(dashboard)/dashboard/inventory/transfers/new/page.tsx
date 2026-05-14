import { getLocations } from "@/lib/actions/location.actions";
import { getParts } from "@/lib/actions/inventory.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import InventoryWorkspaceNav from "@/components/dashboard/inventory/InventoryWorkspaceNav";
import NewTransferForm from "./NewTransferForm";

export const metadata = {
  title: "Yeni Transfer Talebi | MS Oto Servis",
};

type LocationOption = {
  id: string;
  name: string;
};

type TransferPartOption = {
  id: string;
  name: string;
  partNumber: string | null;
  unit: string;
  currentStock: number;
  isActive?: boolean | null;
};

export default async function NewTransferPage() {
  const [locationsResult, partsResult] = await Promise.all([
    getLocations(),
    getParts(),
  ]);

  if ('error' in locationsResult) {
    return <PageError message={locationsResult.error} />;
  }

  const locations = (locationsResult.locations ?? []).map((l: LocationOption) => ({
    id: l.id,
    name: l.name,
  }));

  const parts = (partsResult.parts ?? [])
    .filter((p: TransferPartOption) => p.isActive !== false)
    .map((p: TransferPartOption) => ({
      id: p.id,
      name: p.name,
      partNumber: p.partNumber ?? "",
      unit: p.unit,
      currentStock: p.currentStock,
    }));

  return (
    <PageShell
      title="Yeni Transfer Talebi"
      subtitle="Kaynak ve hedef lokasyon seçerek parça transfer talebi oluşturun."
      sectionLabel="Stok Transferleri"
    >
      <InventoryWorkspaceNav />
      <NewTransferForm locations={locations} parts={parts} />
    </PageShell>
  );
}
