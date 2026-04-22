import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import {
  getExpandedTenants,
  getSubscriptionPlans,
} from "@/lib/actions/superadmin.actions";
import NewSubscriptionForm from "./NewSubscriptionForm";

export default async function NewSubscriptionPage() {
  const [tenantsResult, plansResult] = await Promise.all([
    getExpandedTenants(),
    getSubscriptionPlans(),
  ]);

  const tenants = "tenants" in tenantsResult && tenantsResult.tenants ? tenantsResult.tenants : [];
  const plans = "plans" in plansResult && plansResult.plans ? plansResult.plans : [];

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">
            add_circle
          </span>
          <h2 className="text-sm font-bold tracking-tight uppercase">
            Yeni Abonelik Oluştur
          </h2>
        </div>
        <Link
          href="/super-admin/subscriptions"
          className="flex items-center gap-1 text-xs text-outline hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Abonelikler
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg">
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-outline/10 bg-surface-container-low">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Abonelik Bilgileri
              </h3>
            </div>
            <div className="p-4">
              <NewSubscriptionForm tenants={tenants} plans={plans} />
            </div>
          </div>
        </div>
      </div>

      <SuperAdminFooter />
    </>
  );
}
