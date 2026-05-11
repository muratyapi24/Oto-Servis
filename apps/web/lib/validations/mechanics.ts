import * as z from "zod";

export const createMechanicSchema = z.object({
  firstName: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  lastName: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
  phone: z.string().optional(),
  email: z.string().email("Geçerli bir e-posta adresi giriniz").optional().or(z.literal("")),
  specialties: z.array(z.string()).min(1, "En az bir uzmanlık alanı seçmelisiniz"),
  experienceYears: z.number().int().min(0, "Deneyim yılı negatif olamaz").optional().or(z.nan()),
  hourlyRate: z.number().min(0, "Saatlik ücret negatif olamaz").optional().or(z.nan()),
  isActive: z.boolean().default(true),
  role: z.string().min(2, "Rol seçmelisiniz").default("Usta"),
  shiftStart: z.string().optional().nullable(),
  shiftEnd: z.string().optional().nullable(),
});

export type CreateMechanicInput = z.infer<typeof createMechanicSchema>;

export const updateMechanicSchema = createMechanicSchema.extend({
  id: z.string().min(1, "Geçerli usta kimliği bulunamadı"),
});

export type UpdateMechanicInput = z.infer<typeof updateMechanicSchema>;

export const shiftUpdateSchema = z.object({
  shiftStart: z.string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM formatı gerekli (örn: 08:00)")
    .nullable()
    .optional(),
  shiftEnd: z.string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM formatı gerekli (örn: 18:00)")
    .nullable()
    .optional(),
  workDays: z.array(
    z.enum(["MON","TUE","WED","THU","FRI","SAT","SUN"])
  ).optional(),
  dailyTarget: z.number().int().positive("Günlük hedef pozitif olmalıdır").nullable().optional(),
  avatarUrl: z.string().url("Geçerli bir URL giriniz").nullable().optional(),
});

export type ShiftUpdateInput = z.infer<typeof shiftUpdateSchema>;
