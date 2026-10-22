
import { Router } from "express";
import * as variantController from "./variants.controller";
import { authenticate } from "../../../middleware/authenticate";
import { requireAdmin } from "../../../middleware/requireAdmin";

const router = Router({ mergeParams: true });

// Public: list active variants for a product
router.get("/", variantController.list);

// Admin only: create a variant
router.post(
  "/",
  authenticate,
  requireAdmin,
  variantController.create
);

// Admin only: update a variant
router.patch(
  "/:variantId",
  authenticate,
  requireAdmin,
  variantController.update
);

// Admin only: deactivate a variant
router.delete(
  "/:variantId",
  authenticate,
  requireAdmin,
  variantController.remove
);

export default router;
