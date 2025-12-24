import rateLimit from "express-rate-limit";

export function rateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  });
}


