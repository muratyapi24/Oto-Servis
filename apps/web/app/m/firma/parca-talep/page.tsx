import ParcaTalepClient from "./ParcaTalepClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@repo/database";

export const metadata = { title: "Parça Talep | MS Oto Servis" };

export default async function ParcaTalepPage({
  searchParams,
}: {
  searchParams: Promise<{ serviceOrderId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/m/firma/login");

  const { serviceOrderId } = await searchParams;
  const tenantId = session.user.tenantId;

  const [locations, parts] = await Promise.all([
    prisma.location.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.part.findMany({
      where: { tenantId, deletedAt: null, isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        partNumber: true,
        currentStock: true,
        unit: true,
      },
    }),
  ]);

  return (
    <ParcaTalepClient
      locations={locations}
      parts={parts}
      serviceOrderId={serviceOrderId}
    />
  );
}
