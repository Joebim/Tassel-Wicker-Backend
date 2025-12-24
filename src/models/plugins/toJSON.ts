import type { Schema } from "mongoose";

/**
 * Standardize API output:
 * - expose `id` instead of `_id`
 * - remove `__v`
 */
export function applyToJSON(schema: Schema) {
  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret) {
      ret.id = String(ret._id);
      delete ret._id;
      return ret;
    },
  });
}


