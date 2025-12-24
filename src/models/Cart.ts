import mongoose, { Schema, Types } from "mongoose";
import { applyToJSON } from "./plugins/toJSON";

export interface CartItem {
  id: string; // Unique item identifier (productId or productId-variantSlug)
  productId: string; // Product ID
  name: string; // Product name
  price: number; // Item price (in cents or base currency unit)
  image: string; // Product image URL
  category: string; // Product category
  description: string; // Product description
  quantity: number; // Quantity in cart
  variantName?: string; // Optional variant name (e.g., "Large", "Red")
  customItems?: Array<{
    // For custom baskets
    id: string;
    name: string;
    image: string;
    price: number;
  }>;
  basketItems?: Array<{
    // For normal baskets
    name: string;
    image: string;
    category: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartDoc {
  userId?: string; // User ID (for logged-in users)
  sessionId?: string; // Session ID (for guests)
  items: CartItem[]; // Array of cart items
  totalPrice: number; // Total cart price (calculated)
  totalItems: number; // Total item count (calculated)
  lastSyncedAt?: Date; // ISO 8601 timestamp of last sync
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<CartItem>(
  {
    id: { type: String, required: true },
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    variantName: { type: String },
    customItems: {
      type: [
        {
          id: { type: String, required: true },
          name: { type: String, required: true },
          image: { type: String, required: true },
          price: { type: Number, required: true, min: 0 },
        },
      ],
      default: [],
    },
    basketItems: {
      type: [
        {
          name: { type: String, required: true },
          image: { type: String, required: true },
          category: { type: String, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true, _id: false }
);
applyToJSON(cartItemSchema);

const cartSchema = new Schema<CartDoc>(
  {
    userId: { type: String, unique: true, sparse: true, index: true },
    sessionId: { type: String, unique: true, sparse: true, index: true },
    items: { type: [cartItemSchema], default: [] },
    totalPrice: { type: Number, default: 0, min: 0 },
    totalItems: { type: Number, default: 0, min: 0 },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

// Indexes
cartSchema.index({ userId: 1 }, { unique: true, sparse: true });
cartSchema.index({ sessionId: 1 }, { unique: true, sparse: true });
cartSchema.index({ updatedAt: 1 });

// Calculate totals before saving
cartSchema.pre("save", function (next) {
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalPrice = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  next();
});

applyToJSON(cartSchema);

export const CartModel =
  mongoose.models.Cart || mongoose.model<CartDoc>("Cart", cartSchema);

