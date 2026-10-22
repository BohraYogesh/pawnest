
import type { Request, Response } from "express";
import { productIdSchema } from "./wishlist.schema";
import * as wishlistService from "./wishlist.service";

export const add = async (req: Request, res: Response) => {
  const { productId } = productIdSchema.parse(req.params);

  const result = await wishlistService.addToWishlist(
    req.user!.id,
    productId
  );

  res.status(result.alreadyExists ? 200 : 201).json({
    success: true,
    message: result.alreadyExists
      ? "Product is already in your wishlist"
      : "Product added to wishlist successfully",
    data: result.item,
  });
};

export const list = async (req: Request, res: Response) => {
  const wishlist = await wishlistService.getWishlist(req.user!.id);

  res.status(200).json({
    success: true,
    data: wishlist,
  });
};

export const remove = async (req: Request, res: Response) => {
  const { productId } = productIdSchema.parse(req.params);

  const result = await wishlistService.removeFromWishlist(
    req.user!.id,
    productId
  );

  res.status(200).json({
    success: true,
    message: "Product removed from wishlist successfully",
    data: result,
  });
};

export const check = async (req: Request, res: Response) => {
  const { productId } = productIdSchema.parse(req.params);

  const result = await wishlistService.checkWishlist(
    req.user!.id,
    productId
  );

  res.status(200).json({
    success: true,
    data: result,
  });
};
