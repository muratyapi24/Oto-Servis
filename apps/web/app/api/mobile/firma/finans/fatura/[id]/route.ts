import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id, tenantId: session.user.tenantId, deletedAt: null },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            type: true,
            phone: true,
            email: true,
          },
        },
        serviceOrder: {
          select: {
            orderNumber: true,
            items: {
              select: {
                id: true,
                name: true,
                itemType: true,
                quantity: true,
                unitPrice: true,
                taxRate: true,
                discount: true,
                subTotal: true,
                taxAmount: true,
                totalPrice: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Fatura bulunamadı." }, { status: 404 });
    }

    const customerName =
      invoice.customer?.type === "CORPORATE"
        ? (invoice.customer.companyName ?? "—")
        : `${invoice.customer?.firstName ?? ""} ${invoice.customer?.lastName ?? ""}`.trim() || "—";

    return NextResponse.json({
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        issueDate: invoice.issueDate.toISOString(),
        dueDate: invoice.dueDate?.toISOString() ?? null,
        customerName,
        customerPhone: invoice.customer?.phone ?? null,
        customerEmail: invoice.customer?.email ?? null,
        subTotal: Number(invoice.subTotal),
        discountAmount: Number(invoice.discountAmount),
        taxAmount: Number(invoice.taxAmount),
        totalAmount: Number(invoice.totalAmount),
        paidAmount: Number(invoice.paidAmount),
        serviceOrderNumber: invoice.serviceOrder?.orderNumber ?? null,
        items: (invoice.serviceOrder?.items ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          itemType: item.itemType,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxRate: Number(item.taxRate),
          discount: Number(item.discount),
          subTotal: Number(item.subTotal),
          taxAmount: Number(item.taxAmount),
          totalPrice: Number(item.totalPrice),
        })),
      },
    });
  } catch (err) {
    console.error("Fatura detay API hatası:", err);
    return NextResponse.json({ error: "Fatura yüklenemedi." }, { status: 500 });
  }
}
