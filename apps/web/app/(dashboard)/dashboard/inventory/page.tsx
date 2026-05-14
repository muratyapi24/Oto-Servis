import { getInventoryDashboard } from "@/lib/actions/inventory.actions";
import { getSuppliers } from "@/lib/actions/supplier.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import InventoryBoardClient from "@/components/dashboard/inventory/InventoryBoardClient";
import InventoryWorkspaceNav from "@/components/dashboard/inventory/InventoryWorkspaceNav";
import StockMovementsTab from "@/components/dashboard/inventory/StockMovementsTab";

export const metadata = {
  title: "Stok ve Envanter Yönetimi | MS Oto Servis"
};

type SupplierOption = {
  id: string;
  name: string;
};

export default async function InventoryPage() {
  const [dashResponse, supplierResponse] = await Promise.all([
    getInventoryDashboard(),
    getSuppliers(),
  ]);

  if (dashResponse.error) {
    return <PageError message={dashResponse.error} />;
  }

  const suppliers = ("suppliers" in supplierResponse ? supplierResponse.suppliers : []) || [];

  const data = {
    metrics: dashResponse.metrics || { totalPartsTypes: 0, totalItems: 0, totalStockValue: 0, lowStockCount: 0 },
    lowStockItems: dashResponse.lowStockItems || [],
    allParts: dashResponse.allParts || [],
    categories: dashResponse.categories || [],
    recentMovements: dashResponse.recentMovements || [],
    suppliers: suppliers.map((s: SupplierOption) => ({ id: s.id, name: s.name })),
  };

  return (
    <PageShell
      title="Stok & Envanter"
      subtitle="Depo stok seviyelerini, parça hareketlerini ve sipariş ihtiyaçlarını takip edin."
      sectionLabel="Garaj ve Depo"
    >
      <InventoryWorkspaceNav />
      <InventoryBoardClient data={data} />
      <div className="mt-8">
        <StockMovementsTab />
      </div>
    </PageShell>
  );
}
