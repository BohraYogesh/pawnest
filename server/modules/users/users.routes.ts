
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireAdmin } from "../../middleware/requireAdmin";
import * as usersController from "./users.controller";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/", usersController.list);
router.get("/:userId", usersController.details);
router.patch("/:userId/status", usersController.updateStatus);

export default router;
