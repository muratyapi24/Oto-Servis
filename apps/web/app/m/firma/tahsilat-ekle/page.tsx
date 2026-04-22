import TahsilatEkleClient from "./TahsilatEkleClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@repo/database";

export const metadata = { title: "Tahsilat Ekle | MS Oto Servis" };

export default async function TahsilatEklePage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/m/firma/login");

  const customers = await prisma.customer.findMany({
    where: { tenantId: session.user.tenantId, deletedAt: null },
    orderBy: { firstName: "asc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      companyName: true,
      type: true,
      phone: true,
    },
  });

  const customerList = customers.map((c) => ({
    id: c.id,
    name:
      c.type === "CORPORATE"
        ? (c.companyName ?? "—")
        : `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "—",
    phone: c.phone,
  }));

  return <TahsilatEkleClient customers={customerList} />;
}
