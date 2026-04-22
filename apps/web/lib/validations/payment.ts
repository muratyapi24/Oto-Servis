import { z } from "zod";

export const checkDetailsSchema = z.object({
  checkNumber: z.string().min(1).max(100),
  bankName: z.string().min(1).max(255),
  dueDate: z.date(),
  drawerName: z.string().min(1).max(255),
});

export const createPaymentSchema = z
  .object({
    invoiceId: z.string().uuid().optional(),
    customerId: z.string().uuid().optional(),
    supplierId: z.string().uuid().optional(),
    paymentType: z.enum(["INCOMING", "OUTGOING"]).default("INCOMING"),
    amount: z.number().positive(),
    paymentMethod: z.enum([
      "CASH",
      "CREDIT_CARD",
      "BANK_TRANSFER",
      "IYZICO",
      "PAYTR",
      "CHECK",
      "PROMISSORY_NOTE",
    ]),
    paymentDate: z.date().default(() => new Date()),
    notes: z.string().max(1000).optional(),
    checkDetails: checkDetailsSchema.optional(),
  })
  .refine(
    (data) => {
      if (["CHECK", "PROMISSORY_NOTE"].includes(data.paymentMethod)) {
        return !!data.checkDetails;
      }
      return true;
    },
    { message: "Cek/senet icin detay bilgileri zorunludur" }
  );
export type CreatePaymentInput = z.input<typeof createPaymentSchema>;
