import { getParts } from "@/lib/actions/inventory.actions";
import { getSuppliers } from "@/lib/actions/supplier.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import NewPurchaseOrderForm from "./NewPurchaseOrderForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Yeni Satın Alma Siparişi | MS Oto Servis",
};

export default async function NewPurchaseOrderPage() {
  const [partsResult, suppliersResult] = await Promise.all([
    getParts(),
    getSuppliers(),
  ]);

  if (partsResult.error) {
    return <PageError message={partsResult.error} />;
  }

  const parts = (partsResult.parts ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    partNumber: p.partNumber,
    unit: p.unit,
    purchasePrice: Number(p.purchasePrice),
  }));

  const suppliers = (suppliersResult.suppliers ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    email: s.email ?? null,
  }));

  return (
    <PageShell
      title="Yeni Satın Alma Siparişi"
      subtitle="Tedarikçi seçin, parça ekleyin ve sipariş oluşturun."
      sectionLabel="Stok & Envanter"
      actions={
        <Link
          href="/dashboard/inventory/purchase-orders"
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri Dön
        </Link>
      }
    >
      <NewPurchaseOrderForm parts={parts} suppliers={suppliers} />
    </PageShell>
  );
}
