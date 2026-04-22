import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { id } = await params;

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "Stripe yapılandırılmamış." }, { status: 503 });
    }

    try {
      const { getStripe } = await import("@/lib/stripe");
      const stripe = await getStripe();
      await stripe.paymentMethods.detach(id);
      return new NextResponse(null, { status: 204 });
    } catch (stripeErr: any) {
      return NextResponse.json(
        { error: stripeErr.message ?? "Kart silinemedi." },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("Kart silme API hatası:", err);
    return NextResponse.json({ error: "Kart silinemedi." }, { status: 500 });
  }
}
