
import { z } from "zod";

export const createAddressSchema = z.object({
  label: z.string().trim().max(50).optional().nullable(),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^[0-9]{10}$/, {
    message: "Phone number must be 10 digits",
  }),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: z.string().trim().regex(/^[0-9]{6}$/, {
    message: "Pincode must be 6 digits",
  }),
  country: z.string().trim().min(2).max(100).default("India"),
  isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema = createAddressSchema
  .partial()
  .extend({
    country: z.string().trim().min(2).max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const addressIdSchema = z.object({
  id: z.string().trim().min(1, "Address ID is required"),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
