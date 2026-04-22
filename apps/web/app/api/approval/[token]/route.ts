import { NextRequest, NextResponse } from "next/server";
import { validateApprovalToken, approveServiceOrder, rejectServiceOrder } from "@/lib/actions/approval.actions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = await validateApprovalToken(token);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ serviceOrder: result.serviceOrder });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await req.json();
  const { action, reason } = body as { action: "APPROVE" | "REJECT"; reason?: string };

  if (action === "APPROVE") {
    const result = await approveServiceOrder(token);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: result.success });
  }

  if (action === "REJECT") {
    const result = await rejectServiceOrder(token, reason ?? "Neden belirtilmedi");
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: result.success });
  }

  return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
}
