import { Router } from "express";
import { authRouter } from "./auth";
import { productsRouter } from "./products";
import { categoriesRouter } from "./categories";
import { ordersRouter } from "./orders";
import { legacyNextApiRouter } from "./legacyNextApi";
import { uploadsRouter } from "./uploads";
import { cartRouter } from "./cart";
import { contentRouter } from "./content";
import { activitiesRouter } from "./activities";
import { checkoutRouter } from "./checkout";
import { usersRouter } from "./users";

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
apiRouter.use("/activities", activitiesRouter);
apiRouter.use("/users", usersRouter);
// Checkout/payment endpoints
apiRouter.use("/", checkoutRouter);
// Compatibility routes mirroring existing Next `/api/*` endpoints (legacy, will be deprecated)
apiRouter.use("/", legacyNextApiRouter);
