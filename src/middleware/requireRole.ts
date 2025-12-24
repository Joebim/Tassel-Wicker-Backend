import type { RequestHandler } from "express";
import type { UserRole } from "../models/User";
import { ApiError } from "./errorHandler";

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) return next(new ApiError(401, "Unauthorized", "Unauthorized"));
    if (!roles.includes(req.auth.role)) {
      return next(new ApiError(403, "Forbidden", "Forbidden"));
    }
    return next();
  };
}


