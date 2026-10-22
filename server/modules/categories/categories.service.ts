
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";

export async function getCategories() {
  return prisma.category.findMany({
    where: {
      isActive: true,
      parentId: null,
    },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!category || !category.isActive) {
    throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found");
  }

  return category;
}

export async function createCategory(
  data: {
    name: string;
    slug: string;
    parentId?: string;
    isActive?: boolean;
  },
  adminId: string,
) {
  if (data.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: data.parentId },
    });

    if (!parent) {
      throw new ApiError(
        404,
        "PARENT_CATEGORY_NOT_FOUND",
        "Parent category not found",
      );
    }
  }

  const existing = await prisma.category.findUnique({
    where: { slug: data.slug },
  });

  if (existing) {
    throw new ApiError(
      409,
      "CATEGORY_SLUG_EXISTS",
      "A category with this slug already exists",
    );
  }

  return prisma.$transaction(async (tx) => {
    const category = await tx.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        parentId: data.parentId,
        isActive: data.isActive ?? true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "CREATE",
        entity: "CATEGORY",
        entityId: category.id,
        metadata: {
          name: category.name,
          slug: category.slug,
        },
      },
    });

    return category;
  });
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    slug?: string;
    parentId?: string | null;
    isActive?: boolean;
  },
  adminId: string,
) {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found");
  }

  if (data.parentId === id) {
    throw new ApiError(
      400,
      "INVALID_PARENT_CATEGORY",
      "A category cannot be its own parent",
    );
  }

  if (data.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: data.parentId },
    });

    if (!parent) {
      throw new ApiError(
        404,
        "PARENT_CATEGORY_NOT_FOUND",
        "Parent category not found",
      );
    }
  }

  if (data.slug) {
    const existing = await prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (existing && existing.id !== id) {
      throw new ApiError(
        409,
        "CATEGORY_SLUG_EXISTS",
        "A category with this slug already exists",
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const updatedCategory = await tx.category.update({
      where: { id },
      data,
    });

    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "UPDATE",
        entity: "CATEGORY",
        entityId: updatedCategory.id,
        metadata: {
          name: updatedCategory.name,
          slug: updatedCategory.slug,
          updatedFields: Object.keys(data),
        },
      },
    });

    return updatedCategory;
  });
}

export async function deleteCategory(id: string, adminId: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      children: true,
      products: true,
    },
  });

  if (!category) {
    throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found");
  }

  if (category.children.length > 0) {
    throw new ApiError(
      409,
      "CATEGORY_HAS_CHILDREN",
      "Delete or reassign child categories first",
    );
  }

  if (category.products.length > 0) {
    throw new ApiError(
      409,
      "CATEGORY_HAS_PRODUCTS",
      "Reassign or remove products before deleting this category",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.category.delete({
      where: { id },
    });

    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "DELETE",
        entity: "CATEGORY",
        entityId: category.id,
        metadata: {
          name: category.name,
          slug: category.slug,
        },
      },
    });
  });

  return { message: "Category deleted successfully" };
}
