import mongoose, { Schema, Types } from "mongoose";
import { applyToJSON } from "./plugins/toJSON";

export type ProductType = "basket" | "custom" | "single";
export type ProductRole = "main" | "sub";

export interface ProductImage {
  url: string;
  isCover?: boolean;
}

export interface ProductDoc {
  externalId?: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: ProductImage[];
  coverImage?: string; // Deprecated: kept for backward compatibility, derived from images array
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
  dimensions?: any;
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
    images: {
      type: [
        {
          url: { type: String, required: true },
          isCover: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    coverImage: { type: String }, // Deprecated: kept for backward compatibility
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    category: { type: String },
    productType: {
      type: String,
      enum: ["basket", "custom", "single"],
      default: "single",
      required: true,
    },
    productRole: {
      type: String,
      enum: ["main", "sub"],
      default: "main",
      required: true,
    },
    parentProductId: { type: Schema.Types.ObjectId, ref: "Product" },
    linkedProductIds: {
      type: [Schema.Types.ObjectId],
      ref: "Product",
      default: [],
    },
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
    dimensions: { type: Schema.Types.Mixed },
    materials: { type: [String], default: [] },
    careInstructions: { type: String },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ featured: 1, inStock: 1 });
productSchema.index({ productType: 1, productRole: 1 });

// Helper function to normalize image format
function normalizeImage(
  img: any,
  index: number
): { url: string; isCover: boolean } {
  // Check if this is a malformed object (string cast to object - has numeric keys like "0", "1", "2")
  if (typeof img === "object" && img !== null) {
    const keys = Object.keys(img);
    const hasNumericKeys = keys.some((key) => /^\d+$/.test(key));
    const hasUrlProperty = typeof img.url === "string";

    // If it has numeric keys but no url property, it's a malformed string-to-object cast
    if (hasNumericKeys && !hasUrlProperty) {
      // Reconstruct URL from character keys
      const urlParts: string[] = [];
      let i = 0;
      while (img[i] !== undefined) {
        urlParts.push(String(img[i]));
        i++;
      }
      const reconstructedUrl = urlParts.join("");
      return {
        url: reconstructedUrl,
        isCover: img.isCover === true || index === 0,
      };
    }

    // If it has url property, it's in the new format
    if (hasUrlProperty) {
      return {
        url: img.url,
        isCover: img.isCover === true || false,
      };
    }
  }

  // If it's a string (old format), convert to new format
  if (typeof img === "string") {
    return {
      url: img,
      isCover: index === 0,
    };
  }

  // Fallback
  return {
    url: String(img),
    isCover: index === 0,
  };
}

// Post-init hook to normalize images when documents are loaded from the database
productSchema.post("init", function (doc: any) {
  if (Array.isArray(doc.images)) {
    const needsNormalization = doc.images.some((img: any) => {
      if (typeof img === "object" && img !== null) {
        const keys = Object.keys(img);
        return (
          keys.some((key) => /^\d+$/.test(key)) && typeof img.url !== "string"
        );
      }
      return typeof img === "string";
    });

    if (needsNormalization) {
      doc.images = doc.images.map((img: any, index: number) =>
        normalizeImage(img, index)
      );
      doc.markModified("images");
    }
  }
});

// Custom toJSON transform that handles migration of old image format (strings) to new format (objects)
productSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret: any) {
    ret.id = String(ret._id);
    delete ret._id;

    // Migrate old image format (strings) to new format (objects)
    if (Array.isArray(ret.images)) {
      ret.images = ret.images.map((img: any, index: number) =>
        normalizeImage(img, index)
      );
    }

    return ret;
  },
});

export const ProductModel =
  mongoose.models.Product ||
  mongoose.model<ProductDoc>("Product", productSchema);
