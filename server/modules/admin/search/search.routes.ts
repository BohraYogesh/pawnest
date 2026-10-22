import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate";
import { requireAdmin } from "../../../middleware/requireAdmin";
import { asyncHandler } from "../../../utils/asyncHandler";
import * as searchController from "./search.controller";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/", asyncHandler(searchController.globalSearch));

export default router;