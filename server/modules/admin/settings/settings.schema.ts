
import { z } from "zod";

export const updateSettingsSchema = z.object({
  storeName: z.string().trim().min(2).max(100),
  supportEmail: z.string().trim().email().max(150),
  phone: z.string().trim().min(7).max(20),
  address: z.string().trim().min(5).max(500),
  lowStockThreshold: z.number().int().min(1).max(100000),
});

export type UpdateSettingsInput = z.infer<
  typeof updateSettingsSchema
>;
