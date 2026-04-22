import * as z from "zod";

export const createVehicleSchema = z.object({
  customerId: z.string().min(1, "Geçerli bir müşteri seçmelisiniz."),
  
  // Temel Araç Bilgileri
  plate: z.string()
    .min(5, "Plaka en az 5 karakter olmalıdır.")
    .max(15, "Plaka çok uzun.")
    .regex(/^[a-zA-Z0-9\s]*$/, "Plakada özel karakter kullanılamaz.")
    .transform(val => val.replace(/\s+/g, '').toUpperCase()), // Boşlukları silip büyük harf yapar
    
  brand: z.string().min(2, "Marka en az 2 karakter olmalıdır."),
  model: z.string().min(1, "Model bilgisi zorunludur."),
  year: z.number().int().min(1950, "Yıl 1950'den küçük olamaz.").max(new Date().getFullYear() + 1, "Geçersiz yıl.").optional().or(z.nan()),
  
  // Araç Detayları
  chassisNo: z.string().optional(),
  engineNo: z.string().optional(),
  color: z.string().optional(),
  engineType: z.string().optional(),
  transmission: z.string().optional(),
  fuelType: z.string().optional(),
  mileage: z.number().int().min(0).optional().or(z.nan()),
  
  // Ek Bilgiler
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  insuranceCompany: z.string().optional(),
  policyNumber: z.string().optional(),
  registrationDate: z.date().optional().or(z.string().transform(str => str ? new Date(str) : undefined)),
  notes: z.string().optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

export const updateVehicleSchema = createVehicleSchema.extend({
  id: z.string().min(1, "Araç ID'si zorunludur."),
});

export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
