
import { Router } from "express";
import * as imageController from "./images.controller";
import { authenticate } from "../../../middleware/authenticate";
import { requireAdmin } from "../../../middleware/requireAdmin";
import upload from "./images.upload";

const router = Router({ mergeParams: true });

// Public: get product images
router.get("/", imageController.list);

// Admin: add an image
router.post(
  "/",
  authenticate,
  requireAdmin,
  upload.single("image"),
  imageController.create
);

// Admin: change image position
router.patch(
  "/:imageId",
  authenticate,
  requireAdmin,
  imageController.update
);

// Admin: delete an image record
router.delete(
  "/:imageId",
  authenticate,
  requireAdmin,
  imageController.remove
);

export default router;
