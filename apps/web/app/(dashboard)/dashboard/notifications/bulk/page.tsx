import { getBulkCampaigns } from "@/lib/actions/bulk-notification.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import BulkNotificationClient from "./BulkNotificationClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Toplu Bildirim | MS Oto Servis",
};

export default async function BulkNotificationPage() {
  const result = await getBulkCampaigns();

  if (!result.success) {
    return <PageError message={result.error ?? "Kampanyalar yüklenemedi."} />;
  }

  const campaigns = (result.data?.campaigns ?? []) as any[];

  return (
    <PageShell
      title="Toplu Bildirim"
      subtitle="Müşteri segmentlerine toplu mesaj gönderin."
      sectionLabel="Bildirimler"
      actions={
        <Link
          href="/dashboard/notifications"
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri Dön
        </Link>
      }
    >
      <BulkNotificationClient campaigns={campaigns} />
    </PageShell>
  );
}
