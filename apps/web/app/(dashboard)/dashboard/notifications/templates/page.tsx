import { getNotificationTemplates } from "@/lib/actions/template.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import NotificationWorkspaceNav from "@/components/dashboard/notifications/NotificationWorkspaceNav";
import type { NotificationTemplateListItem } from "@/components/dashboard/notifications/types";
import TemplatesClient from "./TemplatesClient";

export const metadata = {
  title: "Bildirim Şablonları | MS Oto Servis",
};

export default async function NotificationTemplatesPage() {
  const result = await getNotificationTemplates();

  if (!result.success) {
    return <PageError message={result.error ?? "Şablonlar yüklenemedi."} />;
  }

  const templates = (result.data?.templates ?? []) as NotificationTemplateListItem[];

  return (
    <PageShell
      title="Bildirim Şablonları"
      subtitle="Müşterilere gönderilen mesaj şablonlarını özelleştirin."
      sectionLabel="Bildirimler"
    >
      <NotificationWorkspaceNav />
      <TemplatesClient templates={templates} />
    </PageShell>
  );
}
