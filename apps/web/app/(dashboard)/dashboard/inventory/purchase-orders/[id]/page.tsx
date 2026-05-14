import { getPurchaseOrderById } from "@/lib/actions/purchase-order.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import InventoryWorkspaceNav from "@/components/dashboard/inventory/InventoryWorkspaceNav";
import PODetailClient from "./PODetailClient";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getPurchaseOrderById(id);
  if (!result.success || !result.data) {
    return { title: "Sipariş Bulunamadı | MS Oto Servis" };
  }
  return {
    title: `${result.data.order.poNumber} | Satın Alma Siparişi | MS Oto Servis`,
  };
}

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getPurchaseOrderById(id);

  if (!result.success || !result.data) {
    if (result.error === "Satın alma siparişi bulunamadı.") {
      notFound();
    }
    return <PageError message={result.error || "Sipariş yüklenemedi."} />;
  }

  const order = result.data.order;

  return (
    <PageShell
      title={order.poNumber}
      subtitle={`${order.supplier.name} · ${order.items.length} kalem`}
      sectionLabel="Satın Alma Siparişleri"
    >
      <InventoryWorkspaceNav />
      <PODetailClient order={order} />
    </PageShell>
  );
}
