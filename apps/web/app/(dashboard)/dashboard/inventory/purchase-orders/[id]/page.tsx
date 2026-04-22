import { getPurchaseOrderById } from "@/lib/actions/purchase-order.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import PODetailClient from "./PODetailClient";
import Link from "next/link";
import { ArrowLeft, ShoppingCart } from "lucide-react";
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
      actions={
        <Link
          href="/dashboard/inventory/purchase-orders"
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Siparişlere Dön
        </Link>
      }
    >
      <PODetailClient order={order} />
    </PageShell>
  );
}
