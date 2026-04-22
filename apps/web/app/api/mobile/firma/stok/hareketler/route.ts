import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFirmaStokHareketler } from "@/lib/actions/mobile.actions";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const partId = searchParams.get("partId") ?? undefined;

  const result = await getFirmaStokHareketler({ page, limit, partId });
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
