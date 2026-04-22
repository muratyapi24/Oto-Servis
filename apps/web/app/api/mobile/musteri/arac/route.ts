import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createMusteriArac } from "@/lib/actions/mobile.actions";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const body = await req.json();
  const result = await createMusteriArac(body);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }

  return NextResponse.json({ success: true, vehicle: result.vehicle }, { status: 201 });
}
