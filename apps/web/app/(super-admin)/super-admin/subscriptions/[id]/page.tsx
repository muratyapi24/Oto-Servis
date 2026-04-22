import Link from "next/link";
import { redirect } from "next/navigation";
import SuperAdminFooter from "@/components/super-admin/Footer";
import {
  getSubscriptionById,
  getSubscriptionPlans,
} from "@/lib/actions/superadmin.actions";
import SubscriptionEditForm from "./SubscriptionEditForm";

export default async function SubscriptionDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "general";

  const result = await getSubscriptionById(params.id);
  if ("error" in result || !result.subscription) {
    redirect("/super-admin/subscriptions");
  }

  const { subscription } = result;
  const tenant = subscription.tenant as {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    status: string;
  } | null;

  const plansResult = await getSubscriptionPlans();
  const plans = "plans" in plansResult && plansResult.plans ? plansResult.plans : [];

  const TABS = [
    { id: "general", label: "Genel Bilgi" },
    { id: "payments", label: "Ödeme Geçmişi" },
    { id: "edit", label: "Düzenle" },
  ];

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">
            subscriptions
          </span>
          <h2 className="text-sm font-bold tracking-tight uppercase">
            Abonelik Detayı
          </h2>
          <span className="text-outline/40 mx-1">/</span>
          <span className="text-xs text-outline font-mono">{params.id.slice(0, 8)}…</span>
        </div>
        <Link
          href="/super-admin/subscriptions"
          className="flex items-center gap-1 text-xs text-outline hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Abonelikler
        </Link>
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
        {tab === "general" && (
          <div className="max-w-2xl space-y-4">
            {/* Tenant & Subscription Info Card */}
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm border-l-2 border-l-primary overflow-hidden">
              <div className="px-4 py-3 border-b border-outline/10 bg-surface-container-low">
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                  Abonelik Bilgileri
                </h3>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase text-outline mb-1">
                    Firma Adı
                  </p>
                  <p className="text-sm font-semibold text-on-surface">
                    {tenant?.name ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-outline mb-1">
                    E-posta
                  </p>
                  <p className="text-sm text-on-surface font-mono">
                    {tenant?.email ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-outline mb-1">
                    Telefon
                  </p>
                  <p className="text-sm text-on-surface">
                    {tenant?.phone ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-outline mb-1">
                    Plan Adı
                  </p>
                  <p className="text-sm font-semibold text-on-surface">
                    {subscription.plan?.name ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-outline mb-1">
                    Durum
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      subscription.status === "ACTIVE"
                        ? "bg-tertiary-fixed text-on-tertiary-fixed"
                        : subscription.status === "TRIAL"
                        ? "bg-primary/10 text-primary"
                        : subscription.status === "CANCELLED"
                        ? "bg-error/10 text-error"
                        : "bg-outline/10 text-outline"
                    }`}
                  >
                    {subscription.status}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-outline mb-1">
                    Başlangıç Tarihi
                  </p>
                  <p className="text-sm text-on-surface font-mono">
                    {new Date(subscription.startDate).toLocaleString("tr-TR")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-outline mb-1">
                    Dönem Sonu
                  </p>
                  <p className="text-sm text-on-surface font-mono">
                    {subscription.currentPeriodEnd
                      ? new Date(subscription.currentPeriodEnd).toLocaleString("tr-TR")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-outline mb-1">
                    Aylık Ücret
                  </p>
                  <p className="text-sm font-semibold text-on-surface">
                    {subscription.plan?.priceMonthly != null
                      ? `₺${subscription.plan.priceMonthly.toLocaleString("tr-TR")}`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "payments" && (
          <div className="max-w-3xl">
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-outline/10 bg-surface-container-low">
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                  Ödeme Geçmişi
                </h3>
              </div>
              <div className="p-8 text-center text-outline text-xs">
                <span className="material-symbols-outlined text-3xl mb-2 block">
                  receipt_long
                </span>
                Ödeme geçmişi henüz mevcut değil.
              </div>
            </div>
          </div>
        )}

        {tab === "edit" && (
          <div className="max-w-lg">
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-outline/10 bg-surface-container-low">
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                  Aboneliği Düzenle
                </h3>
              </div>
              <div className="p-4">
                <SubscriptionEditForm
                  subscriptionId={params.id}
                  currentPlanId={subscription.planId}
                  currentStatus={subscription.status}
                  plans={plans}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <SuperAdminFooter />
    </>
  );
}
