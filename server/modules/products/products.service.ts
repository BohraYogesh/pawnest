import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import type { Prisma, PetType } from "@prisma/client";

type ListProductInput = {
  search?: string;
  category?: string;
  petType?: PetType;
  sort?: "newest" | "price_asc" | "price_desc" | "rating";
  page: number;
  limit: number;
};


export async function listProducts(input: ListProductInput) {
  const {
    search,
    category,
    petType,
    sort = "newest",
    page,
    limit,
  } = input;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    deletedAt: null,
    ...(petType ? { petType } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { brand: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(category
      ? {
          category: {
            slug: category,
            isActive: true,
          },
        }
      : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "rating"
      ? { avgRating: "desc" }
      : { createdAt: "desc" };

  // Run the independent database operations concurrently.
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        variants: {
          where: { isActive: true },
          orderBy: { pricePaise: "asc" },
        },
        images: {
          orderBy: { position: "asc" },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),

    prisma.product.count({ where }),
  ]);

  // Preserve existing price sorting behavior.
  const sortedProducts =
    sort === "price_asc" || sort === "price_desc"
      ? [...products].sort((a, b) => {
          const aPrice =
            a.variants[0]?.pricePaise ?? Number.MAX_SAFE_INTEGER;
          const bPrice =
            b.variants[0]?.pricePaise ?? Number.MAX_SAFE_INTEGER;

          return sort === "price_asc"
            ? aPrice - bPrice
            : bPrice - aPrice;
        })
      : products;

  return {
    items: sortedProducts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}


export async function getProductById(id: string) {
  const product = await prisma.product.findFirst({
    where: {
      id,
      isActive: true,
      deletedAt: null,
    },
    include: {
      category: true,
      variants: {
        where: { isActive: true },
        orderBy: { pricePaise: "asc" },
      },
      images: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!product) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  return product;
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: {
      slug,
      isActive: true,
      deletedAt: null,
    },
    include: {
      category: true,
      variants: {
        where: { isActive: true },
        orderBy: { pricePaise: "asc" },
      },
      images: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!product) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  return product;
}

export async function createProduct(
  data: {
    name: string;
    slug: string;
    description: string;
    brand: string;
    petType: PetType;
    categoryId: string;
    isActive?: boolean;
  },
  adminId: string,
) {
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });

  if (!category || !category.isActive) {
    throw new ApiError(400, "INVALID_CATEGORY", "Active category not found");
  }

  const existing = await prisma.product.findUnique({
    where: { slug: data.slug },
  });

  if (existing) {
    throw new ApiError(
      409,
      "PRODUCT_SLUG_EXISTS",
      "Product slug already exists",
    );
  }

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        ...data,
        isActive: data.isActive ?? true,
      },
      include: {
        category: true,
        variants: true,
        images: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "CREATE",
        entity: "PRODUCT",
        entityId: product.id,
        metadata: {
          name: product.name,
          slug: product.slug,
        },
      },
    });

    return product;
  });
}

export async function updateProduct(
  id: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    brand?: string;
    petType?: PetType;
    categoryId?: string;
    isActive?: boolean;
  },
  adminId: string,
) {
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
  });

  if (!product) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, isActive: true },
    });

    if (!category) {
      throw new ApiError(400, "INVALID_CATEGORY", "Active category not found");
    }
  }

  if (data.slug) {
    const existing = await prisma.product.findUnique({
      where: { slug: data.slug },
    });

    if (existing && existing.id !== id) {
      throw new ApiError(
        409,
        "PRODUCT_SLUG_EXISTS",
        "Product slug already exists",
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const updatedProduct = await tx.product.update({
      where: { id },
      data,
      include: {
        category: true,
        variants: true,
        images: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "UPDATE",
        entity: "PRODUCT",
        entityId: updatedProduct.id,
        metadata: {
          name: updatedProduct.name,
          updatedFields: Object.keys(data),
        },
      },
    });

    return updatedProduct;
  });
}



export async function deleteProduct(id: string, adminId: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        include: {
          _count: {
            select: {
              orderItems: true,
              subscriptions: true,
            },
          },
        },
      },
    },
  });

  if (!product) {
    throw new ApiError(
      404,
      "PRODUCT_NOT_FOUND",
      "Product not found",
    );
  }

  const hasOrderHistory = product.variants.some(
    (variant) => variant._count.orderItems > 0,
  );

  const hasSubscriptions = product.variants.some(
    (variant) => variant._count.subscriptions > 0,
  );

  if (hasOrderHistory || hasSubscriptions) {
    throw new ApiError(
      409,
      "PRODUCT_HAS_REFERENCES",
      "This product has order history or subscriptions. It cannot be permanently deleted safely.",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.delete({
      where: { id },
    });

    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "DELETE",
        entity: "PRODUCT",
        entityId: product.id,
        metadata: {
          name: product.name,
          slug: product.slug,
          permanent: true,
        },
      },
    });
  });

  return { message: "Product permanently deleted successfully" };
}


