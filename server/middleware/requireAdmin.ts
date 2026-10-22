
import type { Request, Response, NextFunction } from "express";

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Admin access required",
      },
    });
  }

  return next();
}
