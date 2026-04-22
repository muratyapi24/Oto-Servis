import ServisRaporuClient from "./ServisRaporuClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@repo/database";

export const metadata = { title: "Servis Raporu | MS Oto Servis" };

async function getServisData(tenantId: string, period: "week" | "month") {
  const now = new Date();
  const startDate =
    period === "week"
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getFullYear(), now.getMonth(), 1);

  const where = {
    tenantId,
    createdAt: { gte: startDate },
  };

  const [total, statusGroups, ratingAgg] = await Promise.all([
    prisma.serviceOrder.count({ where }),
    prisma.serviceOrder.groupBy({
      by: ["status"],
      where,
      _count: { id: true },
    }),
    prisma.serviceRating.aggregate({
      where: { tenantId, createdAt: { gte: startDate } },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const distribution = statusGroups.map((g) => ({
    status: g.status,
    count: g._count.id,
  }));

  return {
    total,
    distribution,
    avgRating: ratingAgg._avg.rating ?? 0,
    ratingCount: ratingAgg._count.rating,
  };
}

export default async function ServisRaporuPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/m/firma/login");

  const [weekData, monthData] = await Promise.all([
    getServisData(session.user.tenantId, "week"),
    getServisData(session.user.tenantId, "month"),
  ]);

  return <ServisRaporuClient weekData={weekData} monthData={monthData} />;
}
