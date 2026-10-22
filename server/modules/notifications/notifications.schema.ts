
import { z } from "zod";

export const notificationIdSchema = z.object({
  id: z.string().min(1, "Notification ID is required"),
});

export const notificationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  unreadOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export const createNotificationSchema = z.object({
  userId: z.string().min(1),
  type: z.string().min(1),
  title: z.string().trim().min(1).max(150),
  body: z.string().trim().min(1).max(2000),
});

export type NotificationListQuery = z.infer<
  typeof notificationListQuerySchema
>;

export type CreateNotificationInput = z.infer<
  typeof createNotificationSchema
>;
