import { z } from "zod";

export const invoiceItemSchema = z.object({
  type: z.enum(["LABOR", "PART", "SERVICE"]),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0).max(100).default(20),
  discountRate: z.number().min(0).max(100).default(0),
  sortOrder: z.number().int().min(0).default(0),
});
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid().optional(),
  serviceOrderId: z.string().uuid().optional(),
  dueDate: z.date().optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(invoiceItemSchema).default([]),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(["SENT", "PAID", "CANCELLED"]),
});
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
