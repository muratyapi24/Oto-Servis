import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";

const destekSchema = z.object({
  subject: z.string().min(3, "Konu en az 3 karakter olmalıdır").max(255),
  description: z.string().min(10, "Açıklama en az 10 karakter olmalıdır").max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await req.json();
    const validated = destekSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error?.errors?.[0]?.message || "Ge�ersiz veri" },
        { status: 400 }
      );
    }

    // Gerçek uygulamada: destek talebi DB'ye kaydedilir veya e-posta gönderilir
    // Şimdilik başarılı yanıt döndürüyoruz
    console.log("Destek talebi:", {
      tenantId: session.user.tenantId,
      userEmail: session.user.email,
      subject: validated.data.subject,
      description: validated.data.description,
    });

    return NextResponse.json(
      { success: true, message: "Destek talebiniz alındı. En kısa sürede dönüş yapılacaktır." },
      { status: 201 }
    );
  } catch (err) {
    console.error("Destek talebi hatası:", err);
    return NextResponse.json({ error: "Talep gönderilemedi." }, { status: 500 });
  }
}
