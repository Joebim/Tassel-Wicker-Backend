import mongoose, { Schema } from "mongoose";
import { applyToJSON } from "./plugins/toJSON";

export type UserRole = "admin" | "customer" | "moderator";

export interface UserDoc {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  isEmailVerified: boolean;
  addresses: Array<{
    type: "billing" | "shipping";
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
    isDefault: boolean;
  }>;
  preferences: {
    newsletter: boolean;
    marketing: boolean;
    currency: string;
    language: string;
  };
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema(
  {
    type: { type: String, enum: ["billing", "shipping"], required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    company: { type: String },
    address1: { type: String, required: true },
    address2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);
applyToJSON(addressSchema);

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String },
    role: {
      type: String,
      enum: ["admin", "customer", "moderator"],
      default: "customer",
      required: true,
    },
    isEmailVerified: { type: Boolean, default: false, required: true },
    addresses: { type: [addressSchema], default: [] },
    preferences: {
      newsletter: { type: Boolean, default: false },
      marketing: { type: Boolean, default: false },
      currency: { type: String, default: "USD" },
      language: { type: String, default: "en" },
    },
    passwordResetTokenHash: { type: String },
    passwordResetExpiresAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret: any) {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.passwordHash;
    delete ret.passwordResetTokenHash;
    delete ret.passwordResetExpiresAt;
    return ret;
  },
});

export const UserModel = mongoose.models.User || mongoose.model<UserDoc>("User", userSchema);


