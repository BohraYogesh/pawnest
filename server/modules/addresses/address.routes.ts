
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import * as addressController from "./address.controller";

const router = Router();

router.use(authenticate);

router.post("/", addressController.create);
router.get("/", addressController.list);
router.get("/:id", addressController.getById);
router.patch("/:id", addressController.update);
router.delete("/:id", addressController.remove);

export default router;
