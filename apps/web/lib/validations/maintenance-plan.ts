import { z } from "zod";

export const createMaintenancePlanSchema = z.object({
  vehicleId: z.string().uuid("Geçerli bir araç ID'si giriniz"),
  title: z.string().min(1, "Başlık zorunludur").max(255, "Başlık çok uzun"),
  dueDate: z.string().datetime({ message: "Geçerli bir tarih giriniz" }).nullable().optional(),
  dueMileage: z.number().int().positive("Kilometre pozitif olmalıdır").nullable().optional(),
});

export type CreateMaintenancePlanInput = z.infer<typeof createMaintenancePlanSchema>;

export const updateMaintenancePlanSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur").max(255).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  dueMileage: z.number().int().positive().nullable().optional(),
  isCompleted: z.boolean().optional(),
});

export type UpdateMaintenancePlanInput = z.infer<typeof updateMaintenancePlanSchema>;
