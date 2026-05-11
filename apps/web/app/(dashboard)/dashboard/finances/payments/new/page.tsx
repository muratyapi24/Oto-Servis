import { prisma } from "@repo/database";
import { auth } from "@/auth";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import FinanceWorkspaceNav from "@/components/dashboard/finances/FinanceWorkspaceNav";
import NewPaymentForm from "@/components/dashboard/finances/NewPaymentForm";

export const metadata = {
  title: "Ödeme Kaydet | MS Oto Servis",
};

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ invoiceId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) return <PageError message="Yetkisiz erişim." />;

  const tenantId = session.user.tenantId;
  const { invoiceId } = await searchParams;

  const [customers, invoices] = await Promise.all([
    prisma.customer.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, companyName: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.invoice.findMany({
      where: { tenantId, status: { in: ["SENT"] }, deletedAt: null },
      select: { id: true, invoiceNumber: true, totalAmount: true, paidAmount: true, customerId: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <PageShell
      title="Ödeme Kaydet"
      subtitle="Manuel ödeme, çek veya senet kaydı oluşturun."
      sectionLabel="Finans & Kasa"
    >
      <FinanceWorkspaceNav />
      <NewPaymentForm
        customers={customers}
        invoices={invoices.map((invoice) => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber ?? "TASLAK",
          totalAmount: Number(invoice.totalAmount),
          paidAmount: Number(invoice.paidAmount),
          customerId: invoice.customerId,
        }))}
        defaultInvoiceId={invoiceId}
      />
    </PageShell>
  );
}
