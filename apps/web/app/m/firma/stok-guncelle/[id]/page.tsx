import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import StokGuncelleClient from "./StokGuncelleClient";

export const metadata = { title: "Stok Güncelle | MS Oto Servis" };

export default async function StokGuncellePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) return notFound();

  const { id } = await params;

  const part = await prisma.part.findUnique({
    where: { id, tenantId: session.user.tenantId, deletedAt: null },
    select: {
      id: true,
      name: true,
      partNumber: true,
      currentStock: true,
      minStockLevel: true,
      unit: true,
    },
  });

  if (!part) notFound();

  return <StokGuncelleClient part={part} />;
}
