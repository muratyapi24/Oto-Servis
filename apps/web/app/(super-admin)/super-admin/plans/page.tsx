import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getSubscriptionPlans } from "@/lib/actions/superadmin.actions";
import PlanCreateForm from "./PlanCreateForm";

export default async function PlansPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "list";

  const result = await getSubscriptionPlans();
  const plans = "plans" in result && result.plans ? result.plans : [];

  const TABS = [
    { id: "list", label: "Paket Listesi" },
    { id: "new", label: "Yeni Paket" },
  ];

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">
            inventory_2
          </span>
          <h2 className="text-sm font-bold tracking-tight uppercase">
            Abonelik Paketleri
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-outline">
            {plans.length} paket
          </span>
        </div>
      </header>

      <nav className="bg-white border-b border-outline/20 px-6 flex items-center shrink-0 gap-1">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`?tab=${t.id}`}
            className={
              tab === t.id
                ? "px-4 py-2 text-xs font-bold border-b-2 border-primary text-primary bg-primary/5"
                : "px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low"
            }
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "list" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <table className="dense-table w-full">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline/10">
                  <th className="text-left px-4 py-2 text-[10px] font-bold uppercase text-outline">
                    Paket Adı
                  </th>
                  <th className="text-right px-4 py-2 text-[10px] font-bold uppercase text-outline">
                    Aylık Fiyat
                  </th>
                  <th className="text-right px-4 py-2 text-[10px] font-bold uppercase text-outline">
                    Yıllık Fiyat
                  </th>
                  <th className="text-center px-4 py-2 text-[10px] font-bold uppercase text-outline">
                    Deneme Süresi
                  </th>
                  <th className="text-center px-4 py-2 text-[10px] font-bold uppercase text-outline">
                    Durum
                  </th>
                  <th className="text-center px-4 py-2 text-[10px] font-bold uppercase text-outline">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {plans.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-xs text-outline"
                    >
                      Henüz paket bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  plans.map((plan) => (
                    <tr
                      key={plan.id}
                      className="border-b border-outline/5 hover:bg-surface-container-low transition-colors"
                    >
                      <td className="px-4 py-2">
                        <div className="text-xs font-semibold text-on-surface">
                          {plan.name}
                        </div>
                        {plan.description && (
                          <div className="text-[10px] text-outline mt-0.5 truncate max-w-xs">
                            {plan.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-xs font-mono text-on-surface">
                        ₺{plan.priceMonthly.toLocaleString("tr-TR")}
                      </td>
                      <td className="px-4 py-2 text-right text-xs font-mono text-on-surface">
                        {plan.priceYearly != null
                          ? `₺${plan.priceYearly.toLocaleString("tr-TR")}`
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-center text-xs text-on-surface">
                        {plan.trialDays ?? 0} gün
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            plan.isActive
                              ? "bg-tertiary-fixed text-on-tertiary-fixed"
                              : "bg-error/10 text-error"
                          }`}
                        >
                          {plan.isActive ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Link
                          href={`?tab=edit&planId=${plan.id}`}
                          className="text-[10px] font-bold text-primary hover:underline"
                        >
                          Düzenle
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "new" && (
          <div className="max-w-lg">
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-outline/10 bg-surface-container-low">
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                  Yeni Paket Oluştur
                </h3>
              </div>
              <div className="p-4">
                <PlanCreateForm />
              </div>
            </div>
          </div>
        )}
      </div>

      <SuperAdminFooter />
    </>
  );
}
