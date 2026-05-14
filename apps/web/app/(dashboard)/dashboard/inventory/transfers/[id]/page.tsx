import { getStockTransfers } from "@/lib/actions/stock-transfer.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import InventoryWorkspaceNav from "@/components/dashboard/inventory/InventoryWorkspaceNav";
import TransferDetailClient from "./TransferDetailClient";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return {
    title: `Transfer #${id.slice(-6).toUpperCase()} | MS Oto Servis`,
  };
}

export default async function TransferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // getStockTransfers ile tüm transferleri çekip id'ye göre filtrele
  const result = await getStockTransfers({ pageSize: 200 });

  if (!result.success) {
    return <PageError message={result.error || "Transfer yüklenemedi."} />;
  }

  const transfer = (result.data?.transfers ?? []).find(
    (t: { id: string }) => t.id === id
  );

  if (!transfer) {
    notFound();
  }

  return (
    <PageShell
      title={`Transfer #${id.slice(-6).toUpperCase()}`}
      subtitle={`${transfer.fromLocation.name} → ${transfer.toLocation.name} · ${transfer.items.length} kalem`}
      sectionLabel="Stok Transferleri"
    >
      <InventoryWorkspaceNav />
      <TransferDetailClient transfer={transfer} />
    </PageShell>
  );
}
