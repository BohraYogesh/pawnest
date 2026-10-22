import { Request, Response } from "express";
import { clearAuthCookies, setAuthCookies } from "./auth.cookies";
import { getCurrentUser, loginUser, registerUser, revokeRefreshToken, refreshUser, } from "./auth.service";


export async function register(req: Request, res: Response) {
  const user = await registerUser(req.body);
  res.status(201).json({ success: true, data: { user } });
}

export async function login(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await loginUser(req.body, {
    userAgent: req.get("user-agent"),
    ip: req.ip,
  });
  setAuthCookies(res, accessToken, refreshToken);
  res.json({ success: true, data: { user } });
}


export async function logout(req: Request, res: Response) {
  const refreshToken = req.cookies?.refresh_token;

  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  clearAuthCookies(res);
  res.json({ success: true, message: "Logged out successfully" });
}


export async function refresh(req: Request, res: Response) {
  const result = await refreshUser(req.cookies?.refresh_token, {
    userAgent: req.get("user-agent"),
    ip: req.ip,
  });

  setAuthCookies(res, result.accessToken, result.refreshToken);

  res.json({
    success: true,
    data: { user: result.user },
  });
}


export async function me(req: Request, res: Response) {
  const user = await getCurrentUser(req.user!.id);
  res.json({ success: true, data: { user } });
}