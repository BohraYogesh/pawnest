
import { prisma } from "../../../config/db";
import { ApiError } from "../../../utils/ApiError";
import cloudinary from "../../../config/cloudinary";
import { Readable } from "node:stream";

export async function getAdminProfile(userId: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      role: true,
      emailVerifiedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "ADMIN_NOT_FOUND", "Admin profile not found");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: user.role,
    emailVerified: user.emailVerifiedAt !== null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function updateAdminProfile(
  userId: string,
  input: { name: string; phone?: string | null },
) {
  const existingUser = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      phone: true,
    },
  });

  if (!existingUser) {
    throw new ApiError(404, "ADMIN_NOT_FOUND", "Admin profile not found");
  }

  // Update the profile first.
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      ...(input.phone !== undefined
        ? { phone: input.phone || null }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      role: true,
      emailVerifiedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Record the successful profile update.
  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: "UPDATE",
      entity: "ADMIN_PROFILE",
      entityId: user.id,
      metadata: {
        updatedFields: [
          ...(existingUser.name !== user.name ? ["name"] : []),
          ...(existingUser.phone !== user.phone ? ["phone"] : []),
        ],
      },
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: user.role,
    emailVerified: user.emailVerifiedAt !== null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getRecentAdminActivity(userId: string) {
  const activities = await prisma.auditLog.findMany({
    where: {
      actorId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
    select: {
      id: true,
      action: true,
      entity: true,
      entityId: true,
      metadata: true,
      createdAt: true,
    },
  });

  return activities;
}

export async function uploadAdminAvatar(
  userId: string,
  buffer: Buffer,
) {
  const existingUser = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!existingUser) {
    throw new ApiError(
      404,
      "ADMIN_NOT_FOUND",
      "Admin profile not found",
    );
  }

  const avatarUrl = await new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "pawnest/admin-avatars",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Avatar upload failed"));
          return;
        }

        resolve(result.secure_url);
      },
    );

    Readable.from(buffer).pipe(stream);
  });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      role: true,
      emailVerifiedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: "UPDATE",
      entity: "ADMIN_PROFILE",
      entityId: userId,
      metadata: {
        updatedFields: ["avatarUrl"],
      },
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: user.role,
    emailVerified: user.emailVerifiedAt !== null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}