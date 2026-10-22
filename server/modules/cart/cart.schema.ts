
import { z } from "zod";

export const addCartItemSchema = z.object({
  variantId: z.string().trim().min(1, "Variant ID is required"),
  quantity: z.number().int().positive().max(100).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive().max(100),
});

export const cartItemIdSchema = z.object({
  itemId: z.string().trim().min(1, "Cart item ID is required"),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
