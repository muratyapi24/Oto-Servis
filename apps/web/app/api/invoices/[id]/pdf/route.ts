/**
 * GET /api/invoices/[id]/pdf
 *
 * Fatura PDF'i için S3 presigned URL döndürür.
 * PDF henüz oluşturulmamışsa 202 Accepted döner.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import { getSignedUrl } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const { id } = await params;
  const tenantId = session.user.tenantId;

  const invoice = await prisma.invoice.findFirst({
    where: { id, tenantId, deletedAt: null },
    select: { id: true, pdfUrl: true, invoiceNumber: true, status: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Fatura bulunamadı" }, { status: 404 });
  }

  if (!invoice.pdfUrl) {
    return NextResponse.json(
      {
        error: "PDF henüz oluşturulmadı. Lütfen kısa süre sonra tekrar deneyin.",
        status: invoice.status,
      },
      { status: 202 }
    );
  }

  // S3 presigned URL oluştur (1 saat geçerli)
  const signedUrl = await getSignedUrl(invoice.pdfUrl, 3600);
  return NextResponse.json({ url: signedUrl });
}
