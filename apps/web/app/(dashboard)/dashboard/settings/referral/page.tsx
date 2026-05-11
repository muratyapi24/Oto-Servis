import { getReferralInfo } from "@/lib/actions/referral.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import SettingsWorkspaceNav from "@/components/dashboard/settings/SettingsWorkspaceNav";
import { ReferralWidget } from "./ReferralWidget";

export const metadata = {
  title: "Referral Programı | MS Oto Servis",
};

export default async function ReferralPage() {
  const data = await getReferralInfo();
  if ("error" in data) return <PageError message={data.error ?? "Referral bilgileri yüklenemedi."} />;

  return (
    <PageShell
      title="Referral Programı"
      subtitle="Davet linkinizi paylaşın ve abonelik kredilerinizi takip edin."
      sectionLabel="Ayarlar"
    >
      <SettingsWorkspaceNav />
      <ReferralWidget {...data} />
    </PageShell>
  );
}
