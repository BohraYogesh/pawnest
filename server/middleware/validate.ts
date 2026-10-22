import { RequestHandler } from "express";
import { ZodType } from "zod";
import { ApiError } from "../utils/ApiError";

export const validateBody =
  <T>(schema: ZodType<T>): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues
        .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
        .join("; ");
      return next(new ApiError(400, "VALIDATION_ERROR", message));
    }
    req.body = result.data;
    next();
  };