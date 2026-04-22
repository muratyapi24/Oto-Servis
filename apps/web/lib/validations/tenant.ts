import * as z from "zod";

export const updateTenantSchema = z.object({
  name: z.string().min(2, "Firma adı en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta giriniz").or(z.literal("")).optional(),
  phone: z.string().optional(),
  taxNumber: z.string().optional(),
  taxOffice: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default("Turkey"),
  website: z.string().url("Geçerli bir web adresi giriniz (http://...)").or(z.literal("")).optional(),
  logoUrl: z.string().url().or(z.literal("")).optional(),
  slogan: z.string().max(255).optional(),
  
  // JSON formunda tutulacak özel ayarlar
  settings: z.object({
    theme: z.enum(["light", "dark", "system"]).default("system").optional(),
    currency: z.string().default("TRY").optional(),
    timezone: z.string().default("Europe/Istanbul").optional(),
    notificationsEnabled: z.boolean().default(true).optional(),
    invoicePrefix: z.string().default("INV-").optional(),
    
    // YENİ EKLENEN ŞABLON ALANLARI
    logoUrl: z.string().url().or(z.literal("")).optional(),
    openingHours: z.object({
      weekdays: z.string().default("08:30 - 18:30").optional(),
      saturday: z.string().default("09:00 - 15:00").optional(),
      sunday: z.string().default("Closed").optional()
    }).optional(),
    serviceTypes: z.array(z.string()).optional(),
    notificationPreferences: z.object({
       sms: z.boolean().default(true),
       email: z.boolean().default(true),
       push: z.boolean().default(false),
    }).optional()
  }).optional()
});

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
