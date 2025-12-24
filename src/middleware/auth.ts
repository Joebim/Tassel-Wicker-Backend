import type { RequestHandler } from "express";
import { ApiError } from "./errorHandler";
import { verifyAccessToken } from "../utils/jwt";

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.header("authorization");
  const token = header?.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : undefined;

  if (!token) {
    return next(new ApiError(401, "Missing authorization token", "Unauthorized"));
  }

  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, role: payload.role };
    return next();
  } catch (e) {
    return next(new ApiError(401, "Invalid or expired token", "Unauthorized"));
  }
};


