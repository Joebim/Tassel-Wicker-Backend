import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { validateBody } from "../middleware/validate";
import { ApiError } from "../middleware/errorHandler";
import { optionalAuth } from "../middleware/optionalAuth";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { OrderModel } from "../models/Order";
import { ProductModel } from "../models/Product";
import { generateOrderNumber } from "../utils/orderNumber";

export const ordersRouter = Router();

const orderItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  productImage: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  total: z.number().nonnegative(),
});

const addressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  company: z.string().optional(),
  address1: z.string().min(1),
  address2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().optional(),
});

const shippingSchema = addressSchema.extend({
  method: z.string().min(1),
  cost: z.number().nonnegative(),
  trackingNumber: z.string().optional(),
});

const paymentSchema = z.object({
  method: z.string().min(1),
  status: z.enum(["pending", "paid", "failed", "refunded"]).default("pending"),
  transactionId: z.string().optional(),
  stripePaymentIntentId: z.string().optional(),
  stripeCheckoutSessionId: z.string().optional(),
});

const totalsSchema = z.object({
  subtotal: z.number().nonnegative(),
  shipping: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  shipping: shippingSchema,
  billing: addressSchema,
  payment: paymentSchema,
  totals: totalsSchema,
  notes: z.string().max(10000).optional(),
});

ordersRouter.post("/", optionalAuth, validateBody(createOrderSchema), async (req, res) => {
  const body = req.body as z.infer<typeof createOrderSchema>;

  const computedSubtotal = body.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const computedTotal = computedSubtotal + body.totals.shipping + body.totals.tax - body.totals.discount;
  const epsilon = 0.01;
  if (Math.abs(computedSubtotal - body.totals.subtotal) > epsilon) {
    throw new ApiError(400, "Subtotal mismatch", "BadRequest");
  }
  if (Math.abs(computedTotal - body.totals.total) > epsilon) {
    throw new ApiError(400, "Total mismatch", "BadRequest");
  }

  // Best-effort stock validation & decrement (only if the product exists in DB).
  for (const item of body.items) {
    if (!mongoose.isValidObjectId(item.productId)) continue;
    const product = await ProductModel.findById(item.productId);
    if (!product) continue;
    if (!product.inStock || product.stockQuantity < item.quantity) {
      throw new ApiError(409, `Insufficient stock for ${product.name}`, "Conflict");
    }
  }
  for (const item of body.items) {
    if (!mongoose.isValidObjectId(item.productId)) continue;
    await ProductModel.updateOne(
      { _id: item.productId, stockQuantity: { $gte: item.quantity } },
      { $inc: { stockQuantity: -item.quantity }, $set: { inStock: true } }
    );
  }

  const order = await OrderModel.create({
    orderNumber: generateOrderNumber(),
    userId: req.auth?.userId,
    status: "pending",
    items: body.items,
    shipping: body.shipping,
    billing: body.billing,
    payment: body.payment,
    totals: body.totals,
    notes: body.notes,
  });

  res.status(201).json({ item: order.toJSON() });
});

ordersRouter.get("/my", requireAuth, async (req, res) => {
  const items = await OrderModel.find({ userId: req.auth!.userId }).sort({ createdAt: -1 }).limit(100);
  res.json({ items: items.map((o) => o.toJSON()) });
});

// Admin endpoints
ordersRouter.get("/admin/list", requireAuth, requireRole("admin", "moderator"), async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20) || 20));
  const [items, total] = await Promise.all([
    OrderModel.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    OrderModel.countDocuments(),
  ]);
  res.json({ items: items.map((o) => o.toJSON()), page, limit, total, totalPages: Math.ceil(total / limit) });
});

const updateOrderSchema = z.object({
  status: z
    .enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"])
    .optional(),
  trackingNumber: z.string().optional(),
});

ordersRouter.patch(
  "/admin/:id",
  requireAuth,
  requireRole("admin", "moderator"),
  validateBody(updateOrderSchema),
  async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid id", "BadRequest");
    const body = req.body as z.infer<typeof updateOrderSchema>;

    const update: any = {};
    if (body.status) {
      update.status = body.status;
      if (body.status === "shipped") update.shippedAt = new Date();
      if (body.status === "delivered") update.deliveredAt = new Date();
    }
    if (body.trackingNumber) update["shipping.trackingNumber"] = body.trackingNumber;

    const updated = await OrderModel.findByIdAndUpdate(id, update, { new: true });
    if (!updated) throw new ApiError(404, "Order not found", "NotFound");
    res.json({ item: updated.toJSON() });
  }
);

ordersRouter.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid id", "BadRequest");
  const order = await OrderModel.findById(id);
  if (!order) throw new ApiError(404, "Order not found", "NotFound");

  const isOwner = order.userId && String(order.userId) === req.auth!.userId;
  const isAdmin = req.auth!.role === "admin" || req.auth!.role === "moderator";
  if (!isOwner && !isAdmin) throw new ApiError(403, "Forbidden", "Forbidden");

  res.json({ item: order.toJSON() });
});


