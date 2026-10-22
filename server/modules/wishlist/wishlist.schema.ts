
import { z } from "zod";

export const productIdSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
});

export type ProductIdInput = z.infer<typeof productIdSchema>;
