import { getNotificationProviders } from "@/lib/actions/notification-provider.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import type { NotificationProviderListItem } from "@/components/dashboard/notifications/types";
import SettingsWorkspaceNav from "@/components/dashboard/settings/SettingsWorkspaceNav";
import NotificationSettingsClient from "./NotificationSettingsClient";

export const metadata = {
  title: "Bildirim Sağlayıcıları | MS Oto Servis",
};

export default async function NotificationSettingsPage() {
  const result = await getNotificationProviders();

  if (!result.success) {
    return <PageError message={result.error ?? "Sağlayıcılar yüklenemedi."} />;
  }

  const providers = (result.data?.providers ?? []) as NotificationProviderListItem[];

  return (
    <PageShell
      title="Bildirim Sağlayıcıları"
      subtitle="SMS, WhatsApp ve e-posta sağlayıcılarını yapılandırın."
      sectionLabel="Ayarlar"
    >
      <SettingsWorkspaceNav />
      <NotificationSettingsClient providers={providers} />
    </PageShell>
  );
}
