import { notFound } from "next/navigation";
import { getCustomerById } from "@/lib/actions/customer.actions";
import PageShell from "@/components/dashboard/PageShell";
import CustomerWorkspaceNav from "@/components/dashboard/customers/CustomerWorkspaceNav";
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
      sectionLabel="Müşteri & Araç"
    >
      <CustomerWorkspaceNav />
      <CustomerDetailClient customer={customer} />
    </PageShell>
  );
}
