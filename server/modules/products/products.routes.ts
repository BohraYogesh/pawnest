
import { Router } from "express";
import * as controller from "./products.controller";
import { authenticate } from "../../middleware/authenticate";
import { requireAdmin } from "../../middleware/requireAdmin";
import variantsRoutes from "./variants/variants.routes";
import imagesRoutes from "./images/images.routes";

const router = Router();

// Public routes — static routes pehle rakho
router.get("/", controller.listProducts);
router.get("/slug/:slug", controller.getProductBySlug);
router.get("/:id", controller.getProduct);

// Admin-only routes
router.post("/", authenticate, requireAdmin, controller.createProduct);
router.patch("/:id", authenticate, requireAdmin, controller.updateProduct);
router.delete("/:id", authenticate, requireAdmin, controller.deleteProduct);
router.use("/:id/variants", variantsRoutes);
router.use("/:id/images", imagesRoutes);

export default router;
