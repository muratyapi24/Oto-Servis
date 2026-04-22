import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import { uploadFile } from "@/lib/storage";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }
  const tenantId = session.user.tenantId;
  const uploadedBy = session.user.id ?? "unknown";

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const serviceOrderId = formData.get("serviceOrderId") as string | null;
  const vehicleId = formData.get("vehicleId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
  }

  // Dosya türü validasyonu
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Sadece JPEG, PNG ve WebP formatları desteklenir" },
      { status: 400 }
    );
  }

  // Dosya boyutu validasyonu
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Dosya boyutu 10MB'ı aşamaz" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() ?? "jpg";
  const key = `${tenantId}/${serviceOrderId ?? vehicleId ?? "misc"}/${randomUUID()}.${ext}`;

  const { url } = await uploadFile(buffer, key, file.type);

  const document = await prisma.document.create({
    data: {
      tenantId,
      serviceOrderId: serviceOrderId || null,
      vehicleId: vehicleId || null,
      fileName: file.name,
      fileUrl: url,
      fileKey: key,
      fileType: file.type,
      fileSize: file.size,
      uploadedBy,
    },
  });

  return NextResponse.json({ documentId: document.id, fileUrl: url });
}
