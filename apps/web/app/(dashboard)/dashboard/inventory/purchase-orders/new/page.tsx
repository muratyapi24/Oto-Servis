import { getParts } from "@/lib/actions/inventory.actions";
import { getSuppliers } from "@/lib/actions/supplier.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import InventoryWorkspaceNav from "@/components/dashboard/inventory/InventoryWorkspaceNav";
import NewPurchaseOrderForm from "./NewPurchaseOrderForm";

export const metadata = {
  title: "Yeni Satın Alma Siparişi | MS Oto Servis",
};

type PurchaseOrderPartOption = {
  id: string;
  name: string;
  partNumber: string | null;
  unit: string;
  purchasePrice: unknown;
};

type PurchaseOrderSupplierOption = {
  id: string;
  name: string;
  email: string | null;
};

export default async function NewPurchaseOrderPage() {
  const [partsResult, suppliersResult] = await Promise.all([
    getParts(),
    getSuppliers(),
  ]);

  if (partsResult.error) {
    return <PageError message={partsResult.error} />;
  }

  const parts = (partsResult.parts ?? []).map((p: PurchaseOrderPartOption) => ({
    id: p.id,
    name: p.name,
    partNumber: p.partNumber ?? "",
    unit: p.unit,
    purchasePrice: Number(p.purchasePrice),
  }));

  const suppliers = (suppliersResult.suppliers ?? []).map((s: PurchaseOrderSupplierOption) => ({
    id: s.id,
    name: s.name,
    email: s.email ?? null,
  }));

  return (
    <PageShell
      title="Yeni Satın Alma Siparişi"
      subtitle="Tedarikçi seçin, parça ekleyin ve sipariş oluşturun."
      sectionLabel="Stok & Envanter"
    >
      <InventoryWorkspaceNav />
      <NewPurchaseOrderForm parts={parts} suppliers={suppliers} />
    </PageShell>
  );
}
