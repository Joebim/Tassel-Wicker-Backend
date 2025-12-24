import type { RequestHandler } from "express";
import { verifyAccessToken } from "../utils/jwt";

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const header = req.header("authorization");
  const token = header?.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : undefined;
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, role: payload.role };
  } catch {
    // ignore invalid token for optional auth
  }
  next();
};


