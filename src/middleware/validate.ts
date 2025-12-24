import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";
import { ApiError } from "./errorHandler";

export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ApiError(400, "Validation failed", "BadRequest", parsed.error.flatten()));
    }
    req.body = parsed.data;
    next();
  };
}


