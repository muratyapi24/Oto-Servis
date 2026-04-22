import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "CUSTOMER") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const customerId = session.user.id;
  const tenantId = (session.user as any).tenantId;

  try {
    const formData = await req.formData();

    const plate = (formData.get("plate") as string)?.trim();
    const brand = formData.get("brand") as string;
    const model = formData.get("model") as string;
    const yearStr = formData.get("year") as string;
    const mileageStr = formData.get("mileage") as string;
    const fuelType = formData.get("fuelType") as string;
    const transmission = formData.get("transmission") as string;
    const color = formData.get("color") as string;
    const document = formData.get("document") as File | null;

    // Validation
    if (!plate || !brand || !model) {
      return NextResponse.json({ error: "Plaka, marka ve model zorunludur." }, { status: 400 });
    }

    // Check unique plate within tenant
    const existing = await prisma.vehicle.findFirst({
      where: { plate: plate.toUpperCase(), tenantId, deletedAt: null },
    });
    if (existing) {
      return NextResponse.json({ error: "Bu plaka numarası zaten kayıtlı." }, { status: 409 });
    }

    const year = yearStr ? parseInt(yearStr) : null;
    const mileage = mileageStr ? parseInt(mileageStr) : 0;

    // Calculate next maintenance mileage (every 10,000 km)
    const nextMaintenanceMileage = mileage > 0
      ? Math.ceil(mileage / 10000) * 10000
      : 10000;

    // Create vehicle
    const vehicle = await prisma.vehicle.create({
      data: {
        tenantId,
        customerId,
        plate: plate.toUpperCase(),
        brand,
        model: model.trim(),
        year,
        mileage,
        fuelType: fuelType || null,
        transmission: transmission || null,
        color: color || null,
        nextMaintenanceMileage,
      },
    });

    // Handle document upload
    if (document && document.size > 0) {
      try {
        const bytes = await document.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create uploads directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), "public", "uploads", "ruhsat");
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const ext = document.name.split(".").pop() || "jpg";
        const fileName = `ruhsat_${vehicle.id}_${Date.now()}.${ext}`;
        const filePath = path.join(uploadDir, fileName);
        const fileUrl = `/uploads/ruhsat/${fileName}`;

        await writeFile(filePath, buffer);

        // Create document record
        await prisma.document.create({
          data: {
            tenantId,
            vehicleId: vehicle.id,
            fileName: document.name,
            fileUrl,
            fileKey: `ruhsat/${fileName}`,
            fileType: document.type,
            fileSize: document.size,
            uploadedBy: customerId,
          },
        });
      } catch (docErr) {
        console.error("Belge yükleme hatası:", docErr);
        // Vehicle is already created, just log the document error
      }
    }

    // Cache'i temizle ki panele dönüldüğünde yeni araç görülsün
    revalidatePath("/m/musteri/panel");

    return NextResponse.json({
      success: "Araç başarıyla kaydedildi.",
      vehicleId: vehicle.id,
    });
  } catch (err: any) {
    console.error("Araç kayıt hatası:", err);

    // Prisma unique constraint violation
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Bu plaka numarası zaten kayıtlı." }, { status: 409 });
    }

    return NextResponse.json({ error: "Bir hata oluştu. Lütfen tekrar deneyin." }, { status: 500 });
  }
}
