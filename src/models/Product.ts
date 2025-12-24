import mongoose, { Schema, Types } from "mongoose";
import { applyToJSON } from "./plugins/toJSON";

export type ProductType = "basket" | "custom" | "single";
export type ProductRole = "main" | "sub";

export interface ProductDoc {
  externalId?: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  coverImage?: string;
  categoryId?: Types.ObjectId;
  category?: string;
  productType: ProductType;
  productRole: ProductRole;
  parentProductId?: Types.ObjectId;
  linkedProductIds: Types.ObjectId[];
  tags: string[];
  inStock: boolean;
  stockQuantity: number;
  featured: boolean;
  isNew: boolean;
  isCustom: boolean;
  variants: Array<{ name: string; image: string; price: number }>;
  details?: any;
  dimensions?: { length: number; width: number; height: number };
  materials?: string[];
  careInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDoc>(
  {
    externalId: { type: String, unique: true, sparse: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    images: { type: [String], default: [] },
    coverImage: { type: String },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    category: { type: String },
    productType: { type: String, enum: ["basket", "custom", "single"], default: "single", required: true },
    productRole: { type: String, enum: ["main", "sub"], default: "main", required: true },
    parentProductId: { type: Schema.Types.ObjectId, ref: "Product" },
    linkedProductIds: { type: [Schema.Types.ObjectId], ref: "Product", default: [] },
    tags: { type: [String], default: [] },
    inStock: { type: Boolean, default: true },
    stockQuantity: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false },
    isNew: { type: Boolean, default: false },
    isCustom: { type: Boolean, default: false },
    variants: {
      type: [
        {
          name: { type: String, required: true },
          image: { type: String, required: true },
          price: { type: Number, required: true, min: 0 },
        },
      ],
      default: [],
    },
    details: { type: Schema.Types.Mixed },
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
    },
    materials: { type: [String], default: [] },
    careInstructions: { type: String },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ featured: 1, inStock: 1 });
productSchema.index({ productType: 1, productRole: 1 });
applyToJSON(productSchema);

export const ProductModel =
  mongoose.models.Product || mongoose.model<ProductDoc>("Product", productSchema);


