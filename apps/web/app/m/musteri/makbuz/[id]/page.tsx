import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import MakbuzClient from "./MakbuzClient";

export const metadata = { title: "Makbuz | MS Oto Servis" };

export default async function MakbuzPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) return notFound();

  const { id } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      customer: { select: { firstName: true, lastName: true, companyName: true, type: true } },
      serviceOrder: { select: { orderNumber: true, id: true } },
      invoice: { select: { invoiceNumber: true } },
    },
  });

  if (!payment) notFound();

  const customerName =
    payment.customer?.type === "CORPORATE"
      ? (payment.customer.companyName ?? "—")
      : `${payment.customer?.firstName ?? ""} ${payment.customer?.lastName ?? ""}`.trim() || "—";

  const METHOD_LABELS: Record<string, string> = {
    CASH: "Nakit",
    CREDIT_CARD: "Kredi / Banka Kartı",
    BANK_TRANSFER: "Havale / EFT",
  };

  return (
    <MakbuzClient
      payment={{
        id: payment.id,
        customerName,
        amount: Number(payment.amount),
        paymentMethod: payment.paymentMethod,
        paymentMethodLabel: METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod,
        paymentDate: payment.paymentDate.toISOString(),
        serviceOrderId: payment.serviceOrderId,
        serviceOrderNumber: payment.serviceOrder?.orderNumber ?? null,
        invoiceNumber: payment.invoice?.invoiceNumber ?? null,
      }}
    />
  );
}
