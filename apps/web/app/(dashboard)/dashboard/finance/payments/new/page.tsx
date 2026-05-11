import { redirect } from "next/navigation";

export default async function LegacyNewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ invoiceId?: string }>;
}) {
  const { invoiceId } = await searchParams;
  const query = invoiceId ? `?invoiceId=${encodeURIComponent(invoiceId)}` : "";

  redirect(`/dashboard/finances/payments/new${query}`);
}
