import { RefreshTokenModel } from "../models/RefreshToken";
import type { UserDoc } from "../models/User";
import { env } from "../config/env";
import { randomToken, sha256 } from "../utils/crypto";
import { parseDurationToMs } from "../utils/duration";
import { signAccessToken } from "../utils/jwt";

export async function issueTokens(user: { id: string; role: UserDoc["role"] }) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });

  const refreshToken = randomToken(48);
  const tokenHash = sha256(refreshToken);
  const expiresAt = new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN));

  await RefreshTokenModel.create({
    userId: user.id as any,
    tokenHash,
    expiresAt,
  });

  return { accessToken, refreshToken };
}

export async function rotateRefreshToken(refreshToken: string) {
  const tokenHash = sha256(refreshToken);
  const tokenDoc = await RefreshTokenModel.findOne({ tokenHash });
  if (!tokenDoc) return null;
  if (tokenDoc.revokedAt) return null;
  if (tokenDoc.expiresAt.getTime() <= Date.now()) return null;

  // Revoke old token and issue a new one (rotation)
  tokenDoc.revokedAt = new Date();

  const newRefreshToken = randomToken(48);
  const newTokenHash = sha256(newRefreshToken);
  tokenDoc.replacedByTokenHash = newTokenHash;
  await tokenDoc.save();

  const expiresAt = new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN));
  await RefreshTokenModel.create({
    userId: tokenDoc.userId,
    tokenHash: newTokenHash,
    expiresAt,
  });

  return { userId: String(tokenDoc.userId), newRefreshToken };
}

export async function revokeRefreshToken(refreshToken: string) {
  const tokenHash = sha256(refreshToken);
  await RefreshTokenModel.updateOne(
    { tokenHash, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  );
}


