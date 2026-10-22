
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";

import {
  createPet,
  listPets,
  getPet,
  updatePet,
  deletePet,
} from "./pets.controller";

import {
  createPetSchema,
  updatePetSchema,
} from "./pets.schema";

const router = Router();

// All pet routes require authentication
router.use(authenticate);

router.post(
  "/",
  validateBody(createPetSchema),
  asyncHandler(createPet)
);

router.get("/", asyncHandler(listPets));

router.get("/:id", asyncHandler(getPet));

router.patch(
  "/:id",
  validateBody(updatePetSchema),
  asyncHandler(updatePet)
);

router.delete("/:id", asyncHandler(deletePet));

export default router;
