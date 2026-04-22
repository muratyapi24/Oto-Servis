import * as z from "zod";

export const createInvoiceSchema = z.object({
  customerId: z.string().min(1, "Müşteri seçimi zorunludur."),
  type: z.enum(["SALES", "PURCHASE"]),
  status: z.enum(["DRAFT", "SENT", "PAID", "CANCELLED"]),
  issueDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()).optional(),
  
  // Detaylar (İleride kalem kalem fatura için)  
  subTotal: z.number().min(0),
  taxAmount: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  totalAmount: z.number().min(0, "Toplam tutar 0 veya daha fazla olmalıdır."),
  
  notes: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const recordPaymentSchema = z.object({
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  invoiceId: z.string().optional(),
  amount: z.number().positive("Geçerli bir tutar giriniz."),
  paymentMethod: z.enum(["CASH", "CREDIT_CARD", "BANK_TRANSFER", "CHECK", "PROMISSORY_NOTE"]),
  paymentType: z.enum(["INCOMING", "OUTGOING"]),
  paymentDate: z.string().or(z.date()),
  notes: z.string().optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
