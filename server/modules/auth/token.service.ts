import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export function signAccessToken(user: { id: string; role: string }): string {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
}

export function verifyAccessToken(token: string): { id: string; role: string } {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (typeof payload === "string" || !payload.sub) throw new Error("Invalid token");
  return { id: String(payload.sub), role: String(payload.role) };
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

// Database mein asli token nahi, uska hash save hota hai
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}