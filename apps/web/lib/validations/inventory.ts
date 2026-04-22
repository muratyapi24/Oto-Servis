import * as z from "zod";

export const createPartCategorySchema = z.object({
  name: z.string().min(2, "Kategori adı en az 2 karakter olmalıdır"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});
export type CreatePartCategoryInput = z.infer<typeof createPartCategorySchema>;

export const updatePartCategorySchema = createPartCategorySchema.extend({
  id: z.string().uuid(),
});
export type UpdatePartCategoryInput = z.infer<typeof updatePartCategorySchema>;

export const createPartSchema = z.object({
  categoryId: z.string().uuid("Lütfen geçerli bir kategori seçiniz"),
  partNumber: z.string().min(2, "Parça/Barkod kodu en az 2 karakter olmalıdır"),
  name: z.string().min(2, "Parça adı en az 2 karakter olmalıdır"),
  description: z.string().optional(),
  brand: z.string().optional(),
  unit: z.string().min(1, "Birim değeri gereklidir"),
  purchasePrice: z.number().min(0, "Alış fiyatı negatif olamaz"),
  sellingPrice: z.number().min(0, "Satış fiyatı negatif olamaz"),
  taxRate: z.number().min(0).max(100, "KDV %0-100 arasında olmalıdır"),
  minStockLevel: z.number().int().min(0).default(0),
  currentStock: z.number().int().min(0).default(0),
  location: z.string().optional(),
  supplierName: z.string().optional(),
  isActive: z.boolean().default(true),
});
export type CreatePartInput = z.infer<typeof createPartSchema>;

export const updatePartSchema = createPartSchema.extend({
  id: z.string().uuid(),
});
export type UpdatePartInput = z.infer<typeof updatePartSchema>;
