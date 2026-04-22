import { getLocations } from "@/lib/actions/location.actions";
import { getPartCategories } from "@/lib/actions/inventory.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import NewStockCountForm from "./NewStockCountForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Yeni Stok Sayımı | MS Oto Servis",
};

export default async function NewStockCountPage() {
  const [locationsResult, categoriesResult] = await Promise.all([
    getLocations(),
    getPartCategories(),
  ]);

  if (locationsResult.error) {
    return <PageError message={locationsResult.error} />;
  }

  const locations = (locationsResult.locations ?? []).map((l: any) => ({
    id: l.id,
    name: l.name,
  }));

  const categories = (categoriesResult.categories ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <PageShell
      title="Yeni Stok Sayımı"
      subtitle="Lokasyon ve kategori seçerek sayım oturumu başlatın."
      sectionLabel="Stok & Envanter"
      actions={
        <Link
          href="/dashboard/inventory/stock-counts"
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri Dön
        </Link>
      }
    >
      <NewStockCountForm locations={locations} categories={categories} />
    </PageShell>
  );
}
