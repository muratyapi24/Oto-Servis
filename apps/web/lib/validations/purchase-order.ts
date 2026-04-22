import * as z from "zod";

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid(),
  expectedDate: z.date().optional(),
  notes: z.string().max(1000).optional(),
  items: z
    .array(
      z.object({
        partId: z.string().uuid(),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        taxRate: z.number().min(0).max(100).default(20),
      })
    )
    .min(1, "En az bir kalem gereklidir"),
});
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;

export const receiveItemsSchema = z.object({
  items: z.array(
    z.object({
      itemId: z.string().uuid(),
      receivedQuantity: z.number().min(0),
    })
  ),
});
export type ReceiveItemsInput = z.infer<typeof receiveItemsSchema>;
