import mongoose, { Schema } from "mongoose";
import { applyToJSON } from "./plugins/toJSON";

export interface CategoryDoc {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDoc>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    image: { type: String },
  },
  { timestamps: true }
);

applyToJSON(categorySchema);

export const CategoryModel =
  mongoose.models.Category || mongoose.model<CategoryDoc>("Category", categorySchema);


