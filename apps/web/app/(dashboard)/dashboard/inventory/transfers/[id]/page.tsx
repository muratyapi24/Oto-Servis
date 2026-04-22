import { getStockTransfers } from "@/lib/actions/stock-transfer.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import TransferDetailClient from "./TransferDetailClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getStockTransfers({ pageSize: 1 });
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
    (t: any) => t.id === id
  );

  if (!transfer) {
    notFound();
  }

  return (
    <PageShell
      title={`Transfer #${id.slice(-6).toUpperCase()}`}
      subtitle={`${transfer.fromLocation.name} → ${transfer.toLocation.name} · ${transfer.items.length} kalem`}
      sectionLabel="Stok Transferleri"
      actions={
        <Link
          href="/dashboard/inventory/transfers"
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Transferlere Dön
        </Link>
      }
    >
      <TransferDetailClient transfer={transfer} />
    </PageShell>
  );
}
