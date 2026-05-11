import { prisma } from "@repo/database";
import { auth } from "@/auth";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import NotificationListClient from "./NotificationListClient";
import NotificationWorkspaceNav from "@/components/dashboard/notifications/NotificationWorkspaceNav";
import type { NotificationListItem } from "@/components/dashboard/notifications/types";

export const metadata = {
  title: "Bildirimler | MS Oto Servis",
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.tenantId) return <PageError message="Yetkisiz erişim." />;

  const tenantId = session.user.tenantId;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { tenantId },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, companyName: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.count({ where: { tenantId } }),
  ]);

  // Son 7 günün başarı oranı
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [recentTotal, recentSent] = await Promise.all([
    prisma.notification.count({
      where: { tenantId, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.notification.count({
      where: { tenantId, createdAt: { gte: sevenDaysAgo }, status: "SENT" },
    }),
  ]);

  const successRate = recentTotal > 0 ? Math.round((recentSent / recentTotal) * 100) : 0;
  const serializedNotifications = JSON.parse(JSON.stringify(notifications)) as NotificationListItem[];

  return (
    <PageShell
      title="Bildirimler"
      subtitle="Gönderilen bildirimlerin geçmişini görüntüleyin ve yönetin."
      sectionLabel="İletişim"
    >
      <NotificationWorkspaceNav />

      {/* Özet Kart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Toplam Bildirim</span>
          <span className="text-3xl font-black text-slate-900 block mt-1">{total}</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Son 7 Gün Başarı</span>
          <span className={`text-3xl font-black block mt-1 ${successRate >= 80 ? "text-emerald-600" : successRate >= 50 ? "text-amber-600" : "text-red-600"}`}>
            %{successRate}
          </span>
          <p className="text-xs text-slate-400 mt-1">{recentSent}/{recentTotal} gönderildi</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kanallar</span>
          <div className="flex gap-2 mt-2 flex-wrap">
            {["SMS", "WHATSAPP", "EMAIL", "IN_APP"].map((ch) => (
              <span key={ch} className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                {ch}
              </span>
            ))}
          </div>
        </div>
      </div>

      <NotificationListClient
        notifications={serializedNotifications}
        total={total}
      />
    </PageShell>
  );
}
