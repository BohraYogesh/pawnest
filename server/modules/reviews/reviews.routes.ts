
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireAdmin } from "../../middleware/requireAdmin";
import {
  createReviewController,
  getProductReviewsController,
  getMyReviewsController,
  updateMyReviewController,
  deleteMyReviewController,
  getAllReviewsController,
  updateReviewStatusController,
} from "./reviews.controller";

export const productReviewsRoutes = Router();
export const userReviewsRoutes = Router();
export const adminReviewsRoutes = Router();

// Public product reviews; only APPROVED reviews are returned.
productReviewsRoutes.get(
  "/:productId/reviews",
  getProductReviewsController
);

// Logged-in customer routes.
userReviewsRoutes.use(authenticate);
productReviewsRoutes.post(
  "/:productId/reviews",
  authenticate,
  createReviewController
);

userReviewsRoutes.get("/", getMyReviewsController);
userReviewsRoutes.patch("/:id", updateMyReviewController);
userReviewsRoutes.delete("/:id", deleteMyReviewController);

// Admin moderation routes.
adminReviewsRoutes.use(authenticate, requireAdmin);
adminReviewsRoutes.get("/", getAllReviewsController);
adminReviewsRoutes.patch("/:id/status", updateReviewStatusController);
