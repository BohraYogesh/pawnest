
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import type {
  CreateReviewInput,
  UpdateReviewInput,
  UpdateReviewStatusInput,
} from "./reviews.schema";

const reviewInclude = {
  user: {
    select: {
      id: true,
      name: true,
    },
  },
};

const refreshProductRating = async (
  tx: Prisma.TransactionClient,
  productId: string
) => {
  const aggregate = await tx.review.aggregate({
    where: {
      productId,
      status: "APPROVED",
    },
    _avg: {
      rating: true,
    },
    _count: {
      _all: true,
    },
  });

  await tx.product.update({
    where: { id: productId },
    data: {
      avgRating: aggregate._avg.rating ?? 0,
      reviewCount: aggregate._count._all,
    },
  });
};

export const createReview = async (
  userId: string,
  productId: string,
  input: CreateReviewInput
) => {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isActive: true,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!product) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  const deliveredOrder = await prisma.order.findFirst({
    where: {
      userId,
      status: "DELIVERED",
      items: {
        some: {
          variant: {
            productId,
          },
        },
      },
    },
    select: { id: true },
  });

  try {
    return await prisma.review.create({
      data: {
        userId,
        productId,
        rating: input.rating,
        comment: input.comment,
        status: "PENDING",
        isVerifiedPurchase: Boolean(deliveredOrder),
      },
      include: reviewInclude,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError(
        409,
        "REVIEW_ALREADY_EXISTS",
        "You have already reviewed this product"
      );
    }

    throw error;
  }
};

export const getApprovedProductReviews = async (
  productId: string
) => {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isActive: true,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!product) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  return prisma.review.findMany({
    where: {
      productId,
      status: "APPROVED",
    },
    include: reviewInclude,
    orderBy: { createdAt: "desc" },
  });
};

export const getMyReviews = async (userId: string) => {
  return prisma.review.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const updateMyReview = async (
  userId: string,
  reviewId: string,
  input: UpdateReviewInput
) => {
  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      userId,
    },
  });

  if (!review) {
    throw new ApiError(404, "REVIEW_NOT_FOUND", "Review not found");
  }

  if (review.status !== "PENDING") {
    throw new ApiError(
      409,
      "REVIEW_NOT_EDITABLE",
      "Only pending reviews can be edited"
    );
  }

  return prisma.review.update({
    where: { id: review.id },
    data: input,
    include: reviewInclude,
  });
};

export const deleteMyReview = async (
  userId: string,
  reviewId: string
) => {
  return prisma.$transaction(async (tx) => {
    const review = await tx.review.findFirst({
      where: {
        id: reviewId,
        userId,
      },
    });

    if (!review) {
      throw new ApiError(404, "REVIEW_NOT_FOUND", "Review not found");
    }

    await tx.review.delete({
      where: { id: review.id },
    });

    if (review.status === "APPROVED") {
      await refreshProductRating(tx, review.productId);
    }

    return { id: reviewId };
  });
};

export const getAllReviews = async () => {
  return prisma.review.findMany({
    include: {
      ...reviewInclude,
      product: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};


export const updateReviewStatus = async (
  reviewId: string,
  input: UpdateReviewStatusInput,
  adminId: string,
) => {
  return prisma.$transaction(async (tx) => {
    const review = await tx.review.findUnique({
      where: { id: reviewId },
      include: {
        ...reviewInclude,
        product: {
          select: { name: true },
        },
      },
    });

    if (!review) {
      throw new ApiError(404, "REVIEW_NOT_FOUND", "Review not found");
    }

    const previousStatus = review.status;
    const newStatus = input.status;

    // Don't create duplicate activity if status hasn't changed.
    if (previousStatus === newStatus) {
      return tx.review.findUniqueOrThrow({
        where: { id: reviewId },
        include: reviewInclude,
      });
    }

    const updatedReview = await tx.review.update({
      where: { id: reviewId },
      data: { status: newStatus },
      include: reviewInclude,
    });

    await refreshProductRating(tx, review.productId);

    const action =
      newStatus === "APPROVED"
        ? "APPROVE"
        : newStatus === "HIDDEN"
          ? "HIDE"
          : "UPDATE";

    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action,
        entity: "REVIEW",
        entityId: reviewId,
        metadata: {
          customerName: review.user.name,
          productName: review.product.name,
          rating: review.rating,
          previousStatus,
          newStatus,
        },
      },
    });

    return updatedReview;
  });
};

