import { getAccountingIntegration } from "@/lib/actions/accounting.actions";
import AccountingSettingsClient from "./AccountingSettingsClient";
import PageShell from "@/components/dashboard/PageShell";

export const metadata = {
  title: "Muhasebe Entegrasyon Ayarları | MS Oto Servis"
};

export default async function AccountingSettingsPage() {
  const { integration } = await getAccountingIntegration();

  return (
    <PageShell
      title="Muhasebe Entegrasyonu"
      subtitle="Paraşüt ve diğer muhasebe uygulamaları bağlantı ayarlarınız."
      sectionLabel="Ayarlar"
    >
      <div className="max-w-2xl mt-4">
        <AccountingSettingsClient initialData={integration} />
      </div>
    </PageShell>
  );
}
