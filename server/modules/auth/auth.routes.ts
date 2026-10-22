import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authLimiter } from "../../middleware/rateLimiter";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { login, logout, me, refresh, register } from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.schema";


const router = Router();

router.post("/register", authLimiter, validateBody(registerSchema), asyncHandler(register));
router.post("/login", authLimiter, validateBody(loginSchema), asyncHandler(login));
router.get("/me", authenticate, asyncHandler(me));
router.post("/logout", asyncHandler(logout));
router.post("/refresh", authLimiter, asyncHandler(refresh));

export default router;