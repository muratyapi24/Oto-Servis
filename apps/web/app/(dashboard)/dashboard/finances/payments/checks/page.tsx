import { prisma } from "@repo/database";
import { auth } from "@/auth";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import ChecksClient from "@/components/dashboard/finances/ChecksClient";
import FinanceWorkspaceNav from "@/components/dashboard/finances/FinanceWorkspaceNav";
import { getUpcomingCheckPayments } from "@/lib/actions/payment.actions";

export const metadata = {
  title: "Çek/Senet Takibi | MS Oto Servis",
};

export default async function ChecksPage() {
  const session = await auth();
  if (!session?.user?.tenantId) return <PageError message="Yetkisiz erişim." />;

  const tenantId = session.user.tenantId;

  const [upcomingResult, allChecks] = await Promise.all([
    getUpcomingCheckPayments(30),
    prisma.checkPayment.findMany({
      where: { tenantId },
      include: {
        payment: {
          include: {
            customer: { select: { id: true, firstName: true, lastName: true, companyName: true } },
            invoice: { select: { id: true, invoiceNumber: true } },
          },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 100,
    }),
  ]);

  return (
    <PageShell
      title="Çek/Senet Takibi"
      subtitle="Vadesi yaklaşan ve bekleyen çek/senetleri yönetin."
      sectionLabel="Finans & Kasa"
    >
      <FinanceWorkspaceNav />
      <ChecksClient
        checks={JSON.parse(JSON.stringify(allChecks))}
        upcomingCount={upcomingResult.data?.payments?.length ?? 0}
      />
    </PageShell>
  );
}
