import { getStockTransfers } from "@/lib/actions/stock-transfer.actions";
import { getLocations } from "@/lib/actions/location.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import TransferList from "@/components/dashboard/inventory/TransferList";
import Link from "next/link";
import { Plus, ArrowRightLeft } from "lucide-react";

export const metadata = {
  title: "Stok Transferleri | MS Oto Servis",
};

export default async function StockTransfersPage() {
  const [transfersResult, locationsResult] = await Promise.all([
    getStockTransfers({ pageSize: 100 }),
    getLocations(),
  ]);

  if (!transfersResult.success) {
    return (
      <PageError message={transfersResult.error || "Transferler yüklenemedi."} />
    );
  }

  const transfers = transfersResult.data?.transfers ?? [];
  const total = transfersResult.data?.total ?? 0;
  const locations = (locationsResult.locations ?? []).map((l: any) => ({
    id: l.id,
    name: l.name,
  }));

  const pendingCount = transfers.filter(
    (t: any) => t.status === "PENDING"
  ).length;
  const approvedCount = transfers.filter(
    (t: any) => t.status === "APPROVED"
  ).length;
  const completedCount = transfers.filter(
    (t: any) => t.status === "COMPLETED"
  ).length;
  const rejectedCount = transfers.filter(
    (t: any) => t.status === "REJECTED"
  ).length;

  return (
    <PageShell
      title="Stok Transferleri"
      subtitle="Lokasyonlar arası parça transfer taleplerini yönetin, onaylayın veya reddedin."
      sectionLabel="Stok & Envanter"
      actions={
        <Link
          href="/dashboard/inventory/transfers/new"
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Yeni Transfer
        </Link>
      }
    >
      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(
          [
            { label: "Toplam", count: total, color: "text-slate-900" },
            { label: "Bekliyor", count: pendingCount, color: "text-amber-600" },
            {
              label: "Tamamlandı",
              count: completedCount,
              color: "text-emerald-600",
            },
            { label: "Reddedildi", count: rejectedCount, color: "text-red-600" },
          ] as const
        ).map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-1"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {item.label}
            </span>
            <span className={`text-3xl font-black ${item.color}`}>
              {item.count}
            </span>
          </div>
        ))}
      </div>

      {transfers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <ArrowRightLeft className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-black text-slate-700 mb-2">
            Henüz transfer yok
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            İlk stok transfer talebini oluşturun.
          </p>
          <Link
            href="/dashboard/inventory/transfers/new"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all"
          >
            <Plus className="w-4 h-4" />
            Yeni Transfer Talebi
          </Link>
        </div>
      ) : (
        <TransferList transfers={transfers} total={total} locations={locations} />
      )}
    </PageShell>
  );
}
