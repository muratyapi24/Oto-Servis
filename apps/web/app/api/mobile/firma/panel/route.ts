import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFirmaPanelData } from "@/lib/actions/mobile.actions";

/**
 * GET /api/mobile/firma/panel
 * Firma mobil panel verilerini döner
 */
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const result = await getFirmaPanelData();
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const raw = result.overview!;

  const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  // weeklyChart: map weeklyTrend (revenue only; expense not tracked yet → 0)
  const weeklyChart = (raw.weeklyTrend as number[]).map((revenue, i) => ({
    day: DAY_LABELS[i],
    revenue,
    expense: 0,
  }));

  // bayStatus: map activeBays to occupied/waiting entries
  const bayStatus = (raw.activeBays as any[]).map((order) => ({
    bayId: order.serviceBay as string,
    plate: order.vehicle?.plate as string | undefined,
    status: (order.status === "WAITING_APPROVAL" ? "WAITING" : "OCCUPIED") as
      | "OCCUPIED"
      | "WAITING",
  }));

  // Decimal serialize
  const overview = {
    ...raw,
    dailyRevenue: Number(raw.dailyRevenue),
    collectionTotal: Number(raw.collectionTotal),
    completedTodayCount: raw.completedToday as number,
    criticalAlertCount: raw.criticalAlertCount as number,
    weeklyChart,
    bayStatus,
    escalations: (raw.escalations as any[]).map((e) => ({
      ...e,
      totalAmount: Number(e.totalAmount ?? 0),
    })),
    approvalQueue: (raw.approvalQueue as any[]).map((o) => ({
      ...o,
      totalAmount: Number(o.totalAmount ?? 0),
    })),
    criticalParts: (raw.criticalParts as any[]).map((p) => ({
      ...p,
      purchasePrice: Number(p.purchasePrice ?? 0),
      sellingPrice: Number(p.sellingPrice ?? 0),
    })),
  };

  return NextResponse.json({ overview });
}
