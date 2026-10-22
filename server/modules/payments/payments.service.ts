
import { randomUUID } from "node:crypto";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import type { DemoPaymentInput } from "./payments.schema";

export const processDemoPayment = async (
  userId: string,
  orderId: string,
  input: DemoPaymentInput
) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: true,
        history: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) {
      throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found");
    }

    if (order.paymentMethod !== "DEMO") {
      throw new ApiError(
        409,
        "PAYMENT_METHOD_NOT_SUPPORTED",
        "This order is not configured for demo payment"
      );
    }

    // Make repeated successful requests safe.
    if (
      order.paymentStatus === "PAID" &&
      order.status === "PLACED"
    ) {
      return order;
    }

    if (order.status !== "PENDING_PAYMENT") {
      throw new ApiError(
        409,
        "ORDER_NOT_PAYABLE",
        "This order is not awaiting payment"
      );
    }

    if (order.paymentStatus === "PAID") {
      throw new ApiError(
        409,
        "PAYMENT_STATE_CONFLICT",
        "Payment is already marked paid"
      );
    }

    if (input.result === "FAILED") {
      return tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "FAILED",
          transactionRef: `DEMO_FAIL_${randomUUID()}`,
        },
        include: {
          items: true,
          history: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }

    const transactionRef = `DEMO_${randomUUID()}`;

    return tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        transactionRef,
        paidAt: new Date(),
        status: "PLACED",
        history: {
          create: {
            status: "PLACED",
            note: "Demo payment successful",
            changedById: userId,
          },
        },
      },
      include: {
        items: true,
        history: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  });
};

export const getOrderPaymentStatus = async (
  userId: string,
  orderId: string
) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      transactionRef: true,
      paidAt: true,
      totalPaise: true,
    },
  });

  if (!order) {
    throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  return order;
};
