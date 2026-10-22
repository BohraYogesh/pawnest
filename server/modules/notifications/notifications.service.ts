
import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../../config/db";

type ListNotificationsOptions = {
  userId: string;
  page: number;
  limit: number;
  unreadOnly?: boolean;
};

export const listNotifications = async ({
  userId,
  page,
  limit,
  unreadOnly = false,
}: ListNotificationsOptions) => {
  const where: Prisma.NotificationWhereInput = {
    userId,
    ...(unreadOnly ? { readAt: null } : {}),
  };

  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId, readAt: null },
    }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    unreadCount,
  };
};

export const getNotificationById = async (
  userId: string,
  notificationId: string
) => {
  return prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });
};

export const markNotificationAsRead = async (
  userId: string,
  notificationId: string
) => {
  const result = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  if (result.count === 0) {
    return getNotificationById(userId, notificationId);
  }

  return getNotificationById(userId, notificationId);
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  return {
    updatedCount: result.count,
  };
};

export const deleteNotification = async (
  userId: string,
  notificationId: string
) => {
  const result = await prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId,
    },
  });

  return result.count > 0;
};

export const getUnreadNotificationCount = async (userId: string) => {
  return prisma.notification.count({
    where: {
      userId,
      readAt: null,
    },
  });
};

// Internal helper for creating notifications from trusted backend code.
export const createNotification = async (data: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
}) => {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
    },
  });
};
