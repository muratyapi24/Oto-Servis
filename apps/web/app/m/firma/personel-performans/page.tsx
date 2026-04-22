import PersonelPerformansClient from "./PersonelPerformansClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@repo/database";

export const metadata = { title: "Personel Performansı | MS Oto Servis" };

export default async function PersonelPerformansPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/m/firma/login");

  const tenantId = session.user.tenantId;

  const mechanics = await prisma.mechanic.findMany({
    where: { tenantId, isActive: true, deletedAt: null },
    orderBy: { firstName: "asc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      specialties: true,
      dailyTarget: true,
    },
  });

  const mechanicIds = mechanics.map((m) => m.id);

  // Tamamlanan iş sayıları
  const completedCounts = await prisma.serviceOrder.groupBy({
    by: ["assignedMechanicId"],
    where: {
      tenantId,
      assignedMechanicId: { in: mechanicIds },
      status: "COMPLETED",
    },
    _count: { id: true },
  });

  // Ortalama iş süresi (WorkLog)
  const workLogs = await prisma.workLog.findMany({
    where: {
      tenantId,
      mechanicId: { in: mechanicIds },
      durationMinutes: { not: null },
    },
    select: { mechanicId: true, durationMinutes: true },
  });

  // Ortalama müşteri puanı (ServiceRating)
  const ratings = await prisma.serviceRating.findMany({
    where: {
      tenantId,
      serviceOrder: { assignedMechanicId: { in: mechanicIds } },
    },
    select: {
      rating: true,
      serviceOrder: { select: { assignedMechanicId: true } },
    },
  });

  // Map'ler oluştur
  const completedMap = new Map(
    completedCounts.map((r) => [r.assignedMechanicId, r._count.id])
  );

  const durationMap = new Map<string, number>();
  const durationCountMap = new Map<string, number>();
  workLogs.forEach((w) => {
    if (!w.mechanicId) return;
    durationMap.set(w.mechanicId, (durationMap.get(w.mechanicId) ?? 0) + (w.durationMinutes ?? 0));
    durationCountMap.set(w.mechanicId, (durationCountMap.get(w.mechanicId) ?? 0) + 1);
  });

  const ratingMap = new Map<string, number[]>();
  ratings.forEach((r) => {
    const mid = r.serviceOrder?.assignedMechanicId;
    if (!mid) return;
    if (!ratingMap.has(mid)) ratingMap.set(mid, []);
    ratingMap.get(mid)!.push(r.rating);
  });

  const performanceData = mechanics.map((m) => {
    const completed = completedMap.get(m.id) ?? 0;
    const totalDur = durationMap.get(m.id) ?? 0;
    const durCount = durationCountMap.get(m.id) ?? 0;
    const avgDuration = durCount > 0 ? Math.round(totalDur / durCount) : 0;
    const ratingArr = ratingMap.get(m.id) ?? [];
    const avgRating =
      ratingArr.length > 0
        ? Math.round((ratingArr.reduce((a, b) => a + b, 0) / ratingArr.length) * 10) / 10
        : null;

    return {
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      avatarUrl: m.avatarUrl,
      specialties: m.specialties,
      dailyTarget: m.dailyTarget,
      completed,
      avgDurationMinutes: avgDuration,
      avgRating,
    };
  });

  return <PersonelPerformansClient mechanics={performanceData} />;
}
