import type { RequestHandler } from "express";

export function requestLogger(): RequestHandler {
  return (req, res, next) => {
    const start = process.hrtime.bigint();
    const requestId = req.requestId || req.header("x-request-id") || "";

    res.on("finish", () => {
      const end = process.hrtime.bigint();
      const ms = Number(end - start) / 1_000_000;
      const path = req.originalUrl;

      // eslint-disable-next-line no-console
      console.log(
        `[http] ${req.method} ${path} -> ${res.statusCode} (${ms.toFixed(1)}ms)${requestId ? ` rid=${requestId}` : ""}`
      );
    });

    next();
  };
}










