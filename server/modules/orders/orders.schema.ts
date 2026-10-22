
import { z } from "zod";

export const createOrderSchema = z.object({
  addressId: z.string().min(1, "Address ID is required"),
  idempotencyKey: z.string().min(1).max(100).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PLACED",
    "PACKED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]),
  note: z.string().max(500).optional(),
});

export const orderIdSchema = z.object({
  id: z.string().min(1, "Order ID is required"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<
  typeof updateOrderStatusSchema
>;
