
import { z } from "zod";

export const createImageSchema = z.object({
  url: z.string().trim().url("Please provide a valid image URL"),
  position: z.number().int().min(0).optional().default(0),
});


export const uploadImageSchema = z.object({
  position: z.number().int().min(0).optional().default(0),
});


export const updateImageSchema = z
  .object({
    position: z.number().int().min(0),
  })
  .strict();

export type CreateImageInput = z.infer<typeof createImageSchema>;
export type UpdateImageInput = z.infer<typeof updateImageSchema>;
