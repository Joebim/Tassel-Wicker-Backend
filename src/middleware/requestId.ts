import type { RequestHandler } from "express";
import crypto from "crypto";

export function requestId(): RequestHandler {
  return (req, res, next) => {
    const existing = req.header("x-request-id");
    const id = existing && existing.length < 200 ? existing : crypto.randomUUID();
    res.setHeader("x-request-id", id);
    (req as any).requestId = id;
    next();
  };
}


