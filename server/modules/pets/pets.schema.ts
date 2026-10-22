
import { z } from "zod";

const petTypes = [
  "DOG",
  "CAT",
  "BIRD",
  "FISH",
  "SMALL_PET",
  "OTHER",
] as const;

export const createPetSchema = z.object({
  name: z.string().trim().min(1, "Pet name is required").max(100),
  type: z.enum(petTypes),
  breed: z.string().trim().max(100).optional(),
  birthDate: z.coerce.date().optional(),
  weightKg: z.coerce.number().positive().max(999.99).optional(),
  photoUrl: z.string().url().optional(),
});

export const updatePetSchema = createPetSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type CreatePetInput = z.infer<typeof createPetSchema>;
export type UpdatePetInput = z.infer<typeof updatePetSchema>;
