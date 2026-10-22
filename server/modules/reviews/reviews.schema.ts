
import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(5000),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().min(3).max(5000).optional(),
}).refine(
  (data) => data.rating !== undefined || data.comment !== undefined,
  { message: "Provide a rating or comment to update" }
);

export const reviewIdSchema = z.object({
  id: z.string().min(1),
});

export const productReviewParamsSchema = z.object({
  productId: z.string().min(1),
});

export const updateReviewStatusSchema = z.object({
  status: z.enum(["APPROVED", "HIDDEN", "PENDING"]),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type UpdateReviewStatusInput = z.infer<
  typeof updateReviewStatusSchema
>;
