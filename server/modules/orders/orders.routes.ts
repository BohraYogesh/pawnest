
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireAdmin } from "../../middleware/requireAdmin";
import {
  createOrderController,
  getMyOrdersController,
  getMyOrderByIdController,
  cancelMyOrderController,
  getAllOrdersController,
  updateOrderStatusController,
} from "./orders.controller";

export const userOrdersRoutes = Router();
export const adminOrdersRoutes = Router();

// Customer routes: all require login.
userOrdersRoutes.use(authenticate);

userOrdersRoutes.post("/", createOrderController);
userOrdersRoutes.get("/", getMyOrdersController);
userOrdersRoutes.get("/:id", getMyOrderByIdController);
userOrdersRoutes.post("/:id/cancel", cancelMyOrderController);

// Admin routes: login + ADMIN role.
adminOrdersRoutes.use(authenticate, requireAdmin);

adminOrdersRoutes.get("/", getAllOrdersController);
adminOrdersRoutes.patch("/:id/status", updateOrderStatusController);
