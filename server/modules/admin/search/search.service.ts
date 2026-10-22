import { prisma } from "../../../config/db";

type SearchResult = {
  id: string;
  type: "product" | "category" | "order" | "customer";
  title: string;
  subtitle: string;
  url: string;
};

export const globalSearch = async (
  query: string,
): Promise<SearchResult[]> => {
  const results: SearchResult[] = [];

  const [products, categories, orders, customers] = await Promise.all([
    // Products and SKU
    prisma.product.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { brand: { contains: query, mode: "insensitive" } },
          {
            variants: {
              some: {
                sku: { contains: query, mode: "insensitive" },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        brand: true,
        variants: {
          where: {
            sku: { contains: query, mode: "insensitive" },
          },
          select: { sku: true },
          take: 1,
        },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),

    // Categories
    prisma.category.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      take: 5,
      orderBy: { name: "asc" },
    }),

    // Orders
    prisma.order.findMany({
      where: {
        OR: [
          ...( /^\d+$/.test(query)
            ? [{ orderNumber: Number(query) }]
            : []),
          {
            user: {
              name: { contains: query, mode: "insensitive" },
            },
          },
          {
            user: {
              email: { contains: query, mode: "insensitive" },
            },
          },
        ],
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),

    // Customers
    prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  results.push(
    ...products.map((product) => ({
      id: product.id,
      type: "product" as const,
      title: product.name,
      subtitle: product.variants[0]?.sku
        ? `SKU: ${product.variants[0].sku}`
        : product.brand,
      url: "/products",
    })),

    ...categories.map((category) => ({
      id: category.id,
      type: "category" as const,
      title: category.name,
      subtitle: `Category · ${category.slug}`,
      url: "/categories",
    })),

    ...orders.map((order) => ({
      id: order.id,
      type: "order" as const,
      title: `Order #${order.orderNumber}`,
      subtitle: `${order.user.name} · ${order.status}`,
      url: "/orders",
    })),

    ...customers.map((customer) => ({
      id: customer.id,
      type: "customer" as const,
      title: customer.name,
      subtitle: customer.email || customer.phone || "User",
      url: "/Users",
    })),
  );

  return results.slice(0, 15);
};