
import { z } from "zod";

export const createVariantSchema = z.object({
  label: z.string().trim().min(1, "Variant label is required"),
  sku: z.string().trim().min(3, "SKU must be at least 3 characters"),
  pricePaise: z.number().int().positive("Price must be greater than zero"),
  stockQty: z.number().int().min(0).default(0),
  isActive: z.boolean().optional(),
});

export const updateVariantSchema = z
  .object({
    label: z.string().trim().min(1).optional(),
    sku: z.string().trim().min(3).optional(),
    pricePaise: z.number().int().positive().optional(),
    stockQty: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type CreateVariantInput = z.infer<
  typeof createVariantSchema
>;

export type UpdateVariantInput = z.infer<
  typeof updateVariantSchema
>;
