
import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate";
import { requireAdmin } from "../../../middleware/requireAdmin";
import { asyncHandler } from "../../../utils/asyncHandler";
import * as settingsController from "./settings.controller";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/", asyncHandler(settingsController.getSettings));
router.patch("/", asyncHandler(settingsController.updateSettings));

export default router;
