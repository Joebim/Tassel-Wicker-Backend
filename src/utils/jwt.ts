import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { UserRole } from "../models/User";
import { parseDurationToMs } from "./duration";

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    // Use a number (seconds) to avoid overly-strict template literal typings in @types/jsonwebtoken.
    expiresIn: Math.floor(parseDurationToMs(env.JWT_ACCESS_EXPIRES_IN) / 1000),
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
  return { sub: String(decoded.sub), role: decoded.role as UserRole };
}


