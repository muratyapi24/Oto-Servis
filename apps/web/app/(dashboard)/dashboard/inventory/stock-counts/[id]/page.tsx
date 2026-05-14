import { getStockCountDetail } from "@/lib/actions/stock-count.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import InventoryWorkspaceNav from "@/components/dashboard/inventory/InventoryWorkspaceNav";
import StockCountDetailClient from "./StockCountDetailClient";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getStockCountDetail(id);
  if (!result.success || !result.data) {
    return { title: "Sayım Bulunamadı | MS Oto Servis" };
  }
  const count = result.data.count;
  const locationName = count.location?.name ?? "Tüm Lokasyonlar";
  return {
    title: `Sayım #${id.slice(-6).toUpperCase()} — ${locationName} | MS Oto Servis`,
  };
}

export default async function StockCountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getStockCountDetail(id);

  if (!result.success || !result.data) {
    if (result.error === "Stok sayımı bulunamadı.") {
      notFound();
    }
    return <PageError message={result.error || "Sayım yüklenemedi."} />;
  }

  const { count, summary } = result.data;
  const locationName = count.location?.name ?? "Tüm Lokasyonlar";

  return (
    <PageShell
      title={`Sayım #${id.slice(-6).toUpperCase()}`}
      subtitle={`${locationName} · ${count.items.length} kalem`}
      sectionLabel="Stok Sayımları"
    >
      <InventoryWorkspaceNav />
      <StockCountDetailClient count={count} summary={summary} />
    </PageShell>
  );
}
