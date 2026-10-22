
import type { Request, Response } from "express";
import {
  addCartItemSchema,
  cartItemIdSchema,
  updateCartItemSchema,
} from "./cart.schema";
import * as cartService from "./cart.service";

export const get = async (req: Request, res: Response) => {
  const cart = await cartService.getCart(req.user!.id);

  res.status(200).json({
    success: true,
    data: cart,
  });
};

export const add = async (req: Request, res: Response) => {
  const input = addCartItemSchema.parse(req.body);

  const item = await cartService.addToCart(req.user!.id, input);

  res.status(201).json({
    success: true,
    message: "Item added to cart successfully",
    data: item,
  });
};

export const update = async (req: Request, res: Response) => {
  const { itemId } = cartItemIdSchema.parse(req.params);
  const input = updateCartItemSchema.parse(req.body);

  const item = await cartService.updateCartItem(
    req.user!.id,
    itemId,
    input
  );

  res.status(200).json({
    success: true,
    message: "Cart quantity updated successfully",
    data: item,
  });
};

export const remove = async (req: Request, res: Response) => {
  const { itemId } = cartItemIdSchema.parse(req.params);

  const result = await cartService.removeCartItem(
    req.user!.id,
    itemId
  );

  res.status(200).json({
    success: true,
    message: "Item removed from cart successfully",
    data: result,
  });
};

export const clear = async (req: Request, res: Response) => {
  const result = await cartService.clearCart(req.user!.id);

  res.status(200).json({
    success: true,
    data: result,
  });
};
