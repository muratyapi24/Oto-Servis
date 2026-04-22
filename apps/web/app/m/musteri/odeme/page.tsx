import OdemeClient from "./OdemeClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@repo/database";

export const metadata = { title: "Ödeme | MS Oto Servis" };

export default async function OdemePage({
  searchParams,
}: {
  searchParams: Promise<{ invoiceId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/m/musteri/login");

  const { invoiceId } = await searchParams;

  // Müşteriye ait ödenmemiş faturalar
  const customer = await prisma.customer.findFirst({
    where: { tenantId: session.user.tenantId ?? undefined },
    select: { id: true },
  });

  let invoice = null;
  if (invoiceId && customer) {
    invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId, customerId: customer.id, deletedAt: null },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
        serviceOrder: { select: { orderNumber: true } },
      },
    });
  }

  return (
    <OdemeClient
      invoice={invoice ? {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: Number(invoice.totalAmount),
        paidAmount: Number(invoice.paidAmount),
        remaining: Number(invoice.totalAmount) - Number(invoice.paidAmount),
        serviceOrderNumber: invoice.serviceOrder?.orderNumber ?? null,
      } : null}
    />
  );
}
