
import { Router } from "express";
import * as controller from "./categories.controller";

// In imports ko apne existing middleware ke actual paths/names se match karo.
import { authenticate } from "../../middleware/authenticate";
import { validateBody } from "../../middleware/validate";
import {
  createCategorySchema,
  updateCategorySchema,
} from "./categories.schema";

import { requireAdmin } from "../../middleware/requireAdmin";

const router = Router();

// Public routes
router.get("/", controller.listCategories);
router.get("/:slug", controller.getCategory);

// Admin-only routes
router.post(
  "/",
  authenticate,
  requireAdmin,
  validateBody(createCategorySchema),
  controller.createCategory
);

router.patch(
  "/:id",
  authenticate,
  requireAdmin,
  validateBody(updateCategorySchema),
  controller.updateCategory
);

router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  controller.deleteCategory
);

export default router;
