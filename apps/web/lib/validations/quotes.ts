import { z } from "zod";

export const createQuoteSchema = z.object({
  customerId: z.string().min(1, "Geçerli bir müşteri seçin"),
  vehicleId: z.string().optional().or(z.literal("")),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
});

export const addQuoteItemSchema = z.object({
  quoteId: z.string().min(1),
  itemType: z.enum(["PART", "LABOR", "OTHER"]),
  name: z.string().min(1, "İsim zorunludur"),
  partId: z.string().optional().or(z.literal("")),
  quantity: z.number().positive("Miktar 0'dan büyük olmalı"),
  unitPrice: z.number().min(0, "Birim fiyat 0 veya daha büyük olmalı"),
  taxRate: z.number().min(0).max(100).default(20),
  discount: z.number().min(0).default(0),
});

export const updateQuoteStatusSchema = z.object({
  quoteId: z.string().min(1),
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]),
  rejectionReason: z.string().optional(),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type AddQuoteItemInput = z.infer<typeof addQuoteItemSchema>;
export type UpdateQuoteStatusInput = z.infer<typeof updateQuoteStatusSchema>;
