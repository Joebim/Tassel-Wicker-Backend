import mongoose, { Schema, Types } from "mongoose";
import { applyToJSON } from "./plugins/toJSON";

export type ActivityType =
  | "user.registered"
  | "user.login"
  | "user.login_failed"
  | "user.logout"
  | "user.password_reset_requested"
  | "user.password_reset"
  | "order.created"
  | "order.updated"
  | "order.cancelled"
  | "order.payment_received"
  | "cart.item_added"
  | "cart.item_updated"
  | "cart.item_removed"
  | "cart.cleared"
  | "product.created"
  | "product.updated"
  | "product.deleted"
  | "content.updated"
  | "category.created"
  | "category.updated"
  | "category.deleted";

export interface ActivityDoc {
  type: ActivityType;
  userId?: string; // User ID who performed the action (if authenticated)
  sessionId?: string; // Session ID for guest users
  ipAddress?: string; // IP address of the user
  userAgent?: string; // User agent string
  metadata?: Record<string, any>; // Additional context data (orderId, productId, etc.)
  createdAt: Date;
}

const activitySchema = new Schema<ActivityDoc>(
  {
    type: {
      type: String,
      enum: [
        "user.registered",
        "user.login",
        "user.login_failed",
        "user.logout",
        "user.password_reset_requested",
        "user.password_reset",
        "order.created",
        "order.updated",
        "order.cancelled",
        "order.payment_received",
        "cart.item_added",
        "cart.item_updated",
        "cart.item_removed",
        "cart.cleared",
        "product.created",
        "product.updated",
        "product.deleted",
        "content.updated",
        "category.created",
        "category.updated",
        "category.deleted",
      ],
      required: true,
      index: true,
    },
    userId: { type: String, index: true },
    sessionId: { type: String, index: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, suppressReservedKeysWarning: true }
);

// Indexes for efficient querying
activitySchema.index({ type: 1, createdAt: -1 });
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });
activitySchema.index({ "metadata.orderId": 1 });
activitySchema.index({ "metadata.productId": 1 });

applyToJSON(activitySchema);

export const ActivityModel =
  mongoose.models.Activity || mongoose.model<ActivityDoc>("Activity", activitySchema);

