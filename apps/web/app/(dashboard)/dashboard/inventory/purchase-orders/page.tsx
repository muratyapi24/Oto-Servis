import { getPurchaseOrders } from "@/lib/actions/purchase-order.actions";
import { getSuppliers } from "@/lib/actions/supplier.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import InventoryWorkspaceNav from "@/components/dashboard/inventory/InventoryWorkspaceNav";
import PurchaseOrderList from "@/components/dashboard/inventory/PurchaseOrderList";
import Link from "next/link";
import { Plus, ShoppingCart } from "lucide-react";

export const metadata = {
  title: "Satın Alma Siparişleri | MS Oto Servis",
};

type PurchaseOrderSupplierOption = {
  id: string;
  name: string;
};

export default async function PurchaseOrdersPage() {
  const [poResult, suppliersResult] = await Promise.all([
    getPurchaseOrders({ pageSize: 100 }),
    getSuppliers(),
  ]);

  if (poResult.error) {
    return <PageError message={poResult.error} />;
  }

  const orders = poResult.data?.orders ?? [];
  const total = poResult.data?.total ?? 0;
  const suppliers = suppliersResult.suppliers ?? [];

  return (
    <PageShell
      title="Satın Alma Siparişleri"
      subtitle="Tedarikçi siparişlerini oluşturun, takip edin ve teslim alın."
      sectionLabel="Stok & Envanter"
      actions={
        <Link
          href="/dashboard/inventory/purchase-orders/new"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Yeni Sipariş
        </Link>
      }
    >
      <InventoryWorkspaceNav />
      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {(
          [
            { status: "ALL", label: "Toplam", count: total },
            {
              status: "DRAFT",
              label: "Taslak",
              count: orders.filter((o) => o.status === "DRAFT").length,
              color: "text-slate-600",
            },
            {
              status: "SENT",
              label: "Gönderildi",
              count: orders.filter((o) => o.status === "SENT").length,
              color: "text-blue-600",
            },
            {
              status: "PARTIALLY_RECEIVED",
              label: "Kısmi Teslim",
              count: orders.filter((o) => o.status === "PARTIALLY_RECEIVED")
                .length,
              color: "text-amber-600",
            },
            {
              status: "RECEIVED",
              label: "Teslim Alındı",
              count: orders.filter((o) => o.status === "RECEIVED").length,
              color: "text-emerald-600",
            },
          ] as const
        ).map((item) => (
          <div
            key={item.status}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-1"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {item.label}
            </span>
            <span
              className={`text-3xl font-black ${"color" in item ? item.color : "text-slate-900"}`}
            >
              {item.count}
            </span>
          </div>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <ShoppingCart className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-black text-slate-700 mb-2">
            Henüz sipariş yok
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            İlk satın alma siparişinizi oluşturun.
          </p>
          <Link
            href="/dashboard/inventory/purchase-orders/new"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all"
          >
            <Plus className="w-4 h-4" />
            Yeni Sipariş Oluştur
          </Link>
        </div>
      ) : (
        <PurchaseOrderList
          orders={orders}
          total={total}
          suppliers={suppliers.map((s: PurchaseOrderSupplierOption) => ({ id: s.id, name: s.name }))}
        />
      )}
    </PageShell>
  );
}
