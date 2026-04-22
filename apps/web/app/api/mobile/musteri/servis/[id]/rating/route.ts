import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createMusteriServisRating } from "@/lib/actions/mobile.actions";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const body = await req.json();
  const result = await createMusteriServisRating(id, body);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }

  return NextResponse.json({ success: true, rating: result.rating });
}
