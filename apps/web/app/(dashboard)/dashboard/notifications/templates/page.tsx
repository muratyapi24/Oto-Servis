import { getNotificationTemplates } from "@/lib/actions/template.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import TemplatesClient from "./TemplatesClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Bildirim Şablonları | MS Oto Servis",
};

export default async function NotificationTemplatesPage() {
  const result = await getNotificationTemplates();

  if (!result.success) {
    return <PageError message={result.error ?? "Şablonlar yüklenemedi."} />;
  }

  const templates = (result.data?.templates ?? []) as any[];

  return (
    <PageShell
      title="Bildirim Şablonları"
      subtitle="Müşterilere gönderilen mesaj şablonlarını özelleştirin."
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
      <TemplatesClient templates={templates} />
    </PageShell>
  );
}
