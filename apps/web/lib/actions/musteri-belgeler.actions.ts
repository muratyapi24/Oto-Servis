"use server";

import { prisma } from "@repo/database";
import { auth } from "@/auth";

/**
 * Müşterinin araçlarına ait tüm belgeleri getirir
 * (Stitch "Servis Belgeleri" sayfası için)
 */
export async function getMusteriBelgeleri() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Oturum bulunamadı.", documents: [] };
    }

    const customer = await prisma.customer.findFirst({
      where: { tenantId: (session.user as any).tenantId || undefined },
      include: {
        vehicles: {
          select: { id: true, plate: true, brand: true, model: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!customer) {
      return { error: "Müşteri profili bulunamadı.", documents: [] };
    }

    const vehicleIds = customer.vehicles.map(v => v.id);

    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { vehicleId: { in: vehicleIds } },
          { serviceOrder: { customerId: customer.id } }
        ]
      },
      include: {
        vehicle: {
          select: { plate: true, brand: true, model: true }
        },
        serviceOrder: {
          select: { orderNumber: true, complaintDescription: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Belgeleri kategorilere ayır
    const categorized = {
      ruhsat: documents.filter(d => d.fileType?.includes('ruhsat') || d.fileName?.toLowerCase().includes('ruhsat')),
      sigorta: documents.filter(d => d.fileType?.includes('sigorta') || d.fileName?.toLowerCase().includes('sigorta')),
      fatura: documents.filter(d => d.fileType?.includes('fatura') || d.fileName?.toLowerCase().includes('fatura')),
      servis: documents.filter(d => d.serviceOrderId != null),
      diger: documents.filter(d => 
        !d.fileName?.toLowerCase().includes('ruhsat') && 
        !d.fileName?.toLowerCase().includes('sigorta') && 
        !d.fileName?.toLowerCase().includes('fatura') && 
        !d.serviceOrderId
      )
    };

    return { 
      success: true, 
      documents, 
      categorized,
      customer,
      vehicles: customer.vehicles 
    };
  } catch (error) {
    console.error("Belgeler veri çekme hatası:", error);
    return { error: "Belgeler yüklenirken hata oluştu.", documents: [] };
  }
}
