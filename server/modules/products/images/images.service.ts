
import { prisma } from "../../../config/db";
import { ApiError } from "../../../utils/ApiError";
import type {
  CreateImageInput,
  UpdateImageInput,
} from "./images.schema";

export const createProductImage = async (
  productId: string,
  input: CreateImageInput
) => {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!product) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  return prisma.productImage.create({
    data: {
      productId,
      url: input.url,
      position: input.position,
    },
  });
};

export const getProductImages = async (productId: string) => {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!product) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  return prisma.productImage.findMany({
    where: {
      productId,
    },
    orderBy: [
      { position: "asc" },
    ],
  });
};

export const updateProductImage = async (
  productId: string,
  imageId: string,
  input: UpdateImageInput
) => {
  const image = await prisma.productImage.findFirst({
    where: {
      id: imageId,
      productId,
    },
    select: {
      id: true,
    },
  });

  if (!image) {
    throw new ApiError(404, "IMAGE_NOT_FOUND", "Product image not found");
  }

  return prisma.productImage.update({
    where: {
      id: imageId,
    },
    data: {
      position: input.position,
    },
  });
};

export const deleteProductImage = async (
  productId: string,
  imageId: string
) => {
  const image = await prisma.productImage.findFirst({
    where: {
      id: imageId,
      productId,
    },
    select: {
      id: true,
    },
  });

  if (!image) {
    throw new ApiError(404, "IMAGE_NOT_FOUND", "Product image not found");
  }

  await prisma.productImage.delete({
    where: {
      id: imageId,
    },
  });

  return { id: imageId };
};
