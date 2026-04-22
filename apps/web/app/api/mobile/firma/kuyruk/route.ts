import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFirmaKuyrukData } from "@/lib/actions/mobile.actions";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const result = await getFirmaKuyrukData();
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const serialize = (orders: any[]) =>
    orders.map((o) => ({
      ...o,
      totalAmount: Number(o.totalAmount ?? 0),
      subTotal: Number(o.subTotal ?? 0),
      taxAmount: Number(o.taxAmount ?? 0),
    }));

  return NextResponse.json({
    inProgress: serialize(result.inProgress ?? []),
    pending: serialize(result.pending ?? []),
    orders: serialize(result.orders ?? []),
  });
}
