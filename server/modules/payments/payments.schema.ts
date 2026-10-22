
import { z } from "zod";

export const demoPaymentSchema = z.object({
  result: z.enum(["SUCCESS", "FAILED"]),
});

export const paymentOrderIdSchema = z.object({
  id: z.string().min(1, "Order ID is required"),
});

export type DemoPaymentInput = z.infer<typeof demoPaymentSchema>;
