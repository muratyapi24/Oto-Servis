import * as z from "zod";

export const createStockTransferSchema = z
  .object({
    fromLocationId: z.string().uuid(),
    toLocationId: z.string().uuid(),
    notes: z.string().max(1000).optional(),
    items: z
      .array(
        z.object({
          partId: z.string().uuid(),
          quantity: z.number().positive(),
        })
      )
      .min(1),
  })
  .refine((data) => data.fromLocationId !== data.toLocationId, {
    message: "Kaynak ve hedef lokasyon aynı olamaz",
  });
export type CreateStockTransferInput = z.infer<typeof createStockTransferSchema>;
