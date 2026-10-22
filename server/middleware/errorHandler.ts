import { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import multer from "multer";

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "The requested route was not found.",
    },
  });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Custom API errors
  if (err instanceof ApiError) {
    res.status(err.status).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Multer image upload errors
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({
        success: false,
        error: {
          code: "IMAGE_TOO_LARGE",
          message: "Image size must not exceed 5 MB.",
        },
      });
      return;
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      res.status(400).json({
        success: false,
        error: {
          code: "TOO_MANY_FILES",
          message: "Please upload one image at a time.",
        },
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: {
        code: "IMAGE_UPLOAD_ERROR",
        message: "Unable to process the image. Please try again.",
      },
    });
    return;
  }

  // Unsupported image type
  if (
    err instanceof Error &&
    err.message === "Only JPG, PNG, WEBP and AVIF images are allowed."
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_IMAGE_TYPE",
        message: "Please upload a JPG, PNG, WebP or AVIF image.",
      },
    });
    return;
  }

  // Invalid request body (JSON)
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({
      success: false,
      error: {
        code: "BAD_JSON",
        message: "Invalid request data. Please check your input.",
      },
    });
    return;
  }

  // Invalid request body size
  if (err?.type === "entity.too.large") {
    res.status(413).json({
      success: false,
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message:
          "The submitted data is too large. Please reduce the size and try again.",
      },
    });
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Please check the entered information.",
        details: err.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }

  // Prisma unique constraint errors
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  ) {
    const target = err.meta?.target;
    const fields = Array.isArray(target)
      ? target.map(String)
      : target
        ? [String(target)]
        : [];

    const isSku = fields.some((field) => field.toLowerCase().includes("sku"));

    const isSlug = fields.some((field) => field.toLowerCase().includes("slug"));

    res.status(409).json({
      success: false,
      error: {
        code: isSku
          ? "SKU_ALREADY_EXISTS"
          : isSlug
            ? "PRODUCT_SLUG_EXISTS"
            : "DUPLICATE_RECORD",
        message: isSku
          ? "This SKU already exists. Please use a different SKU."
          : isSlug
            ? "This product URL slug already exists. Please use a different slug."
            : "This record already exists. Please check the entered information.",
      },
    });
    return;
  }

  // Log technical details on the server only
  console.error("Unhandled API error:", err);

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong on our side. Please try again later.",
    },
  });
};
