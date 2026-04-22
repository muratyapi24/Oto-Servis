import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMusteriPanelData } from "@/lib/actions/mobile.actions";

/**
 * GET /api/mobile/musteri/panel
 * Müşteri mobil panel verilerini döner
 */
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const result = await getMusteriPanelData();
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Decimal serialize
  const serialized = {
    ...result,
    customer: result.customer ? {
      ...result.customer,
      balance: Number(result.customer.balance),
    } : null,
  };

  return NextResponse.json(serialized);
}
