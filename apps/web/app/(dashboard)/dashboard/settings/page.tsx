import { getTenantProfile, getTenantAnalytics } from "@/lib/actions/tenant.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import SettingsFormClient from "@/components/dashboard/settings/SettingsFormClient";

export const metadata = {
  title: "Firma Profili ve Ayarlar | MS Oto Servis"
};

export default async function SettingsPage() {
  const [profileRes, analyticsRes] = await Promise.all([
    getTenantProfile(),
    getTenantAnalytics()
  ]);

  if (profileRes.error) {
    return <PageError message={profileRes.error} />;
  }

  const initialData = profileRes.tenant || {};
  const metrics = analyticsRes.metrics || { staffCount: 0, monthlyVolume: 0, approvedItems: 0, rating: 0 };

  return (
    <PageShell
      title="Firma Profili & Ayarlar"
      subtitle="Firma bilgilerinizi güncelleyin, entegrasyon ayarlarınızı ve abonelik planınızı yönetin."
      sectionLabel="Yönetim"
    >
      <SettingsFormClient initialData={initialData} metrics={metrics} />
    </PageShell>
  );
}
