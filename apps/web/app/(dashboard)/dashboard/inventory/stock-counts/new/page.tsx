import { getLocations } from "@/lib/actions/location.actions";
import { getPartCategories } from "@/lib/actions/inventory.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import InventoryWorkspaceNav from "@/components/dashboard/inventory/InventoryWorkspaceNav";
import NewStockCountForm from "./NewStockCountForm";

export const metadata = {
  title: "Yeni Stok Sayımı | MS Oto Servis",
};

type LocationOption = {
  id: string;
  name: string;
};

type CategoryOption = {
  id: string;
  name: string;
};

export default async function NewStockCountPage() {
  const [locationsResult, categoriesResult] = await Promise.all([
    getLocations(),
    getPartCategories(),
  ]);

  if ('error' in locationsResult) {
    return <PageError message={locationsResult.error} />;
  }

  const locations = (locationsResult.locations ?? []).map((l: LocationOption) => ({
    id: l.id,
    name: l.name,
  }));

  const categories = (categoriesResult.categories ?? []).map((c: CategoryOption) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <PageShell
      title="Yeni Stok Sayımı"
      subtitle="Lokasyon ve kategori seçerek sayım oturumu başlatın."
      sectionLabel="Stok & Envanter"
    >
      <InventoryWorkspaceNav />
      <NewStockCountForm locations={locations} categories={categories} />
    </PageShell>
  );
}
