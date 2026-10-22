import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import type { CreateOrderInput, UpdateOrderStatusInput } from "./orders.schema";

const orderInclude = {
  items: true,
  history: {
    orderBy: { createdAt: "asc" as const },
  },
};

export const createOrder = async (userId: string, input: CreateOrderInput) => {
  try {
    return await prisma.$transaction(async (tx) => {
      // Retry of the same checkout request: return its existing order.
      if (input.idempotencyKey) {
        const existingOrder = await tx.order.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          include: orderInclude,
        });

        if (existingOrder) {
          if (existingOrder.userId !== userId) {
            throw new ApiError(
              409,
              "IDEMPOTENCY_KEY_CONFLICT",
              "This checkout key has already been used",
            );
          }

          return existingOrder;
        }
      }

      // Verify that the address belongs to this user.
      const address = await tx.address.findFirst({
        where: {
          id: input.addressId,
          userId,
        },
      });

      if (!address) {
        throw new ApiError(404, "ADDRESS_NOT_FOUND", "Address not found");
      }

      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new ApiError(400, "CART_EMPTY", "Your cart is empty");
      }

      let subtotalPaise = 0;

      const orderItems = cart.items.map((item) => {
        const variant = item.variant;
        const product = variant.product;

        if (
          !variant.isActive ||
          !product.isActive ||
          product.deletedAt !== null
        ) {
          throw new ApiError(
            409,
            "ITEM_UNAVAILABLE",
            `${product.name} is no longer available`,
          );
        }

        if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
          throw new ApiError(
            400,
            "INVALID_QUANTITY",
            "Cart contains an invalid quantity",
          );
        }

        if (variant.stockQty < item.quantity) {
          throw new ApiError(
            409,
            "INSUFFICIENT_STOCK",
            `Insufficient stock for ${product.name}`,
          );
        }

        const totalPaise = variant.pricePaise * item.quantity;

        if (!Number.isSafeInteger(totalPaise)) {
          throw new ApiError(400, "INVALID_TOTAL", "Order total is too large");
        }

        subtotalPaise += totalPaise;

        return {
          variantId: variant.id,
          productName: product.name,
          variantLabel: variant.label,
          sku: variant.sku,
          unitPricePaise: variant.pricePaise,
          quantity: item.quantity,
          totalPaise,
        };
      });

      if (!Number.isSafeInteger(subtotalPaise)) {
        throw new ApiError(400, "INVALID_TOTAL", "Order total is too large");
      }

      const shippingPaise = 0;
      const discountPaise = 0;
      const totalPaise = subtotalPaise + shippingPaise - discountPaise;

      // Store a snapshot so later address edits do not change the order.
      const addressSnapshot = {
        fullName: address.fullName,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
        label: address.label,
      };

      // Reserve stock atomically to reduce overselling risk.
      for (const item of cart.items) {
        const result = await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            isActive: true,
            stockQty: { gte: item.quantity },
            product: {
              is: {
                isActive: true,
                deletedAt: null,
              },
            },
          },
          data: {
            stockQty: { decrement: item.quantity },
          },
        });

        if (result.count !== 1) {
          throw new ApiError(
            409,
            "INSUFFICIENT_STOCK",
            `Stock changed during checkout for ${item.variant.product.name}. Please review your cart.`,
          );
        }
      }

      const order = await tx.order.create({
        data: {
          userId,
          status: "PENDING_PAYMENT",
          paymentStatus: "PENDING",
          paymentMethod: "DEMO",
          subtotalPaise,
          shippingPaise,
          discountPaise,
          totalPaise,
          addressSnapshot: addressSnapshot as Prisma.InputJsonObject,
          idempotencyKey: input.idempotencyKey ?? null,
          items: {
            create: orderItems,
          },
          history: {
            create: {
              status: "PENDING_PAYMENT",
              note: "Order created; payment pending",
              changedById: userId,
            },
          },
        },
        include: orderInclude,
      });

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });
  } catch (error) {
    // A concurrent request may have created the same idempotency key.
    if (
      input.idempotencyKey &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existingOrder = await prisma.order.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: orderInclude,
      });

      if (existingOrder?.userId === userId) {
        return existingOrder;
      }

      throw new ApiError(
        409,
        "IDEMPOTENCY_KEY_CONFLICT",
        "This checkout key has already been used",
      );
    }

    throw error;
  }
};

export const getMyOrders = async (userId: string) => {
  return prisma.order.findMany({
    where: { userId },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
};

export const getMyOrderById = async (userId: string, orderId: string) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: orderInclude,
  });

  if (!order) {
    throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  return order;
};

export const cancelMyOrder = async (userId: string, orderId: string) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: { items: true },
    });

    if (!order) {
      throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found");
    }

    if (order.status === "CANCELLED") {
      return order;
    }

    if (order.status !== "PENDING_PAYMENT" && order.status !== "PLACED") {
      throw new ApiError(
        409,
        "ORDER_CANNOT_BE_CANCELLED",
        "This order can no longer be cancelled",
      );
    }

    // Refunds are not implemented, so paid orders cannot be cancelled here.
    if (order.paymentStatus === "PAID") {
      throw new ApiError(
        409,
        "REFUND_REQUIRED",
        "This order requires the refund workflow before cancellation",
      );
    }

    for (const item of order.items) {
      // Variant may have been deleted only if the schema permits it.
      // With onDelete: Restrict, ordered variants should still exist.
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: {
          stockQty: { increment: item.quantity },
        },
      });
    }

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        history: {
          create: {
            status: "CANCELLED",
            note: "Cancelled by customer",
            changedById: userId,
          },
        },
      },
      include: orderInclude,
    });

    return updatedOrder;
  });
};

const allowedTransitions: Record<string, string[]> = {
  PENDING_PAYMENT: ["PLACED", "CANCELLED"],
  PLACED: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const getAllOrders = async () => {
  return prisma.order.findMany({
    include: {
      ...orderInclude,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const updateOrderStatus = async (
  orderId: string,
  adminId: string,
  input: UpdateOrderStatusInput,
) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found");
    }

    if (order.status === input.status) {
      return tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: orderInclude,
      });
    }

    const previousStatus = order.status;
    const allowed = allowedTransitions[previousStatus] ?? [];

    if (!allowed.includes(input.status)) {
      throw new ApiError(
        409,
        "INVALID_STATUS_TRANSITION",
        `Cannot change order status from ${previousStatus} to ${input.status}`,
      );
    }

    // Payment confirmation must come from a trusted payment workflow.
    if (input.status === "PLACED" && order.paymentStatus !== "PAID") {
      throw new ApiError(
        409,
        "PAYMENT_NOT_CONFIRMED",
        "Payment must be confirmed before the order can be placed",
      );
    }

    if (input.status === "CANCELLED") {
      if (order.paymentStatus === "PAID") {
        throw new ApiError(
          409,
          "REFUND_REQUIRED",
          "Paid orders need a refund workflow before cancellation",
        );
      }

      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stockQty: { increment: item.quantity },
          },
        });
      }
    }

    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: input.status,
        history: {
          create: {
            status: input.status,
            note: input.note ?? `Status changed to ${input.status}`,
            changedById: adminId,
          },
        },
      },
      include: orderInclude,
    });

    // Record the admin action in Recent Activity.
    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "UPDATE",
        entity: "ORDER",
        entityId: orderId,
        metadata: {
          orderNumber: orderId,
          previousStatus,
          newStatus: input.status,
          note: input.note ?? null,
        },
      },
    });

    return updatedOrder;
  });
};
