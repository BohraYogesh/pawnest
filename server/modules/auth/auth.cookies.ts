import { CookieOptions, Response } from "express";
import { env } from "../../config/env";

const secure = env.NODE_ENV === "production";

const accessOpts: CookieOptions = {
  httpOnly: true,
  secure,
  sameSite: secure ? "none" : "lax",
  path: "/",
  maxAge: 15 * 60 * 1000,
};

const refreshOpts: CookieOptions = {
  httpOnly: true,
  secure,
  sameSite: secure ? "none" : "lax",
  path: "/api/v1/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
) {
  res.cookie("access_token", accessToken, accessOpts);
  res.cookie("refresh_token", refreshToken, refreshOpts);
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("access_token", { ...accessOpts, maxAge: undefined });
  res.clearCookie("refresh_token", { ...refreshOpts, maxAge: undefined });
}
