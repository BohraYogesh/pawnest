
import { prisma } from "../../../config/db";
import { ApiError } from "../../../utils/ApiError";
import type {
  CreateVariantInput,
  UpdateVariantInput,
} from "./variants.schema";

export const createVariant = async (
  productId: string,
  input: CreateVariantInput
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

  const existingSku = await prisma.productVariant.findUnique({
    where: { sku: input.sku },
    select: { id: true },
  });

  if (existingSku) {
    throw new ApiError(409, "SKU_EXISTS", "This SKU already exists");
  }

  return prisma.productVariant.create({
    data: {
      productId,
      label: input.label,
      sku: input.sku,
      pricePaise: input.pricePaise,
      stockQty: input.stockQty,
      ...(input.isActive !== undefined && {
        isActive: input.isActive,
      }),
    },
  });
};

export const getProductVariants = async (productId: string) => {
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

  return prisma.productVariant.findMany({
    where: {
      productId,
      isActive: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};

export const updateVariant = async (
  productId: string,
  variantId: string,
  input: UpdateVariantInput
) => {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!product) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      productId,
    },
    select: { id: true },
  });

  if (!variant) {
    throw new ApiError(404, "VARIANT_NOT_FOUND", "Variant not found");
  }

  if (input.sku) {
    const existingSku = await prisma.productVariant.findFirst({
      where: {
        sku: input.sku,
        NOT: { id: variantId },
      },
      select: { id: true },
    });

    if (existingSku) {
      throw new ApiError(409, "SKU_EXISTS", "This SKU already exists");
    }
  }

  return prisma.productVariant.update({
    where: { id: variantId },
    data: input,
  });
};

export const deactivateVariant = async (
  productId: string,
  variantId: string
) => {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!product) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      productId,
    },
    select: { id: true, isActive: true },
  });

  if (!variant) {
    throw new ApiError(404, "VARIANT_NOT_FOUND", "Variant not found");
  }

  if (!variant.isActive) {
    return variant;
  }

  // Soft deactivate: preserve order and subscription history.
  return prisma.productVariant.update({
    where: { id: variantId },
    data: { isActive: false },
  });
};
