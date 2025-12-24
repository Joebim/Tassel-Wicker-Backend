import mongoose, { Schema, Types } from "mongoose";
import { applyToJSON } from "./plugins/toJSON";

export interface RefreshTokenDoc {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  replacedByTokenHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<RefreshTokenDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date },
    replacedByTokenHash: { type: String },
  },
  { timestamps: true }
);

applyToJSON(refreshTokenSchema);

export const RefreshTokenModel =
  mongoose.models.RefreshToken || mongoose.model<RefreshTokenDoc>("RefreshToken", refreshTokenSchema);


