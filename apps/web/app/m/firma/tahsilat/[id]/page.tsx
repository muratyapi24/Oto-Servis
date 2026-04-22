import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import TahsilatDetayClient from "./TahsilatDetayClient";

export const metadata = { title: "Tahsilat Detayı | MS Oto Servis" };

export default async function TahsilatDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) return notFound();

  const { id } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id, tenantId: session.user.tenantId },
    include: {
      customer: {
        select: {
          firstName: true,
          lastName: true,
          companyName: true,
          type: true,
          phone: true,
        },
      },
      serviceOrder: { select: { orderNumber: true, id: true } },
    },
  });

  if (!payment) notFound();

  const customerName =
    payment.customer?.type === "CORPORATE"
      ? (payment.customer.companyName ?? "—")
      : `${payment.customer?.firstName ?? ""} ${payment.customer?.lastName ?? ""}`.trim() || "—";

  return (
    <TahsilatDetayClient
      payment={{
        id: payment.id,
        customerName,
        customerPhone: payment.customer?.phone ?? null,
        amount: Number(payment.amount),
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate.toISOString(),
        notes: payment.notes,
        serviceOrderId: payment.serviceOrderId,
        serviceOrderNumber: payment.serviceOrder?.orderNumber ?? null,
      }}
    />
  );
}
