import { getBulkCampaigns } from "@/lib/actions/bulk-notification.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import NotificationWorkspaceNav from "@/components/dashboard/notifications/NotificationWorkspaceNav";
import type { BulkCampaignListItem } from "@/components/dashboard/notifications/types";
import BulkNotificationClient from "./BulkNotificationClient";

export const metadata = {
  title: "Toplu Bildirim | MS Oto Servis",
};

export default async function BulkNotificationPage() {
  const result = await getBulkCampaigns();

  if (!result.success) {
    return <PageError message={result.error ?? "Kampanyalar yüklenemedi."} />;
  }

  const campaigns = (result.data?.campaigns ?? []) as BulkCampaignListItem[];

  return (
    <PageShell
      title="Toplu Bildirim"
      subtitle="Müşteri segmentlerine toplu mesaj gönderin."
      sectionLabel="Bildirimler"
    >
      <NotificationWorkspaceNav />
      <BulkNotificationClient campaigns={campaigns} />
    </PageShell>
  );
}
