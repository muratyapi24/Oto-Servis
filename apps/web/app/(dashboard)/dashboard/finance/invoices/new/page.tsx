import { prisma } from "@repo/database";
import { auth } from "@/auth";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import NewInvoiceForm from "./NewInvoiceForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Yeni Fatura | MS Oto Servis",
};

export default async function NewInvoicePage() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return <PageError message="Yetkisiz erişim." />;
  }

  const tenantId = session.user.tenantId;

  const customers = await prisma.customer.findMany({
    where: { tenantId, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      companyName: true,
      phone: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <PageShell
      title="Yeni Fatura"
      subtitle="Müşteri seçin, kalemler ekleyin ve fatura oluşturun."
      sectionLabel="Finans & Muhasebe"
      actions={
        <Link
          href="/dashboard/finance/invoices"
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri Dön
        </Link>
      }
    >
      <NewInvoiceForm customers={customers} />
    </PageShell>
  );
}
