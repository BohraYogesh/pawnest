import { RequestHandler } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../modules/auth/token.service";


export const authenticate: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.access_token;

  console.log("[AUTH DEBUG]", {
    path: req.originalUrl,
    cookieHeaderPresent: Boolean(req.headers.cookie),
    accessTokenPresent: Boolean(token),
  });

  if (!token) {
    return next(
      new ApiError(401, "UNAUTHENTICATED", "Please log in"),
    );
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(
      new ApiError(
        401,
        "TOKEN_INVALID",
        "Session expired. Please log in again.",
      ),
    );
  }
};


