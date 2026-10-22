
import type { Request, Response } from "express";
import {
  createVariantSchema,
  updateVariantSchema,
} from "./variants.schema";
import * as variantService from "./variants.service";

export const create = async (req: Request, res: Response) => {
  const input = createVariantSchema.parse(req.body);

  const variant = await variantService.createVariant(
    req.params.id as string,
    input
  );

  res.status(201).json({
    success: true,
    message: "Variant created successfully",
    data: variant,
  });
};

export const list = async (req: Request, res: Response) => {
  const variants = await variantService.getProductVariants(
    req.params.id as string
  );

  res.status(200).json({
    success: true,
    data: variants,
  });
};

export const update = async (req: Request, res: Response) => {
  const input = updateVariantSchema.parse(req.body);

  const variant = await variantService.updateVariant(
    req.params.id as string,
    req.params.variantId as string,
    input
  );

  res.status(200).json({
    success: true,
    message: "Variant updated successfully",
    data: variant,
  });
};

export const remove = async (req: Request, res: Response) => {
  const variant = await variantService.deactivateVariant(
    req.params.id as string,
    req.params.variantId as string
  );

  res.status(200).json({
    success: true,
    message: "Variant deactivated successfully",
    data: variant,
  });
};
