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
  app.post(
    "/api/webhooks/stripe",
    express.raw({ type: "application/json" }),
    stripeWebhookHandler
  );

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  // CORS configuration
  const corsOptions: cors.CorsOptions = {
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Stripe-Signature",
      "X-Request-Id",
      "X-Session-ID",
    ],
  };

  // Set origin based on environment
  if (env.CORS_ORIGINS.length > 0) {
    // Use explicit origins from env
    corsOptions.origin = env.CORS_ORIGINS;
  } else if (env.NODE_ENV === "production") {
    // In production, default to common frontend origins if not set
    corsOptions.origin = [
      "https://tassel-wicker-frontend.vercel.app",
      "https://www.tasselandwicker.com",
      "https://tasselandwicker.com",
    ];
  } else {
    // In development, allow all origins
    corsOptions.origin = true;
  }

  app.use(cors(corsOptions));

  if (env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
  }

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Root route - API information
  app.get("/", (_req, res) => {
    res.json({
      name: "Tassel & Wicker Backend API",
      version: "0.1.0",
      status: "running",
      environment: env.NODE_ENV,
      endpoints: {
        health: "/health",
        api: "/api",
        auth: "/api/auth",
        products: "/api/products",
        categories: "/api/categories",
        orders: "/api/orders",
        cart: "/api/cart",
        content: "/api/content",
        uploads: "/api/uploads",
      },
      documentation: "See API documentation for detailed endpoint information",
    });
  });

  app.use("/api", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
