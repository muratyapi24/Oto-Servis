import { getStockCounts } from "@/lib/actions/stock-count.actions";
import { getLocations } from "@/lib/actions/location.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import InventoryWorkspaceNav from "@/components/dashboard/inventory/InventoryWorkspaceNav";
import StockCountList from "@/components/dashboard/inventory/StockCountList";
import Link from "next/link";
import { Plus, ClipboardList } from "lucide-react";

export const metadata = {
  title: "Stok Sayımları | MS Oto Servis",
};

type LocationOption = {
  id: string;
  name: string;
};

type StockCountSummary = {
  status: string;
};

export default async function StockCountsPage() {
  const [countsResult, locationsResult] = await Promise.all([
    getStockCounts({ pageSize: 100 }),
    getLocations(),
  ]);

  if (!countsResult.success) {
    return <PageError message={countsResult.error || "Sayımlar yüklenemedi."} />;
  }

  const counts = countsResult.data?.counts ?? [];
  const total = countsResult.data?.total ?? 0;
  const locations = ('locations' in locationsResult ? locationsResult.locations ?? [] : []).map((l: LocationOption) => ({
    id: l.id,
    name: l.name,
  }));

  const draftCount = counts.filter((c: StockCountSummary) => c.status === "DRAFT").length;
  const inProgressCount = counts.filter(
    (c: StockCountSummary) => c.status === "IN_PROGRESS"
  ).length;
  const completedCount = counts.filter(
    (c: StockCountSummary) => c.status === "COMPLETED"
  ).length;

  return (
    <PageShell
      title="Stok Sayımları"
      subtitle="Periyodik envanter sayımı yapın, fark raporlarını görüntüleyin ve stok düzeltmelerini onaylayın."
      sectionLabel="Stok & Envanter"
      actions={
        <Link
          href="/dashboard/inventory/stock-counts/new"
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Yeni Sayım
        </Link>
      }
    >
      <InventoryWorkspaceNav />
      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(
          [
            { label: "Toplam", count: total, color: "text-slate-900" },
            { label: "Taslak", count: draftCount, color: "text-slate-600" },
            {
              label: "Devam Ediyor",
              count: inProgressCount,
              color: "text-blue-600",
            },
            {
              label: "Tamamlandı",
              count: completedCount,
              color: "text-emerald-600",
            },
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

      {counts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <ClipboardList className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-black text-slate-700 mb-2">
            Henüz sayım yok
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            İlk stok sayımınızı başlatın.
          </p>
          <Link
            href="/dashboard/inventory/stock-counts/new"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all"
          >
            <Plus className="w-4 h-4" />
            Yeni Sayım Başlat
          </Link>
        </div>
      ) : (
        <StockCountList counts={counts} total={total} locations={locations} />
      )}
    </PageShell>
  );
}
