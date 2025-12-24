import mongoose, { Schema, Types } from "mongoose";
import { applyToJSON } from "./plugins/toJSON";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderItemDoc {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  total: number;
}

export interface AddressDoc {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface ShippingInfoDoc extends AddressDoc {
  method: string;
  cost: number;
  trackingNumber?: string;
}

export interface PaymentInfoDoc {
  method: string;
  status: PaymentStatus;
  transactionId?: string;
  last4?: string;
  brand?: string;
  paidAt?: Date;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
}

export interface TotalsDoc {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
}

export interface OrderDoc {
  orderNumber: string;
  userId?: Types.ObjectId;
  status: OrderStatus;
  items: OrderItemDoc[];
  shipping?: ShippingInfoDoc;
  billing?: AddressDoc;
  payment: PaymentInfoDoc;
  totals: TotalsDoc;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

const orderSchema = new Schema<OrderDoc>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending",
      required: true,
    },
    items: [
      {
        productId: { type: String, required: true },
        productName: { type: String, required: true },
        productImage: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
        total: { type: Number, required: true, min: 0 },
      },
    ],
    shipping: {
      firstName: { type: String },
      lastName: { type: String },
      company: { type: String },
      address1: { type: String },
      address2: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
      phone: { type: String },
      method: { type: String },
      cost: { type: Number, min: 0 },
      trackingNumber: { type: String },
    },
    billing: {
      firstName: { type: String },
      lastName: { type: String },
      company: { type: String },
      address1: { type: String },
      address2: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
      phone: { type: String },
    },
    payment: {
      method: { type: String, required: true },
      status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
      transactionId: { type: String },
      last4: { type: String },
      brand: { type: String },
      paidAt: { type: Date },
      stripePaymentIntentId: { type: String, index: true },
      stripeCheckoutSessionId: { type: String, index: true },
    },
    totals: {
      subtotal: { type: Number, required: true, min: 0 },
      shipping: { type: Number, required: true, min: 0 },
      tax: { type: Number, required: true, min: 0 },
      discount: { type: Number, required: true, min: 0 },
      total: { type: Number, required: true, min: 0 },
    },
    notes: { type: String },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
applyToJSON(orderSchema);

export const OrderModel = mongoose.models.Order || mongoose.model<OrderDoc>("Order", orderSchema);


