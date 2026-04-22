import { notFound } from "next/navigation";
import { getCustomerById } from "@/lib/actions/customer.actions";
import PageShell from "@/components/dashboard/PageShell";
import Link from "next/link";
import CustomerDetailClient from "./CustomerDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getCustomerById(id);
  if (!result.customer) return { title: "Müşteri Bulunamadı | MS Oto Servis" };

  const name =
    result.customer.type === "CORPORATE"
      ? result.customer.companyName
      : `${result.customer.firstName ?? ""} ${result.customer.lastName ?? ""}`.trim();

  return {
    title: `${name} | Müşteri Detayı | MS Oto Servis`,
  };
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getCustomerById(id);

  if (!result.customer) notFound();

  const customer = JSON.parse(JSON.stringify(result.customer));

  return (
    <PageShell
      title="Müşteri Detayı"
      sectionLabel="CRM"
      actions={
        <Link
          href="/dashboard/customers"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Müşterilere Dön
        </Link>
      }
    >
      <CustomerDetailClient customer={customer} />
    </PageShell>
  );
}
