import { getInventoryDashboard } from "@/lib/actions/inventory.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import InventoryBoardClient from "@/components/dashboard/inventory/InventoryBoardClient";
import StockMovementsTab from "@/components/dashboard/inventory/StockMovementsTab";

export const metadata = {
  title: "Stok ve Envanter Yönetimi | MS Oto Servis"
};

export default async function InventoryPage() {
  const dashResponse = await getInventoryDashboard();

  if (dashResponse.error) {
    return <PageError message={dashResponse.error} />;
  }

  const data = {
    metrics: dashResponse.metrics || { totalPartsTypes: 0, totalItems: 0, totalStockValue: 0, lowStockCount: 0 },
    lowStockItems: dashResponse.lowStockItems || [],
    allParts: dashResponse.allParts || [],
    categories: dashResponse.categories || [],
    recentMovements: dashResponse.recentMovements || []
  };

  return (
    <PageShell
      title="Stok & Envanter"
      subtitle="Depo stok seviyelerini, parça hareketlerini ve sipariş ihtiyaçlarını takip edin."
      sectionLabel="Garaj ve Depo"
    >
      <InventoryBoardClient data={data} />
      <div className="mt-8">
        <StockMovementsTab />
      </div>
    </PageShell>
  );
}
