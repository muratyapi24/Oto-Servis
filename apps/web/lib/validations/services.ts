import * as z from "zod";

export const createServiceOrderSchema = z.object({
  customerId: z.string().uuid("Lütfen bir müşteri seçiniz"),
  vehicleId: z.string().uuid("Lütfen bir araç seçiniz"),
  complaintDescription: z.string().min(5, "Arıza/Şikayet detayı en az 5 karakter olmalıdır"),
  inspectionNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  assignedMechanicId: z.string().uuid().optional().or(z.literal("")),
  estimatedCost: z.number().min(0, "Tahmini maliyet negatif olamaz").optional(),
});

export type CreateServiceOrderInput = z.infer<typeof createServiceOrderSchema>;

export const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["PENDING", "IN_PROGRESS", "WAITING_APPROVAL", "COMPLETED", "CANCELLED"]),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const addServiceItemSchema = z.object({
  serviceOrderId: z.string().uuid(),
  itemType: z.enum(["PART", "LABOR", "OTHER"]),
  name: z.string().min(2, "Kalem/İşlem adı en az 2 karakter olmalıdır"),
  description: z.string().optional(),
  
  partId: z.string().uuid().optional().or(z.literal("")),
  mechanicId: z.string().uuid().optional().or(z.literal("")),
  
  quantity: z.number().min(0.01, "Miktar veya saat en az 0.01 olmalıdır"),
  unitPrice: z.number().min(0, "Birim fiyat negatif olamaz"),
  taxRate: z.number().min(0).max(100).default(20),
  discount: z.number().min(0).default(0),
});
export type AddServiceItemInput = z.infer<typeof addServiceItemSchema>;
