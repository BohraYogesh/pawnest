import rateLimit from "express-rate-limit";
import { env } from "../config/env";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === "production" ? 10 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: { code: "TOO_MANY_REQUESTS", message: "Too many attempts. Please try again later." },
    });
  },
});