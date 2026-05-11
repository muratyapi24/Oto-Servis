import PageShell, { PageError } from "@/components/dashboard/PageShell";
import { LocationsClient } from "@/components/dashboard/settings/LocationsClient";
import SettingsWorkspaceNav from "@/components/dashboard/settings/SettingsWorkspaceNav";
import { getConsolidatedReport, getLocations } from "@/lib/actions/location.actions";
import { guardTenantRole } from "@/lib/guards";

export const metadata = {
  title: "Şube & Lokasyonlar | MS Oto Servis",
};

export default async function SettingsLocationsPage() {
  const guard = await guardTenantRole(["TENANT_ADMIN"]);
  if ("error" in guard) {
    return <PageError message={guard.error} />;
  }

  const [locationsResult, reportResult] = await Promise.all([
    getLocations(),
    getConsolidatedReport(),
  ]);

  if ("error" in locationsResult) {
    return <PageError message={locationsResult.error ?? "Lokasyonlar yüklenemedi."} />;
  }

  const report = "error" in reportResult ? null : reportResult;

  return (
    <PageShell
      title="Şube & Lokasyonlar"
      subtitle="Stok, randevu ve servis hareketlerinde kullanılan şube yapılandırmasını yönetin."
      sectionLabel="Ayarlar"
    >
      <SettingsWorkspaceNav />
      <LocationsClient locations={locationsResult.locations ?? []} report={report} />
    </PageShell>
  );
}
