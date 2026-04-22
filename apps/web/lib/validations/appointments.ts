import * as z from "zod";

export const createAppointmentSchema = z.object({
  customerId: z.string().uuid("Lütfen müşteri seçin"),
  vehicleId: z.string().uuid().optional().or(z.literal("")),
  
  appointmentDate: z.date({
    required_error: "Tarih alanı zorunludur"
  }),
  appointmentTime: z.string().min(4, "Lütfen geçerli bir saat seçin"), // Örn: 09:30
  
  type: z.string().optional(),
  notes: z.string().optional()
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"])
});

export const updateAppointmentSchema = createAppointmentSchema.extend({
  id: z.string().uuid()
});

export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
