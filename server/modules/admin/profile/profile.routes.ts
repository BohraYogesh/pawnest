import multer from "multer";
import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate";
import { requireAdmin } from "../../../middleware/requireAdmin";
import { asyncHandler } from "../../../utils/asyncHandler";
import * as profileController from "./profile.controller";

const router = Router();

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      callback(new Error("Only JPG, PNG, and WebP images are allowed"));
      return;
    }

    callback(null, true);
  },
});

router.use(authenticate, requireAdmin);
// console.log("Profile controller check:", {
//   getProfile: typeof profileController.getProfile,
//   updateProfile: typeof profileController.updateProfile,
//   getRecentActivity: typeof profileController.getRecentActivity,
//   updateProfileAvatar: typeof profileController.updateProfileAvatar,
// });

router.get("/", asyncHandler(profileController.getProfile));
router.patch("/", asyncHandler(profileController.updateProfile));
router.get("/activity", asyncHandler(profileController.getRecentActivity));
router.post(
  "/avatar",
  avatarUpload.single("avatar"),
  asyncHandler(profileController.updateProfileAvatar),
);

export default router;
