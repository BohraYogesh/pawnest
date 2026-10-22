
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import * as notificationController from "./notifications.controller";

const router = Router();

// All notification endpoints require login.
router.use(authenticate);

// GET /api/v1/user/notifications
router.get("/", notificationController.list);

// GET /api/v1/user/notifications/unread-count
router.get("/unread-count", notificationController.unreadCount);

// PATCH /api/v1/user/notifications/read-all
router.patch("/read-all", notificationController.markAllRead);

// PATCH /api/v1/user/notifications/:id/read
router.patch("/:id/read", notificationController.markRead);

// DELETE /api/v1/user/notifications/:id
router.delete("/:id", notificationController.remove);

export default router;
