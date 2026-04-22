import * as z from "zod";

export const createCustomerSchema = z.object({
  type: z.enum(["INDIVIDUAL", "CORPORATE"], {
    required_error: "Müşteri tipi seçimi zorunludur.",
  }),
  
  // Bireysel alanlar (Şartlı zorunluluk)
  firstName: z.string().optional().refine((val) => val !== undefined, {
    message: "Şahıs müşterilerinde Ad alanı zorunludur.",
  }),
  lastName: z.string().optional().refine((val) => val !== undefined, {
    message: "Şahıs müşterilerinde Soyad alanı zorunludur.",
  }),
  
  // Kurumsal alanlar
  companyName: z.string().optional().refine((val) => val !== undefined, {
    message: "Kurumsal müşterilerde Firma Adı zorunludur.",
  }),
  contactPerson: z.string().optional(),
  
  // Ortak iletişim alanları
  email: z.string().email("Geçerli bir e-posta adresi giriniz.").optional().or(z.literal('')),
  phone: z.string()
    .min(10, "Telefon numarası en az 10 karakter olmalıdır.")
    .max(15, "Telefon numarası geçersiz."),
  secondaryPhone: z.string().optional(),
  
  // Fatura & Adres bilgileri
  taxOffice: z.string().optional(),
  taxNumber: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  
  // Ek veriler
  notes: z.string().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema.extend({
  id: z.string().min(1, "Müşteri ID'si gereklidir."),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
