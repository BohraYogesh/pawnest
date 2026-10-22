import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { LoginInput, RegisterInput } from "./auth.schema";
import { generateRefreshToken, hashToken, signAccessToken } from "./token.service";

const REFRESH_DAYS = 7;
// User na mile tab bhi bcrypt chalta hai, taaki response time se email ka pata na chale
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

type DbUser = {
  id: string; email: string; name: string; phone: string | null;
  role: string; avatarUrl: string | null; emailVerifiedAt: Date | null;
};

export function publicUser(u: DbUser) {
  return {
    id: u.id, email: u.email, name: u.name, phone: u.phone, role: u.role,
    avatarUrl: u.avatarUrl, emailVerified: u.emailVerifiedAt !== null,
  };
}

export async function registerUser(input: RegisterInput) {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) throw new ApiError(409, "EMAIL_TAKEN", "An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: { email: input.email, passwordHash, name: input.name, phone: input.phone },
  });
  return publicUser(user);
}

export async function loginUser(
  input: LoginInput,
  meta: { userAgent?: string; ip?: string }
) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const passwordOk = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);

  // Galat email aur galat password dono ka ek hi message
  if (!user || !passwordOk || user.deletedAt) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Incorrect email or password");
  }
  if (user.status === "BLOCKED") {
    throw new ApiError(403, "ACCOUNT_BLOCKED", "This account has been blocked");
  }

  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      familyId: crypto.randomUUID(),
      userAgent: meta.userAgent?.slice(0, 255),
      ip: meta.ip,
      expiresAt: new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  return {
    user: publicUser(user),
    accessToken: signAccessToken(user),
    refreshToken,
  };
}

export async function revokeRefreshToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}


export async function refreshUser(
  rawToken: string | undefined,
  meta: { userAgent?: string; ip?: string }
) {
  if (!rawToken) {
    throw new ApiError(401, "UNAUTHENTICATED", "Please log in again");
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: true },
  });

  if (!stored) {
    throw new ApiError(401, "REFRESH_TOKEN_INVALID", "Please log in again");
  }

  const now = new Date();

  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId, revokedAt: null },
      data: { revokedAt: now },
    });

    throw new ApiError(
      401,
      "REFRESH_TOKEN_REVOKED",
      "Session is no longer valid. Please log in again."
    );
  }

  if (stored.expiresAt <= now) {
    await prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: now },
    });

    throw new ApiError(
      401,
      "REFRESH_TOKEN_EXPIRED",
      "Session expired. Please log in again."
    );
  }

  const user = stored.user;

  if (user.deletedAt || user.status === "BLOCKED") {
    await prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId, revokedAt: null },
      data: { revokedAt: now },
    });

    throw new ApiError(401, "UNAUTHENTICATED", "Please log in again");
  }

  const nextRefreshToken = generateRefreshToken();

  const rotated = await prisma.$transaction(async (tx) => {
    const consumed = await tx.refreshToken.updateMany({
      where: {
        id: stored.id,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        revokedAt: now,
        lastUsedAt: now,
      },
    });

    if (consumed.count !== 1) return false;

    await tx.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(nextRefreshToken),
        familyId: stored.familyId,
        userAgent: meta.userAgent?.slice(0, 255),
        ip: meta.ip,
        expiresAt: new Date(now.getTime() + REFRESH_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return true;
  });

  if (!rotated) {
    await prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    throw new ApiError(
      401,
      "REFRESH_TOKEN_REUSED",
      "Session is no longer valid. Please log in again."
    );
  }

  return {
    user: publicUser(user),
    accessToken: signAccessToken(user),
    refreshToken: nextRefreshToken,
  };
}


export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt || user.status === "BLOCKED") {
    throw new ApiError(401, "UNAUTHENTICATED", "Please log in");
  }
  return publicUser(user);
}