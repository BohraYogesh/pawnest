
import type { Request, Response, NextFunction } from "express";
import * as ordersService from "./orders.service";
import {
  createOrderSchema,
  orderIdSchema,
  updateOrderStatusSchema,
} from "./orders.schema";

export const createOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const input = createOrderSchema.parse(req.body);
    const order = await ordersService.createOrder(
      req.user!.id,
      input
    );

    res.status(201).json({
      success: true,
      message: "Order created successfully. Payment is pending.",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrdersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orders = await ordersService.getMyOrders(req.user!.id);

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrderByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = orderIdSchema.parse(req.params);
    const order = await ordersService.getMyOrderById(
      req.user!.id,
      id
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelMyOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = orderIdSchema.parse(req.params);
    const order = await ordersService.cancelMyOrder(
      req.user!.id,
      id
    );

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOrdersController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orders = await ordersService.getAllOrders();

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = orderIdSchema.parse(req.params);
    const input = updateOrderStatusSchema.parse(req.body);

    const order = await ordersService.updateOrderStatus(
      id,
      req.user!.id,
      input
    );

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
