import * as z from "zod";

export const createStockCountSchema = z.object({
  locationId: z.string().uuid().optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  notes: z.string().max(1000).optional(),
});
export type CreateStockCountInput = z.infer<typeof createStockCountSchema>;

export const updateStockCountItemSchema = z.object({
  actualQuantity: z.number().int().min(0),
});
export type UpdateStockCountItemInput = z.infer<typeof updateStockCountItemSchema>;
