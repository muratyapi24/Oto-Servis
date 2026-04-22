import { getLocations } from "@/lib/actions/location.actions";
import { getParts } from "@/lib/actions/inventory.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import NewTransferForm from "./NewTransferForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Yeni Transfer Talebi | MS Oto Servis",
};

export default async function NewTransferPage() {
  const [locationsResult, partsResult] = await Promise.all([
    getLocations(),
    getParts(),
  ]);

  if (locationsResult.error) {
    return <PageError message={locationsResult.error} />;
  }

  const locations = (locationsResult.locations ?? []).map((l: any) => ({
    id: l.id,
    name: l.name,
  }));

  const parts = (partsResult.parts ?? [])
    .filter((p: any) => p.isActive !== false)
    .map((p: any) => ({
      id: p.id,
      name: p.name,
      partNumber: p.partNumber,
      unit: p.unit,
      currentStock: p.currentStock,
    }));

  return (
    <PageShell
      title="Yeni Transfer Talebi"
      subtitle="Kaynak ve hedef lokasyon seçerek parça transfer talebi oluşturun."
      sectionLabel="Stok Transferleri"
      actions={
        <Link
          href="/dashboard/inventory/transfers"
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri Dön
        </Link>
      }
    >
      <NewTransferForm locations={locations} parts={parts} />
    </PageShell>
  );
}
