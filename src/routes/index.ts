import { Router } from "express";
import { authRouter } from "./auth";
import { productsRouter } from "./products";
import { categoriesRouter } from "./categories";
import { ordersRouter } from "./orders";
import { legacyNextApiRouter } from "./legacyNextApi";
import { uploadsRouter } from "./uploads";
import { cartRouter } from "./cart";
import { contentRouter } from "./content";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/products", productsRouter);
apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/uploads", uploadsRouter);
apiRouter.use("/cart", cartRouter);
apiRouter.use("/content", contentRouter);
// Compatibility routes mirroring existing Next `/api/*` endpoints
apiRouter.use("/", legacyNextApiRouter);
