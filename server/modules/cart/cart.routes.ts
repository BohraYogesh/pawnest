
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import * as cartController from "./cart.controller";

const router = Router();

router.use(authenticate);

router.get("/", cartController.get);
router.post("/items", cartController.add);
router.patch("/items/:itemId", cartController.update);
router.delete("/items/:itemId", cartController.remove);
router.delete("/", cartController.clear);

export default router;
