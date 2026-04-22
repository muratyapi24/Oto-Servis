import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import SubscriptionHub from "./components/SubscriptionHub";
import SubscriptionAnalytics from "./components/SubscriptionAnalytics";
import SubscriptionPerformance from "./components/SubscriptionPerformance";
import SubscriptionEnterprise from "./components/SubscriptionEnterprise";
import SubscriptionPro from "./components/SubscriptionPro";
import { getAllSubscriptions, getSubscriptionPlans } from "@/lib/actions/superadmin.actions";

export default async function SubscriptionsPage(props: { searchParams?: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "hub";

  const { subscriptions = [] } = await getAllSubscriptions();
  const { plans = [] } = await getSubscriptionPlans();

  return (
    <>
      <header className="h-12 bg-white flex items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">
              subscriptions
            </span>
            <h2 className="text-sm font-bold tracking-tight uppercase">
              {tab === "hub"
                ? "Abonelik Yönetimi"
                : tab === "analytics"
                ? "Abonelik Analitiği"
                : tab === "performance"
                ? "Performans & Tahmin"
                : tab === "enterprise"
                ? "Kurumsal (ENT) Plan Detayı"
                : tab === "pro"
                ? "Professional (PRO) Plan Detayı"
                : "Abonelik Yönetimi"}
            </h2>
          </div>
          <div className="h-4 w-px bg-outline/20"></div>
          {/* Sadece performance tab'ında Forecast Window seçimi gösterelim */}
          {tab === "performance" && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-outline uppercase">
                TAHMİN PENCERESİ:
              </span>
              <select className="bg-surface-container-low border-none rounded py-0.5 px-2 text-[10px] font-bold text-primary focus:ring-0 outline-none cursor-pointer">
                <option>SONRAKİ 90 GÜN</option>
                <option>MALİ YIL SONUNA KADAR</option>
              </select>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed rounded border border-tertiary-container/30 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-fixed-variant animate-pulse"></span>
            Durum: Optimal
          </div>
          {tab === "performance" && (
            <button className="flex items-center gap-1 px-3 py-1 bg-primary text-white rounded text-[10px] font-bold uppercase transition-colors hover:bg-primary/90">
              <span className="material-symbols-outlined text-sm">download</span> Dışa Aktar
            </button>
          )}
        </div>
      </header>

      <div className="bg-white border-b border-outline/20 px-6 flex items-center shrink-0 gap-1 overflow-x-auto no-scrollbar">
        <Link
          href="?tab=hub"
          className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${
            tab === "hub"
              ? "font-bold border-b-2 border-primary text-primary bg-primary/5"
              : "font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low"
          }`}
        >
          Abonelik Merkezi
        </Link>
        <Link
          href="?tab=analytics"
          className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${
            tab === "analytics"
              ? "font-bold border-b-2 border-primary text-primary bg-primary/5"
              : "font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low"
          }`}
        >
          Abonelik Analitiği
        </Link>
        <Link
          href="?tab=performance"
          className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${
            tab === "performance"
              ? "font-bold border-b-2 border-primary text-primary bg-primary/5"
              : "font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low"
          }`}
        >
          Performans & Tahmin
        </Link>
        <div className="h-4 w-px bg-outline/20 mx-2"></div>
        <Link
          href="?tab=enterprise"
          className={`px-4 py-2 text-xs transition-colors whitespace-nowrap flex items-center gap-1 ${
            tab === "enterprise"
              ? "font-bold border-b-2 border-primary text-primary bg-primary/5"
              : "font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
          Kurumsal Plan Detayı
        </Link>
        <Link
          href="?tab=pro"
          className={`px-4 py-2 text-xs transition-colors whitespace-nowrap flex items-center gap-1 ${
            tab === "pro"
              ? "font-bold border-b-2 border-primary text-primary bg-primary/5"
              : "font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-secondary-container inline-block"></span>
          Pro Plan Detayı
        </Link>
      </div>

      {tab === "hub" && <SubscriptionHub subscriptions={subscriptions} plans={plans} />}
      {tab === "analytics" && <SubscriptionAnalytics />}
      {tab === "performance" && <SubscriptionPerformance />}
      {tab === "enterprise" && <SubscriptionEnterprise />}
      {tab === "pro" && <SubscriptionPro />}

      <SuperAdminFooter />
    </>
  );
}
