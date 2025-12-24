import mongoose, { Schema } from "mongoose";
import { applyToJSON } from "./plugins/toJSON";

export type ContentPage =
  | "about"
  | "cookie-policy"
  | "privacy-policy"
  | "terms-of-service"
  | "returns"
  | "shipping";

export interface ContentDoc {
  id: string; // Content ID (same as page identifier)
  page: ContentPage; // Page identifier
  title: string; // Page title
  content: string; // HTML content (for rich text pages) or JSON (for structured pages like About)
  documentUrl?: string; // Optional PDF document URL
  updatedAt: Date;
  updatedBy: string; // User ID of last editor
  createdAt: Date;
}

const contentSchema = new Schema<ContentDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    page: {
      type: String,
      enum: [
        "about",
        "cookie-policy",
        "privacy-policy",
        "terms-of-service",
        "returns",
        "shipping",
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    documentUrl: { type: String },
    updatedBy: { type: String, required: true },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

// Indexes
contentSchema.index({ id: 1 }, { unique: true });
contentSchema.index({ page: 1 });
contentSchema.index({ updatedAt: -1 });

applyToJSON(contentSchema);

export const ContentModel =
  mongoose.models.Content ||
  mongoose.model<ContentDoc>("Content", contentSchema);

