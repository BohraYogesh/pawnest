import { z } from "zod";

export const listUsersSchema = z.object({
  search: z.string().trim().max(100).optional(),
  role: z.enum(["CUSTOMER", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "BLOCKED"]).optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(8),
  sort: z.enum(["newest", "oldest"]).default("newest"),
}).refine(
  (data) => !data.from || !data.to || data.from <= data.to,
  {
    message: "'from' date must be before or equal to 'to' date",
    path: ["from"],
  },
);

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED"]),
});

export type ListUsersQuery = z.infer<typeof listUsersSchema>;
export type UpdateUserStatusInput = z.infer<
  typeof updateUserStatusSchema
>;
