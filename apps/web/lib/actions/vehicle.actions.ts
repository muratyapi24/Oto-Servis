"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import { guardTenantRole, guardTenant } from "@/lib/guards";
import { CreateVehicleInput, createVehicleSchema } from "@/lib/validations/vehicles";
import { checkLimit } from "@/lib/subscription-guard";

/**
 * Creates a new vehicle for a specific customer in current tenant.
 */
export async function createVehicle(data: CreateVehicleInput) {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;
  try {

    // Subscription Guard — Araç limit kontrolü
    const limitCheck = await checkLimit(tenantId, "maxVehicles");
    if (!limitCheck.allowed) {
      return { error: limitCheck.message || "Araç limitinize ulaştınız. Paketinizi yükseltin." };
    }

    const validatedData = createVehicleSchema.parse(data);

    // Aynı firmada aynı plaka kontrolü
    const existingPlate = await prisma.vehicle.findFirst({
      where: {
        tenantId: tenantId,
        plate: validatedData.plate,
      },
    });

    if (existingPlate) {
      return { error: "Bu plaka numarası sisteminize zaten kayıtlı." };
    }

    const newVehicle = await prisma.vehicle.create({
      data: {
        tenantId: tenantId,
        customerId: validatedData.customerId,
        plate: validatedData.plate,
        brand: validatedData.brand,
        model: validatedData.model,
        year: validatedData.year || null,
        chassisNo: validatedData.chassisNo || null,
        engineNo: validatedData.engineNo || null,
        color: validatedData.color || null,
        engineType: validatedData.engineType || null,
        transmission: validatedData.transmission || null,
        fuelType: validatedData.fuelType || null,
        mileage: validatedData.mileage || 0,
        driverName: validatedData.driverName || null,
        driverPhone: validatedData.driverPhone || null,
        insuranceCompany: validatedData.insuranceCompany || null,
        policyNumber: validatedData.policyNumber || null,
        registrationDate: validatedData.registrationDate || null,
        notes: validatedData.notes || null,
      },
    });

    revalidatePath("/dashboard/vehicles");
    revalidatePath(`/dashboard/customers/${validatedData.customerId}`);
    return { success: "Araç başarıyla kaydedildi.", vehicleId: newVehicle.id };
  } catch (error) {
    console.error("Araç kaydedilirken hata:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return { error: "Lütfen bilgileri düzeltin." };
    }
    return { error: "Araç kaydedilirken bir sunucu hatası oluştu." };
  }
}

/**
 * Retrieves all vehicles for the current tenant.
 */
export async function getVehicles() {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;
  try {

    const vehicles = await prisma.vehicle.findMany({
      where: {
        tenantId: tenantId,
        deletedAt: null,
      },
      include: {
        customer: {
          select: {
            id: true,
            type: true,
            firstName: true,
            lastName: true,
            companyName: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { vehicles };
  } catch (error) {
    console.error("Araçlar getirilirken hata:", error);
    return { error: "Araç listesi yüklenemedi." };
  }
}

/**
 * Updates an existing vehicle.
 */
export async function updateVehicle(data: any) {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;
  try {

    const { id, ...updateData } = data;
    if (!id) return { error: "ID bulunamadı" };

    // Eğer plaka değişmişse, başka araçta bu plaka var mı kontrolü
    if (updateData.plate) {
      const existingPlate = await prisma.vehicle.findFirst({
        where: {
          tenantId: tenantId,
          plate: updateData.plate,
          id: { not: id }
        },
      });
      if (existingPlate) return { error: "Bu plaka numarası başka bir araca kayıtlı." };
    }

    await prisma.vehicle.update({
      where: { id, tenantId: tenantId },
      data: {
        customerId: updateData.customerId,
        plate: updateData.plate,
        brand: updateData.brand,
        model: updateData.model,
        year: updateData.year || null,
        chassisNo: updateData.chassisNo || null,
        engineNo: updateData.engineNo || null,
        color: updateData.color || null,
        engineType: updateData.engineType || null,
        transmission: updateData.transmission || null,
        fuelType: updateData.fuelType || null,
        mileage: updateData.mileage || 0,
        driverName: updateData.driverName || null,
        driverPhone: updateData.driverPhone || null,
        insuranceCompany: updateData.insuranceCompany || null,
        policyNumber: updateData.policyNumber || null,
        registrationDate: updateData.registrationDate || null,
        notes: updateData.notes || null,
      }
    });

    revalidatePath("/dashboard/vehicles");
    if(updateData.customerId) revalidatePath(`/dashboard/customers/${updateData.customerId}`);
    
    return { success: "Araç başarıyla güncellendi." };
  } catch (err) {
    console.error("Araç güncelleme hatası:", err);
    return { error: "Güncelleme sırasında bir hata meydana geldi." };
  }
}

/**
 * Soft deletes a vehicle.
 */
export async function deleteVehicle(id: string) {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;
  try {

    await prisma.vehicle.update({
      where: { id, tenantId: tenantId },
      data: { deletedAt: new Date() }
    });

    revalidatePath("/dashboard/vehicles");
    return { success: "Araç sistemden başarıyla kaldırıldı." };
  } catch (err) {
    console.error("Araç silme hatası:", err);
    return { error: "Silme işlemi sırasında bir sorun oluştu." };
  }
}

/**
 * Retrieves analytics and expanded vehicle data for the Fleet Dashboard
 */
export async function getVehicleDashboard() {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;
  try {

    // Tüm araçları müşteri ve servis geçmişi (son servis & aktif servis tespiti için) ile çek
    const allVehicles = await prisma.vehicle.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, companyName: true, type: true } },
        serviceOrders: {
          orderBy: { createdAt: 'desc' },
          take: 2 // Son tamamlanmış ve/veya aktif/bekleyen servisler için
        }
      },
      orderBy: { createdAt: "desc" }
    });

    if (allVehicles.length === 0) {
      return { 
        metrics: { total: 0, avgAge: 0, evRate: 0 }, 
        recentRegistrations: [], 
        vehiclesList: [] 
      };
    }

    let totalAge = 0;
    let vehiclesWithValidYear = 0;
    let evCount = 0;

    const currentYear = new Date().getFullYear();

    const formattedVehicles = allVehicles.map((v) => {

      // --- Analitik Hesaplamaları ---
      if (v.year && v.year > 1900 && v.year <= currentYear) {
        totalAge += (currentYear - v.year);
        vehiclesWithValidYear++;
      }

      const fuelLower = v.fuelType?.toLowerCase() || '';
      if (fuelLower.includes("ev") || fuelLower.includes("elektrik") || fuelLower.includes("electric")) {
        evCount++;
      }

      // --- Durum Etiketlemesi (Status) ---
      let statusLabel = "BOŞTA"; // Opsiyonel durum: Hazır/Boşta
      let lastServiceDate = null;
      let nextAppointmentDate = null;

      if (v.serviceOrders && v.serviceOrders.length > 0) {
         // En son açılan servis kaydına bakılır
         const latestSO = v.serviceOrders[0];
         
         if (!latestSO) {
           return; 
         }

         if (latestSO.status === "COMPLETED") {
            lastServiceDate = latestSO.updatedAt;
         } else if (latestSO.status === "IN_PROGRESS" || latestSO.status === "WAITING_APPROVAL") {
            statusLabel = "SERVİSTE";
         } else if (latestSO.status === "PENDING") {
            statusLabel = "BEKLİYOR"; // Sadece görsellik katması için, pendingler acil bekleyen varsayılır.
            nextAppointmentDate = latestSO.createdAt; 
         }
      }

      return {
        id: v.id,
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        ownerName: v.customer.type === "CORPORATE" ? v.customer.companyName : `${v.customer.firstName} ${v.customer.lastName}`,
        statusLabel,
        fuelType: v.fuelType,
        year: v.year,
        lastServiceDate,
        nextAppointmentDate,
        createdAt: v.createdAt
      };
    });

    const avgVehicleAge = vehiclesWithValidYear > 0 ? (totalAge / vehiclesWithValidYear).toFixed(1) : 0;
    const evAdoptionRate = Math.round((evCount / allVehicles.length) * 100);

    const recentRegistrations = formattedVehicles.slice(0, 5); // İlk 5 kayıt (desc sıralı)

    return {
       metrics: {
         total: allVehicles.length,
         avgAge: Number(avgVehicleAge),
         evRate: evAdoptionRate
       },
       recentRegistrations,
       vehiclesList: formattedVehicles // Datagrid / Cards döngüsü için  
    };

  } catch (error) {
    console.error("Vehicle Dashboard Error:", error);
    return { error: "Araç verileri yüklenirken bir problem oluştu." };
  }
}

/**
 * Retrieves a single vehicle by ID with related customer and service orders.
 */
export async function getVehicleById(id: string) {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;
  try {

    const vehicle = await prisma.vehicle.findUnique({
      where: {
        id,
        tenantId: tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        plate: true,
        brand: true,
        model: true,
        year: true,
        chassisNo: true,
        engineNo: true,
        color: true,
        engineType: true,
        transmission: true,
        fuelType: true,
        mileage: true,
        driverName: true,
        driverPhone: true,
        insuranceCompany: true,
        policyNumber: true,
        registrationDate: true,
        notes: true,
        imageUrl: true,
        customer: {
          select: {
            id: true,
            type: true,
            firstName: true,
            lastName: true,
            companyName: true,
            phone: true,
          },
        },
        serviceOrders: {
          orderBy: { receptionDate: "desc" },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            receptionDate: true,
            complaintDescription: true,
            totalAmount: true,
          },
        },
        _count: {
          select: { serviceOrders: true },
        },
      },
    });

    if (!vehicle) return { vehicle: null };

    // Serialize Decimal fields
    const serialized = {
      ...vehicle,
      serviceOrders: vehicle.serviceOrders.map((so) => ({
        ...so,
        totalAmount: Number(so.totalAmount),
      })),
    };

    return { vehicle: serialized };
  } catch (error) {
    console.error("Araç detayı getirilirken hata:", error);
    return { vehicle: null, error: "Araç detayı yüklenemedi." };
  }
}

/**
 * Updates the imageUrl field of a vehicle.
 */
export async function updateVehicleImage(
  vehicleId: string,
  imageUrl: string
) {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;
  try {

    await prisma.vehicle.update({
      where: { id: vehicleId, tenantId: tenantId },
      data: { imageUrl },
    });

    revalidatePath(`/dashboard/vehicles/${vehicleId}`);
    return { success: "Araç fotoğrafı güncellendi." };
  } catch (err) {
    console.error("Araç fotoğrafı güncelleme hatası:", err);
    return { error: "Fotoğraf güncellenirken bir hata oluştu." };
  }
}
