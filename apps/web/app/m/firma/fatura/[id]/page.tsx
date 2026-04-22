import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import FaturaDetayClient from "./FaturaDetayClient";

export const metadata = { title: "Fatura Detayı | MS Oto Servis" };

export default async function FaturaDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) return notFound();

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id, tenantId: session.user.tenantId, deletedAt: null },
    include: {
      customer: {
        select: {
          firstName: true,
          lastName: true,
          companyName: true,
          type: true,
          phone: true,
          email: true,
        },
      },
      serviceOrder: {
        select: {
          orderNumber: true,
          id: true,
          items: {
            select: {
              id: true,
              name: true,
              itemType: true,
              quantity: true,
              unitPrice: true,
              taxRate: true,
              discount: true,
              subTotal: true,
              taxAmount: true,
              totalPrice: true,
            },
          },
        },
      },
    },
  });

  if (!invoice) notFound();

  const customerName =
    invoice.customer?.type === "CORPORATE"
      ? (invoice.customer.companyName ?? "—")
      : `${invoice.customer?.firstName ?? ""} ${invoice.customer?.lastName ?? ""}`.trim() || "—";

  return (
    <FaturaDetayClient
      invoice={{
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        issueDate: invoice.issueDate.toISOString(),
        dueDate: invoice.dueDate?.toISOString() ?? null,
        customerName,
        customerPhone: invoice.customer?.phone ?? null,
        subTotal: Number(invoice.subTotal),
        discountAmount: Number(invoice.discountAmount),
        taxAmount: Number(invoice.taxAmount),
        totalAmount: Number(invoice.totalAmount),
        paidAmount: Number(invoice.paidAmount),
        serviceOrderId: invoice.serviceOrderId,
        serviceOrderNumber: invoice.serviceOrder?.orderNumber ?? null,
        items: (invoice.serviceOrder?.items ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          itemType: item.itemType,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxRate: Number(item.taxRate),
          discount: Number(item.discount),
          totalPrice: Number(item.totalPrice),
        })),
      }}
    />
  );
}
