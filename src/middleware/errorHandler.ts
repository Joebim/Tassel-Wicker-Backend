import type { ErrorRequestHandler } from "express";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const status = err instanceof ApiError ? err.status : 500;
  const code = err instanceof ApiError ? err.code : "InternalError";
  const message =
    err instanceof ApiError
      ? err.message
      : status === 500
        ? "Internal server error"
        : String(err?.message || "Request failed");

  // eslint-disable-next-line no-console
  console.error("[error]", {
    status,
    code,
    message,
    requestId: (req as any).requestId,
    path: req.originalUrl,
    stack: err?.stack,
  });

  res.status(status).json({
    error: code,
    message,
    requestId: (req as any).requestId,
    ...(err instanceof ApiError && err.details ? { details: err.details } : {}),
  });
};


