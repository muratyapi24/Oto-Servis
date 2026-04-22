import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMusteriServisDetay } from "@/lib/actions/mobile.actions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const result = await getMusteriServisDetay(id);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }

  return NextResponse.json({ order: result.order });
}
