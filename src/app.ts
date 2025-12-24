import "express-async-errors";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import compression from "compression";
import { env } from "./config/env";
import { rateLimiter } from "./middleware/rateLimiter";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";
import { requestId } from "./middleware/requestId";
import { requestLogger } from "./middleware/requestLogger";
import { apiRouter } from "./routes";
import { stripeWebhookHandler } from "./routes/stripeWebhook";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(requestId());
  app.use(requestLogger());
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.use(rateLimiter());

  // Stripe webhooks need raw body (must be mounted BEFORE express.json()).
  app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhookHandler);

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  const origins = env.CORS_ORIGINS.length ? env.CORS_ORIGINS : undefined;
  app.use(
    cors({
      origin: origins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Stripe-Signature", "X-Request-Id"],
    })
  );

  if (env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
  }

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}


