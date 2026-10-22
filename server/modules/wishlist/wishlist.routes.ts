
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import * as wishlistController from "./wishlist.controller";

const router = Router();

router.use(authenticate);

// GET /api/v1/user/wishlist
router.get("/", wishlistController.list);

// GET /api/v1/user/wishlist/check/:productId
router.get("/check/:productId", wishlistController.check);

// POST /api/v1/user/wishlist/:productId
router.post("/:productId", wishlistController.add);

// DELETE /api/v1/user/wishlist/:productId
router.delete("/:productId", wishlistController.remove);

export default router;
