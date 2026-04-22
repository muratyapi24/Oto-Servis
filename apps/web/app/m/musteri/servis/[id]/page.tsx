import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import ServisDetayClient from "./ServisDetayClient";

export const metadata = { title: "Servis Detayı | MS Oto Servis" };

export default async function MusteriServisDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) return notFound();

  const { id } = await params;

  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      vehicle: { select: { plate: true, brand: true, model: true, year: true } },
      customer: { select: { id: true, firstName: true, lastName: true, companyName: true, type: true } },
      assignedMechanic: { select: { firstName: true, lastName: true, avatarUrl: true } },
      documents: { select: { id: true, fileName: true, fileUrl: true, createdAt: true } },
      serviceRating: { select: { id: true, rating: true, comment: true, createdAt: true } },
    },
  });

  if (!order) notFound();

  return (
    <ServisDetayClient
      order={{
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        completionPercentage: order.completionPercentage,
        complaintDescription: order.complaintDescription,
        inspectionNotes: order.inspectionNotes,
        receptionDate: order.receptionDate.toISOString(),
        promisedDeliveryDate: order.promisedDeliveryDate?.toISOString() ?? null,
        actualDeliveryDate: order.actualDeliveryDate?.toISOString() ?? null,
        totalAmount: Number(order.totalAmount),
        vehicle: order.vehicle,
        mechanic: order.assignedMechanic
          ? {
              name: `${order.assignedMechanic.firstName} ${order.assignedMechanic.lastName}`,
              avatarUrl: order.assignedMechanic.avatarUrl,
            }
          : null,
        documents: order.documents.map((d) => ({
          id: d.id,
          name: d.fileName ?? "Belge",
          fileUrl: d.fileUrl,
          createdAt: d.createdAt.toISOString(),
        })),
        rating: order.serviceRating
          ? {
              id: order.serviceRating.id,
              rating: order.serviceRating.rating,
              comment: order.serviceRating.comment,
              createdAt: order.serviceRating.createdAt.toISOString(),
            }
          : null,
      }}
    />
  );
}
