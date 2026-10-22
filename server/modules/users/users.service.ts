
import { prisma } from "../../config/db";
import type { Prisma, UserStatus } from "@prisma/client";

type ListUsersInput = {
  search?: string;
  role?: "CUSTOMER" | "ADMIN";
  status?: "ACTIVE" | "BLOCKED";
  from?: string;
  to?: string;
  page: number;
  limit: number;
  sort?: "newest" | "oldest";
};

export async function listUsers(filters: ListUsersInput) {
  const {
    search,
    role,
    status,
    from,
    to,
    page,
    limit,
    sort = "newest",
  } = filters;

  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            pets: true,
            orders: true,
          },
        },
        orders: {
          where: { status: "DELIVERED" },
          select: { totalPaise: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map(({ orders, ...user }) => ({
      ...user,
      totalSpentPaise: orders.reduce(
        (sum, order) => sum + order.totalPaise,
        0,
      ),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUserDetails(userId: string) {
  return prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      role: true,
      status: true,
      createdAt: true,
      pets: {
        orderBy: { createdAt: "desc" },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalPaise: true,
          createdAt: true,
          items: {
            select: {
              productName: true,
              variantLabel: true,
              quantity: true,
            },
          },
        },
      },
      _count: {
        select: {
          pets: true,
          orders: true,
        },
      },
    },
  });
}


export async function updateUserStatus(
  userId: string,
  status: UserStatus,
  adminId: string,
) {
  return prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!existingUser) return null;

    // Admin accounts should not be blocked through customer management.
    if (existingUser.role === "ADMIN") {
      throw new Error(
        "Admin accounts cannot be blocked from this page",
      );
    }

    // Avoid duplicate activity when the status hasn't changed.
    if (existingUser.status === status) {
      return {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        status: existingUser.status,
      };
    }

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    const isBlocking = status === "BLOCKED";

    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: isBlocking ? "BLOCK" : "UNBLOCK",
        entity: "USER",
        entityId: userId,
        metadata: {
          name: updatedUser.name,
          email: updatedUser.email,
          previousStatus: existingUser.status,
          newStatus: updatedUser.status,
        },
      },
    });

    return updatedUser;
  });
}

