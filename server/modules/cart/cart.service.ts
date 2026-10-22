
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import type {
  AddCartItemInput,
  UpdateCartItemInput,
} from "./cart.schema";

const getOrCreateCart = async (userId: string) => {
  return prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true },
  });
};

export const getCart = async (userId: string) => {
  const cart = await getOrCreateCart(userId);

  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: {
      variant: {
        include: {
          product: {
            include: {
              images: {
                orderBy: { position: "asc" },
              },
              category: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedItems = items.map((item) => {
    const unitPricePaise = item.variant.pricePaise;

    return {
      id: item.id,
      variantId: item.variantId,
      productId: item.variant.productId,
      productName: item.variant.product.name,
      variantLabel: item.variant.label,
      sku: item.variant.sku,
      quantity: item.quantity,
      unitPricePaise,
      subtotalPaise: unitPricePaise * item.quantity,
      stockQty: item.variant.stockQty,
      variantIsActive: item.variant.isActive,
      productIsActive:
        item.variant.product.isActive &&
        item.variant.product.deletedAt === null,
      images: item.variant.product.images,
      category: item.variant.product.category,
    };
  });

  const totalPaise = formattedItems.reduce(
    (total, item) => total + item.subtotalPaise,
    0
  );

  return {
    id: cart.id,
    items: formattedItems,
    itemCount: formattedItems.reduce(
      (total, item) => total + item.quantity,
      0
    ),
    totalPaise,
  };
};

export const addToCart = async (
  userId: string,
  input: AddCartItemInput
) => {
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: input.variantId,
      isActive: true,
      product: {
        isActive: true,
        deletedAt: null,
      },
    },
    select: {
      id: true,
      stockQty: true,
    },
  });

  if (!variant) {
    throw new ApiError(
      404,
      "VARIANT_NOT_FOUND",
      "Active product variant not found"
    );
  }

  if (variant.stockQty < 1) {
    throw new ApiError(409, "OUT_OF_STOCK", "This item is out of stock");
  }

  const cart = await getOrCreateCart(userId);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId: variant.id,
        },
      },
    });

    const newQuantity = (existing?.quantity ?? 0) + input.quantity;

    if (newQuantity > variant.stockQty) {
      throw new ApiError(
        409,
        "INSUFFICIENT_STOCK",
        `Only ${variant.stockQty} item(s) are currently in stock`
      );
    }

    if (existing) {
      return tx.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQuantity },
      });
    }

    return tx.cartItem.create({
      data: {
        cartId: cart.id,
        variantId: variant.id,
        quantity: input.quantity,
      },
    });
  });
};

export const updateCartItem = async (
  userId: string,
  itemId: string,
  input: UpdateCartItemInput
) => {
  const cart = await getOrCreateCart(userId);

  return prisma.$transaction(async (tx) => {
    const item = await tx.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!item) {
      throw new ApiError(404, "CART_ITEM_NOT_FOUND", "Cart item not found");
    }

    if (
      !item.variant.isActive ||
      !item.variant.product.isActive ||
      item.variant.product.deletedAt !== null
    ) {
      throw new ApiError(
        409,
        "ITEM_UNAVAILABLE",
        "This product is no longer available"
      );
    }

    if (input.quantity > item.variant.stockQty) {
      throw new ApiError(
        409,
        "INSUFFICIENT_STOCK",
        `Only ${item.variant.stockQty} item(s) are currently in stock`
      );
    }

    return tx.cartItem.update({
      where: { id: item.id },
      data: { quantity: input.quantity },
    });
  });
};

export const removeCartItem = async (
  userId: string,
  itemId: string
) => {
  const cart = await getOrCreateCart(userId);

  const result = await prisma.cartItem.deleteMany({
    where: {
      id: itemId,
      cartId: cart.id,
    },
  });

  if (result.count === 0) {
    throw new ApiError(404, "CART_ITEM_NOT_FOUND", "Cart item not found");
  }

  return { itemId };
};

export const clearCart = async (userId: string) => {
  const cart = await getOrCreateCart(userId);

  const result = await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  return {
    message: "Cart cleared successfully",
    removedCount: result.count,
  };
};
