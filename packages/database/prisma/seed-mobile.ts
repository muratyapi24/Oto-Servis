import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Mobile Data Seed...");

  // 1. Master Tenant Oluştur (Varsa Bul)
  const tenant = await prisma.tenant.upsert({
    where: { slug: "precision-atelier" },
    update: {},
    create: {
      name: "Precision Atelier - MS Oto Servis",
      slug: "precision-atelier",
      status: "ACTIVE",
      settings: {},
    },
  });

  // 2. Kullanıcılar ve Custome Profilleri (Müşteri - Ahmet Yılmaz)
  const hashedPassword = await bcrypt.hash("password123", 10);
  const userCustomer = await prisma.user.upsert({
    where: { email: "ahmet@example.com" },
    update: { tenantId: tenant.id },
    create: {
      email: "ahmet@example.com",
      name: "Ahmet Yılmaz",
      password: hashedPassword,
      role: "TENANT_ADMIN",
      tenantId: tenant.id,
      isActive: true,
    },
  });

  const customer = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      type: "INDIVIDUAL",
      firstName: "Ahmet",
      lastName: "Yılmaz",
      email: "ahmet@example.com",
      phone: "5551234567",
      rewardPoints: 2450,
      membershipTier: "GOLD",
    },
  });

  // 3. Admin / Firma Sahibi Kullanıcı
  await prisma.user.upsert({
    where: { email: "admin@precision.com" },
    update: { tenantId: tenant.id },
    create: {
      email: "admin@precision.com",
      name: "Admin User",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      tenantId: tenant.id,
      isActive: true,
    },
  });

  // 4. Araçlar (Ford Focus, Renault Megane)
  const vehicle1 = await prisma.vehicle.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      plate: "34 ABC 123",
      brand: "Ford",
      model: "Focus",
      year: 2017,
      mileage: 65400,
      nextMaintenanceMileage: 70000,
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      plate: "06 XYZ 789",
      brand: "Renault",
      model: "Megane",
      year: 2015,
      mileage: 110000,
      nextMaintenanceMileage: 122400,
    },
  });

  // 5. Usta
  const mechanic = await prisma.mechanic.create({
    data: {
      tenantId: tenant.id,
      firstName: "Mert",
      lastName: "Yılmaz",
      specialties: ["Motor", "Mekanik"],
    },
  });

  // 6. Servis İşlemleri (Service Orders)
  // - Aktif Motor Revizyonu (Müşteri için ilerlemede olan işlem)
  await prisma.serviceOrder.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      vehicleId: vehicle1.id,
      status: "IN_PROGRESS",
      serviceBay: "BAY 1",
      completionPercentage: 40,
      complaintDescription: "Motor Revizyon. Check engine ışığı yanıyor.",
      assignedMechanicId: mechanic.id,
      estimatedCost: 15000,
      subTotal: 12000,
      taxAmount: 2400,
      totalAmount: 14400,
      isUrgent: true,
    }
  });

  // - Onay Bekleyen İşlem (Firma view'da görülecek Approval)
  const otherCustomer = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      type: "INDIVIDUAL",
      firstName: "Mehmet",
      lastName: "Demir",
      phone: "5559876543"
    }
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      tenantId: tenant.id,
      customerId: otherCustomer.id,
      plate: "34 AUD 85",
      brand: "Audi",
      model: "A4"
    }
  });

  await prisma.serviceOrder.create({
    data: {
      tenantId: tenant.id,
      customerId: otherCustomer.id,
      vehicleId: vehicle3.id,
      status: "WAITING_APPROVAL",
      serviceBay: "BAY 2",
      completionPercentage: 85,
      complaintDescription: "Yüksek maliyetli motor arızası.",
      estimatedCost: 45890,
      totalAmount: 45890,
      isUrgent: true
    }
  });

  // - Teslime Hazır (Quality Control)
  const vehicle4 = await prisma.vehicle.create({
    data: {
      tenantId: tenant.id,
      customerId: otherCustomer.id,
      plate: "34 BMW 55",
      brand: "BMW",
      model: "5 Series"
    }
  });

  await prisma.serviceOrder.create({
    data: {
      tenantId: tenant.id,
      customerId: otherCustomer.id,
      vehicleId: vehicle4.id,
      status: "COMPLETED",
      serviceBay: "BAY 4",
      completionPercentage: 100,
      complaintDescription: "Genel Periyodik Bakım",
      totalAmount: 12450
    }
  });

  // 7. Stok Parçaları (Inventory Alerts)
  await prisma.partCategory.create({
    data: { id: "cat-1", tenantId: tenant.id, name: "Sıvı Grubları" }
  });

  await prisma.part.create({
    data: {
      tenantId: tenant.id,
      categoryId: "cat-1",
      partNumber: "OIL-001",
      name: "Motor Oil (Synthetic)",
      minStockLevel: 5,
      currentStock: 2, // Critical Alert
      purchasePrice: 500,
      sellingPrice: 850
    }
  });

  await prisma.part.create({
    data: {
      tenantId: tenant.id,
      categoryId: "cat-1",
      partNumber: "FLD-002",
      name: "Brake Fluid",
      minStockLevel: 3,
      currentStock: 1, // Alert
      purchasePrice: 200,
      sellingPrice: 400
    }
  });

  console.log("✅ Mobile Data Seed Completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
