import { getMySubscription } from "@/lib/actions/subscription.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import BillingClient, { type BillingPlan } from "@/components/dashboard/settings/BillingClient";
import SettingsWorkspaceNav from "@/components/dashboard/settings/SettingsWorkspaceNav";

export const metadata = {
  title: "Abonelik & Fatura | OtoServis",
  description: "Abonelik paketinizi yönetin, kullanım durumunuzu kontrol edin ve paketinizi yükseltin.",
};

export default async function BillingPage() {
  const result = await getMySubscription();

  if (result.error) {
    return <PageError message={result.error} />;
  }

  return (
    <PageShell
      title="Abonelik & Fatura"
      subtitle="Paketinizi yönetin, kullanım durumunuzu takip edin ve planınızı yükseltin."
      sectionLabel="Ayarlar"
    >
      <SettingsWorkspaceNav />
      <BillingClient
        subscription={result.subscription ?? null}
        currentPlan={result.currentPlan ?? null}
        usage={result.usage ?? null}
        plans={(result.plans ?? []) as BillingPlan[]}
      />
    </PageShell>
  );
}
