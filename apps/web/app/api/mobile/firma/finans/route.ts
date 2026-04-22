import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFirmaFinansData } from "@/lib/actions/mobile.actions";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const result = await getFirmaFinansData();
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.data);
}
