import OdemeTaksitClient from "./OdemeTaksitClient";

export const metadata = { title: "Taksitli Ödeme | MS Oto Servis" };

export default async function OdemeTaksitPage({
  searchParams,
}: {
  searchParams: Promise<{ invoiceId?: string; amount?: string }>;
}) {
  const { invoiceId, amount } = await searchParams;
  return (
    <OdemeTaksitClient
      invoiceId={invoiceId ?? null}
      totalAmount={amount ? parseFloat(amount) : 0}
    />
  );
}
