import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(254);

export const registerSchema = z.object({
  email,
  password: z.string().min(8, "At least 8 characters").max(72, "Maximum 72 characters"),
  name: z.string().trim().min(2).max(60),
  phone: z.string().trim().min(7).max(20).optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;