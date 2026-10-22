
import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";

import { env } from "../../config/env";
import {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
} from "../../modules/auth/token.service";

describe("Authentication token service", () => {
  it("should generate and verify a valid access token", () => {
    const token = signAccessToken({
      id: "user-123",
      role: "CUSTOMER",
    });

    const payload = verifyAccessToken(token);

    expect(payload.id).toBe("user-123");
    expect(payload.role).toBe("CUSTOMER");
  });

  it("should reject an invalid access token", () => {
    expect(() => {
      verifyAccessToken("invalid.token.value");
    }).toThrow();
  });

  it("should reject an expired access token", () => {
    const expiredToken = jwt.sign(
      {
        sub: "user-123",
        role: "CUSTOMER",
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: -1 }
    );

    expect(() => {
      verifyAccessToken(expiredToken);
    }).toThrow();
  });

  it("should generate unique refresh tokens", () => {
    const token1 = generateRefreshToken();
    const token2 = generateRefreshToken();

    expect(token1).not.toBe(token2);
    expect(token1.length).toBeGreaterThan(40);
  });

  it("should generate a consistent hash for the same token", () => {
    const token = "sample-refresh-token";

    expect(hashToken(token)).toBe(hashToken(token));
  });

  it("should generate different hashes for different tokens", () => {
    expect(hashToken("token-one")).not.toBe(hashToken("token-two"));
  });
});
