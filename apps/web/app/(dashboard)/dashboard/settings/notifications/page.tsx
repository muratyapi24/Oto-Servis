import { getNotificationProviders } from "@/lib/actions/notification-provider.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import NotificationSettingsClient from "./NotificationSettingsClient";

export const metadata = {
  title: "Bildirim Sağlayıcıları | MS Oto Servis",
};

export default async function NotificationSettingsPage() {
  const result = await getNotificationProviders();

  if (!result.success) {
    return <PageError message={result.error ?? "Sağlayıcılar yüklenemedi."} />;
  }

  const providers = (result.data?.providers ?? []) as any[];

  return (
    <PageShell
      title="Bildirim Sağlayıcıları"
      subtitle="SMS, WhatsApp ve e-posta sağlayıcılarını yapılandırın."
      sectionLabel="Ayarlar"
    >
      <NotificationSettingsClient providers={providers} />
    </PageShell>
  );
}
