import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır."),
  rememberMe: z.boolean().default(false).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const customerLoginSchema = z.object({
  plate: z.string().min(5, "Geçerli bir araç plakası giriniz (örn: 34ABC123)."),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz (örn: 5551234567)."),
  rememberMe: z.boolean().default(false).optional(),
});

export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;

export const registerSchema = z.object({
  firstName: z.string().min(2, "Ad en az 2 karakter olmalıdır."),
  lastName: z.string().min(2, "Soyad en az 2 karakter olmalıdır."),
  companyName: z.string().min(3, "Firma adı en az 3 karakter olmalıdır."),
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz."),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır."),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Kullanım şartlarını kabul etmelisiniz.",
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
