import { redirect } from "next/navigation";

export default async function LegacyInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  redirect(`/dashboard/finances/invoices/${id}`);
}
