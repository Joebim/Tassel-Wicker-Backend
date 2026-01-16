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
import { UserModel } from "../models/User";
import { generateOrderNumber } from "../utils/orderNumber";
import {
  logActivity,
  getIpAddress,
  getUserAgent,
} from "../services/activityLogger";

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
  currency: z.string().optional().default("GBP"),
  customerName: z.string().optional(),
  notes: z.string().max(10000).optional(),
});

/**
 * @openapi
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Order' }
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error or subtotal mismatch
 */
ordersRouter.post(
  "/",
  optionalAuth,
  (req, _res, next) => {
    console.log(
      "Incoming Order Request - Body:",
      JSON.stringify(req.body, null, 2)
    );
    console.log("Incoming Order Request - Auth:", req.header("authorization"));
    next();
  },
  validateBody(createOrderSchema),
  async (req, res) => {
    console.log(
      "Order processing - Request Body:",
      JSON.stringify(req.body, null, 2)
    );
    console.log("req", req);
    console.log("Order processing - req.auth.userId:", req.auth?.userId);
    console.log("Order processing - req._id:", (req as any)._id);

    const body = req.body as z.infer<typeof createOrderSchema>;

    const computedSubtotal = body.items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );
    const computedTotal =
      computedSubtotal +
      body.totals.shipping +
      body.totals.tax -
      body.totals.discount;
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
        throw new ApiError(
          409,
          `Insufficient stock for ${product.name}`,
          "Conflict"
        );
      }
    }
    for (const item of body.items) {
      if (!mongoose.isValidObjectId(item.productId)) continue;
      await ProductModel.updateOne(
        { _id: item.productId, stockQuantity: { $gte: item.quantity } },
        { $inc: { stockQuantity: -item.quantity }, $set: { inStock: true } }
      );
    }

    // Get user ID from req._id (as requested) or req.auth.userId
    const userId = (req as any)._id || req.auth?.userId;
    // Default to body provided name or "Guest".
    // If userId is present, we will try to overwrite with DB name if found.
    // If user record doesn't have a name, we fall back to existing customerName (from body or "Guest")
    let customerName = body.customerName || "Guest";

    if (userId && mongoose.isValidObjectId(userId)) {
      const user = await UserModel.findById(userId);
      if (user) {
        const dbName =
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.firstName || user.lastName;

        if (dbName) {
          customerName = dbName;
        }
      }
    }

    const order = await OrderModel.create({
      orderNumber: generateOrderNumber(),
      userId: userId,
      customerName,
      status: "pending",
      currency: body.currency,
      items: body.items,
      shipping: body.shipping,
      billing: body.billing,
      payment: body.payment,
      totals: body.totals,
      notes: body.notes,
    });

    // Log order creation
    await logActivity({
      type: "order.created",
      userId: userId,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      metadata: {
        orderId: (order as any).id,
        orderNumber: order.orderNumber,
        total: order.totals.total,
        itemCount: order.items.length,
        paymentMethod: order.payment.method,
      },
    });

    // Log payment received if status is paid
    if (order.payment.status === "paid") {
      await logActivity({
        type: "order.payment_received",
        userId: userId,
        ipAddress: getIpAddress(req),
        userAgent: getUserAgent(req),
        metadata: {
          orderId: (order as any).id,
          orderNumber: order.orderNumber,
          amount: order.totals.total,
        },
      });
    }

    res.status(201).json({ item: order.toJSON() });
  }
);

ordersRouter.get("/my", requireAuth, async (req, res) => {
  const items = await OrderModel.find({ userId: req.auth!.userId })
    .sort({ createdAt: -1 })
    .limit(100);

  // Fetch user details once to backfill customerName if needed
  let fallbackName = "Guest";
  if (req.auth?.userId) {
    const user = await UserModel.findById(req.auth.userId);
    if (user) {
      fallbackName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.lastName || "Guest";
    }
  }

  const result = items.map((o) => {
    const json = o.toJSON() as any;
    if (!json.customerName) {
      json.customerName = fallbackName;
    }
    return json;
  });

  res.json({ items: result });
});

// Admin endpoints
ordersRouter.get(
  "/admin/list",
  requireAuth,
  requireRole("admin", "moderator"),
  async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit || 20) || 20)
    );
    const [items, total] = await Promise.all([
      OrderModel.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      OrderModel.countDocuments(),
    ]);

    // Get unique user IDs from orders
    const userIds = items
      .map((o) => o.userId)
      .filter((id): id is mongoose.Types.ObjectId => !!id)
      .filter(
        (id, index, self) =>
          self.findIndex((i) => String(i) === String(id)) === index
      );

    // Fetch users in bulk
    const users =
      userIds.length > 0 ? await UserModel.find({ _id: { $in: userIds } }) : [];
    const userMap = new Map<string, any>();
    users.forEach((user) => {
      const userJson = user.toJSON();
      userMap.set(String(user._id), {
        firstName: userJson.firstName || null,
        lastName: userJson.lastName || null,
        fullName:
          userJson.firstName && userJson.lastName
            ? `${userJson.firstName} ${userJson.lastName}`
            : userJson.firstName || userJson.lastName || null,
      });
    });

    // Map orders with customer name (now stored in DB, but fallback just in case)
    const ordersWithCustomerName = items.map((o) => {
      const orderJson = o.toJSON() as any;

      // If customerName is "Guest" or missing, and we have a userId, try to find the real name
      if (
        (!orderJson.customerName || orderJson.customerName === "Guest") &&
        orderJson.userId
      ) {
        const user = userMap.get(orderJson.userId);
        if (user && user.fullName) {
          orderJson.customerName = user.fullName;
        } else if (!orderJson.customerName) {
          orderJson.customerName = "Guest";
        }
      } else if (!orderJson.customerName) {
        orderJson.customerName = "Guest";
      }
      return orderJson;
    });

    res.json({
      items: ordersWithCustomerName,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }
);

const updateOrderSchema = z.object({
  status: z
    .enum([
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ])
    .optional(),
  trackingNumber: z.string().optional(),
});

/**
 * @openapi
 * /api/orders/admin/{id}:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status (Admin/Moderator)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, processing, shipped, delivered, cancelled, refunded]
 *               trackingNumber: { type: string }
 *     responses:
 *       200:
 *         description: Order updated
 *       404:
 *         description: Order not found
 */
ordersRouter.patch(
  "/admin/:id",
  requireAuth,
  requireRole("admin", "moderator"),
  validateBody(updateOrderSchema),
  async (req, res) => {
    console.log("Admin Order Processing - ID:", req.params.id);
    console.log(
      "Admin Order Processing - Request Body:",
      JSON.stringify(req.body, null, 2)
    );
    console.log("Admin Order Processing - req.auth.userId:", req.auth?.userId);

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      throw new ApiError(400, "Invalid id", "BadRequest");
    const body = req.body as z.infer<typeof updateOrderSchema>;

    const update: any = {};
    if (body.status) {
      update.status = body.status;
      if (body.status === "shipped") update.shippedAt = new Date();
      if (body.status === "delivered") update.deliveredAt = new Date();
    }
    if (body.trackingNumber)
      update["shipping.trackingNumber"] = body.trackingNumber;

    const updated = await OrderModel.findByIdAndUpdate(id, update, {
      new: true,
    });
    if (!updated) throw new ApiError(404, "Order not found", "NotFound");

    // Log order update
    await logActivity({
      type: "order.updated",
      userId: req.auth!.userId,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      metadata: {
        orderId: (updated as any).id,
        orderNumber: updated.orderNumber,
        status: updated.status,
        previousStatus: body.status ? "unknown" : undefined, // We don't track previous status
      },
    });

    // Log cancellation if status changed to cancelled
    if (body.status === "cancelled") {
      await logActivity({
        type: "order.cancelled",
        userId: req.auth!.userId,
        ipAddress: getIpAddress(req),
        userAgent: getUserAgent(req),
        metadata: {
          orderId: (updated as any).id,
          orderNumber: updated.orderNumber,
        },
      });
    }

    res.json({ item: updated.toJSON() });
  }
);

ordersRouter.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id))
    throw new ApiError(400, "Invalid id", "BadRequest");
  const order = await OrderModel.findById(id);
  if (!order) throw new ApiError(404, "Order not found", "NotFound");

  const isOwner = order.userId && String(order.userId) === req.auth!.userId;
  const isAdmin = req.auth!.role === "admin" || req.auth!.role === "moderator";
  if (!isOwner && !isAdmin) throw new ApiError(403, "Forbidden", "Forbidden");

  const orderJson = order.toJSON() as any;

  // Ensure customerName is present
  if (!orderJson.customerName) {
    if (orderJson.userId && mongoose.isValidObjectId(orderJson.userId)) {
      const user = await UserModel.findById(orderJson.userId);
      if (user) {
        const userJson = user.toJSON();
        orderJson.customerName =
          userJson.firstName && userJson.lastName
            ? `${userJson.firstName} ${userJson.lastName}`
            : userJson.firstName || userJson.lastName || "Guest";
      } else {
        orderJson.customerName = "Guest";
      }
    } else {
      orderJson.customerName = "Guest";
    }
  }

  res.json({ item: orderJson });
});
