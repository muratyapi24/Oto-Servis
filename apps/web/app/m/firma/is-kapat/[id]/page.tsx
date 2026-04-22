import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import IsKapatClient from "./IsKapatClient";

export const metadata = { title: "İşi Kapat | MS Oto Servis" };

export default async function IsKapatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) return notFound();

  const { id } = await params;

  const order = await prisma.serviceOrder.findUnique({
    where: { id, tenantId: session.user.tenantId, deletedAt: null },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      complaintDescription: true,
      totalAmount: true,
      vehicle: { select: { plate: true, brand: true, model: true } },
      customer: {
        select: {
          firstName: true,
          lastName: true,
          companyName: true,
          type: true,
        },
      },
    },
  });

  if (!order) notFound();

  const customerName =
    order.customer.type === "CORPORATE"
      ? (order.customer.companyName ?? "—")
      : `${order.customer.firstName ?? ""} ${order.customer.lastName ?? ""}`.trim() || "—";

  return (
    <IsKapatClient
      orderId={order.id}
      orderNumber={order.orderNumber}
      plate={order.vehicle.plate}
      vehicleName={`${order.vehicle.brand} ${order.vehicle.model}`}
      customerName={customerName}
      complaint={order.complaintDescription}
      totalAmount={Number(order.totalAmount)}
    />
  );
}
