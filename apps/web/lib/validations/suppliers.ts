import * as z from "zod";

export const supplierSchema = z.object({
  name: z.string().min(2, "Firma/Tedarikçi adı en az 2 karakter olmalıdır"),
  contactPerson: z.string().optional().or(z.literal("")),
  email: z.string().email("Geçerli bir e-posta adresi giriniz").optional().or(z.literal("")),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  taxOffice: z.string().optional().or(z.literal("")),
  taxNumber: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
