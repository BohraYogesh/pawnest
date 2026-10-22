
import { z } from "zod";

const petTypeSchema = z.enum([
  "DOG",
  "CAT",
  "BIRD",
  "FISH",
  "SMALL_PET",
  "OTHER",
]);

export const createProductSchema = z.object({
  name: z
    .string({ message: "Product name must be text." })
    .trim()
    .min(2, "Product name must contain at least 2 characters.")
    .max(150, "Product name cannot exceed 150 characters."),

  slug: z
    .string({ message: "Product slug must be text." })
    .trim()
    .min(2, "Product slug must contain at least 2 characters.")
    .max(180, "Product slug cannot exceed 180 characters.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens only in the slug."
    ),

  description: z
    .string({ message: "Description must be text." })
    .trim()
    .min(1, "Product description is required.")
    .max(10000, "Description cannot exceed 10,000 characters."),

  brand: z
    .string({ message: "Brand must be text." })
    .trim()
    .min(1, "Brand name is required.")
    .max(100, "Brand name cannot exceed 100 characters."),

  petType: petTypeSchema,

  categoryId: z
    .string()
    .trim()
    .min(1, "Please select a product category."),

  isActive: z.boolean().optional(),
});

export const updateProductSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Product name must contain at least 2 characters.")
      .max(150, "Product name cannot exceed 150 characters.")
      .optional(),

    slug: z
      .string()
      .trim()
      .min(2, "Product slug must contain at least 2 characters.")
      .max(180, "Product slug cannot exceed 180 characters.")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use lowercase letters, numbers, and hyphens only in the slug."
      )
      .optional(),

    description: z
      .string()
      .trim()
      .min(1, "Product description is required.")
      .max(10000, "Description cannot exceed 10,000 characters.")
      .optional(),

    brand: z
      .string()
      .trim()
      .min(1, "Brand name is required.")
      .max(100, "Brand name cannot exceed 100 characters.")
      .optional(),

    petType: petTypeSchema.optional(),

    categoryId: z
      .string()
      .trim()
      .min(1, "Please select a product category.")
      .optional(),

    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Please provide at least one field to update.",
  });

export const listProductsSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  petType: petTypeSchema.optional(),
  sort: z
    .enum(["newest", "price_asc", "price_desc", "rating"])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
