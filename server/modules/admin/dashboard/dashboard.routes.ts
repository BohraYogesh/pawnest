
import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate";
import { requireAdmin } from "../../../middleware/requireAdmin";
import * as dashboardController from "./dashboard.controller";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/summary", dashboardController.summary);
router.get("/recent-orders", dashboardController.recentOrders);
router.get("/top-products", dashboardController.topProducts);

export default router;
