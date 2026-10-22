
import type { Request, Response } from "express";
import {
  notificationIdSchema,
  notificationListQuerySchema,
} from "./notifications.schema";
import * as notificationService from "./notifications.service";

export const list = async (req: Request, res: Response) => {
  const query = notificationListQuerySchema.parse(req.query);

  const result = await notificationService.listNotifications({
    userId: req.user!.id,
    page: query.page,
    limit: query.limit,
    unreadOnly: query.unreadOnly,
  });

  res.status(200).json({
    success: true,
    message: "Notifications fetched successfully",
    data: result.notifications,
    pagination: result.pagination,
    unreadCount: result.unreadCount,
  });
};

export const unreadCount = async (req: Request, res: Response) => {
  const count = await notificationService.getUnreadNotificationCount(
    req.user!.id
  );

  res.status(200).json({
    success: true,
    data: { unreadCount: count },
  });
};

export const markRead = async (req: Request, res: Response) => {
  const { id } = notificationIdSchema.parse({
    id: req.params.id as string,
  });

  const notification = await notificationService.markNotificationAsRead(
    req.user!.id,
    id
  );

  if (!notification) {
    res.status(404).json({
      success: false,
      message: "Notification not found",
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Notification marked as read",
    data: notification,
  });
};

export const markAllRead = async (req: Request, res: Response) => {
  const result = await notificationService.markAllNotificationsAsRead(
    req.user!.id
  );

  res.status(200).json({
    success: true,
    message: "All notifications marked as read",
    data: result,
  });
};

export const remove = async (req: Request, res: Response) => {
  const { id } = notificationIdSchema.parse({
    id: req.params.id as string,
  });

  const deleted = await notificationService.deleteNotification(
    req.user!.id,
    id
  );

  if (!deleted) {
    res.status(404).json({
      success: false,
      message: "Notification not found",
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Notification deleted successfully",
  });
};
