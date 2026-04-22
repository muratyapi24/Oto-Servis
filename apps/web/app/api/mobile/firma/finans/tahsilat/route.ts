import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import { z } from "zod";

const createTahsilatSchema = z.object({
  customerId: z.string().uuid("Geçerli bir müşteri seçin"),
  amount: z.number().positive("Tutar sıfırdan büyük olmalıdır"),
  paymentMethod: z.enum(["CASH", "CREDIT_CARD", "BANK_TRANSFER"]),
  serviceOrderId: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await req.json();
    const validated = createTahsilatSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error?.errors?.[0]?.message || "Ge�ersiz veri" },
        { status: 400 }
      );
    }

    const tenantId = session.user.tenantId;

    // Müşterinin bu tenant'a ait olduğunu doğrula
    const customer = await prisma.customer.findUnique({
      where: { id: validated.data.customerId, tenantId },
      select: { id: true },
    });
    if (!customer) {
      return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 });
    }

    const payment = await prisma.$transaction(async (tx) => {
      // Önce faturayı bul (serviceOrderId varsa)
      let invoiceId: string | null = null;
      if (validated.data.serviceOrderId) {
        const invoice = await tx.invoice.findFirst({
          where: {
            serviceOrderId: validated.data.serviceOrderId,
            tenantId,
            status: { not: "CANCELLED" }
          }
        });
        if (invoice) {
          invoiceId = invoice.id;
          const newPaidAmount = Number(invoice.paidAmount) + validated.data.amount;
          const newStatus = newPaidAmount >= Number(invoice.totalAmount) ? "PAID" : invoice.status;
          await tx.invoice.update({
            where: { id: invoice.id },
            data: { paidAmount: newPaidAmount, status: newStatus as any }
          });
        }
      }

      const newPayment = await tx.payment.create({
        data: {
          tenantId,
          customerId: validated.data.customerId,
          invoiceId,
          amount: validated.data.amount,
          paymentMethod: validated.data.paymentMethod,
          paymentType: "INCOMING",
          serviceOrderId: validated.data.serviceOrderId ?? null,
          notes: validated.data.notes ?? null,
        },
      });

      // Müşteri bakiyesini güncelle (tahsilat → borç azalır)
      await tx.customer.update({
        where: { id: validated.data.customerId },
        data: { balance: { decrement: validated.data.amount } }
      });

      return newPayment;
    });

    return NextResponse.json(
      { success: true, payment: { ...payment, amount: Number(payment.amount) } },
      { status: 201 }
    );
  } catch (err) {
    console.error("Tahsilat oluşturma hatası:", err);
    return NextResponse.json({ error: "Tahsilat oluşturulamadı." }, { status: 500 });
  }
}
