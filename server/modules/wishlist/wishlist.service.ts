
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";

export const addToWishlist = async (
  userId: string,
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

  const existing = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  if (existing) {
    return {
      item: existing,
      alreadyExists: true,
    };
  }

  const item = await prisma.wishlistItem.create({
    data: {
      userId,
      productId,
    },
  });

  return {
    item,
    alreadyExists: false,
  };
};

export const getWishlist = async (userId: string) => {
  return prisma.wishlistItem.findMany({
    where: {
      userId,
      product: {
        isActive: true,
        deletedAt: null,
      },
    },
    include: {
      product: {
        include: {
          category: true,
          images: {
            orderBy: {
              position: "asc",
            },
          },
          variants: {
            where: {
              isActive: true,
            },
            orderBy: {
              pricePaise: "asc",
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const removeFromWishlist = async (
  userId: string,
  productId: string
) => {
  const result = await prisma.wishlistItem.deleteMany({
    where: {
      userId,
      productId,
    },
  });

  if (result.count === 0) {
    throw new ApiError(
      404,
      "WISHLIST_ITEM_NOT_FOUND",
      "Product was not found in your wishlist"
    );
  }

  return { productId };
};

export const checkWishlist = async (
  userId: string,
  productId: string
) => {
  const item = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
    select: {
      id: true,
    },
  });

  return {
    productId,
    inWishlist: Boolean(item),
  };
};
