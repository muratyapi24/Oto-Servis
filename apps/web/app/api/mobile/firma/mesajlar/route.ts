import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import { z } from "zod";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    // Son mesajları servis emri bazında grupla (konuşma listesi)
    const messages = await prisma.message.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        serviceOrder: {
          select: { orderNumber: true, id: true, vehicle: { select: { plate: true } } },
        },
      },
    });

    // Konuşmaları serviceOrderId'ye göre grupla
    const conversationMap = new Map<string, typeof messages[0]>();
    messages.forEach((m) => {
      const key = m.serviceOrderId ?? `direct-${m.customerId ?? m.receiverId ?? "general"}`;
      if (!conversationMap.has(key)) {
        conversationMap.set(key, m);
      }
    });

    const conversations = Array.from(conversationMap.values()).map((m) => ({
      id: m.serviceOrderId ?? `direct-${m.customerId}`,
      lastMessage: m.content,
      lastMessageAt: m.createdAt.toISOString(),
      senderName: m.senderName,
      senderType: m.senderType,
      isRead: m.isRead,
      serviceOrderId: m.serviceOrderId,
      serviceOrderNumber: m.serviceOrder?.orderNumber ?? null,
      plate: m.serviceOrder?.vehicle?.plate ?? null,
    }));

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("Mesajlar GET hatası:", err);
    return NextResponse.json({ error: "Mesajlar yüklenemedi." }, { status: 500 });
  }
}

const sendMessageSchema = z.object({
  content: z.string().min(1, "Mesaj boş olamaz").max(2000),
  serviceOrderId: z.string().uuid().optional(),
  receiverId: z.string().optional(),
  receiverType: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await req.json();
    const validated = sendMessageSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error?.errors?.[0]?.message || "Ge�ersiz veri" },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        tenantId: session.user.tenantId,
        senderType: "ADMIN",
        senderName: session.user.name ?? session.user.email ?? "Yönetici",
        content: validated.data.content,
        serviceOrderId: validated.data.serviceOrderId ?? null,
        receiverId: validated.data.receiverId ?? null,
        receiverType: validated.data.receiverType ?? null,
        messageType: "TEXT",
      },
    });

    return NextResponse.json(
      {
        message: {
          ...message,
          createdAt: message.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Mesaj gönderme hatası:", err);
    return NextResponse.json({ error: "Mesaj gönderilemedi." }, { status: 500 });
  }
}
