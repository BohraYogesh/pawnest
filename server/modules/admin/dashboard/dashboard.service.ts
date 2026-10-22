
import { prisma } from "../../../config/db";
import { OrderStatus, PaymentStatus } from "@prisma/client";


export const getDashboardSummary = async () => {
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    paidRevenue,
    pendingOrders,
    lowStockVariants,
    pendingReviews,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        deletedAt: null,
      },
    }),

    prisma.product.count({
      where: {
        deletedAt: null,
        isActive: true,
      },
    }),

    prisma.order.count(),

    prisma.order.aggregate({
      where: {
        paymentStatus: PaymentStatus.PAID,
      },
      _sum: {
        totalPaise: true,
      },
    }),

    prisma.order.count({
      where: {
        status: OrderStatus.PENDING_PAYMENT,
      },
    }),

    prisma.productVariant.count({
      where: {
        isActive: true,
        stockQty: {
          lte: 5,
        },
        product: {
          isActive: true,
          deletedAt: null,
        },
      },
    }),

    prisma.review.count({
      where: {
        status: "PENDING",
      },
    }),
  ]);

  return {
    totalUsers,
    totalProducts,
    totalOrders,
    paidRevenuePaise: paidRevenue._sum.totalPaise ?? 0,
    pendingOrders,
    lowStockVariants,
    pendingReviews,
  };
};


export const getRecentOrders = async () => {
  return prisma.order.findMany({
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      totalPaise: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
  });
};

export const getTopProducts = async () => {
  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      brand: true,
      avgRating: true,
      reviewCount: true,
      variants: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
          label: true,
          sku: true,
          pricePaise: true,
          stockQty: true,
          orderItems: {
            where: {
              order: {
                paymentStatus: PaymentStatus.PAID,
                status: {
                  not: OrderStatus.CANCELLED,
                },
              },
            },
            select: {
              quantity: true,
            },
          },
        },
      },
    },
  });

  return products
    .map((product) => {
      const unitsSold = product.variants.reduce(
        (total, variant) =>
          total +
          variant.orderItems.reduce(
            (sum, item) => sum + item.quantity,
            0
          ),
        0
      );

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        avgRating: Number(product.avgRating),
        reviewCount: product.reviewCount,
        unitsSold,
      };
    })
    .filter((product) => product.unitsSold > 0)
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 10);
};
