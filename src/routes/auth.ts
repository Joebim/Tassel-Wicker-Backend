import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validate";
import { ApiError } from "../middleware/errorHandler";
import { UserModel } from "../models/User";
import { hashPassword, verifyPassword } from "../utils/password";
import {
  issueTokens,
  revokeRefreshToken,
  rotateRefreshToken,
} from "../services/authTokens";
import { requireAuth } from "../middleware/auth";
import { randomToken, sha256 } from "../utils/crypto";
import { signAccessToken } from "../utils/jwt";
import {
  logActivity,
  getIpAddress,
  getUserAgent,
} from "../services/activityLogger";

export const authRouter = Router();

const emailSchema = z
  .string()
  .email()
  .transform((v) => v.trim().toLowerCase());
const passwordSchema = z.string().min(8).max(200);

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1).max(120),
  lastName: z.string().min(1).max(120),
  phone: z.string().min(3).max(40).optional(),
  acceptTerms: z.boolean().optional(),
  newsletter: z.boolean().optional(),
});

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               phone: { type: string }
 *               newsletter: { type: boolean }
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: Email already registered
 */
authRouter.post("/register", validateBody(registerSchema), async (req, res) => {
  const { email, password, firstName, lastName, phone, newsletter } =
    req.body as z.infer<typeof registerSchema>;

  const existing = await UserModel.findOne({ email });
  if (existing) throw new ApiError(409, "Email already registered", "Conflict");

  const passwordHash = await hashPassword(password);
  const user = await UserModel.create({
    email,
    passwordHash,
    firstName,
    lastName,
    phone,
    role: "customer",
    preferences: {
      newsletter: !!newsletter,
      marketing: false,
      currency: "USD",
      language: "en",
    },
  });

  const tokens = await issueTokens({ id: (user as any).id, role: user.role });

  // Log user registration
  await logActivity({
    type: "user.registered",
    userId: (user as any).id,
    ipAddress: getIpAddress(req),
    userAgent: getUserAgent(req),
    metadata: { email: user.email, role: user.role },
  });

  res
    .status(201)
    .json({
      user: user.toJSON(),
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *               rememberMe: { type: boolean }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid email or password
 */
authRouter.post("/login", validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;

  const user = await UserModel.findOne({ email }).select("+passwordHash");
  if (!user) {
    // Log failed login attempt
    await logActivity({
      type: "user.login_failed",
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      metadata: { email },
    });
    throw new ApiError(401, "Invalid email or password", "Unauthorized");
  }

  const ok = await verifyPassword(password, (user as any).passwordHash);
  if (!ok) {
    // Log failed login attempt
    await logActivity({
      type: "user.login_failed",
      userId: (user as any).id,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      metadata: { email },
    });
    throw new ApiError(401, "Invalid email or password", "Unauthorized");
  }

  const tokens = await issueTokens({ id: (user as any).id, role: user.role });

  // Log successful login
  await logActivity({
    type: "user.login",
    userId: (user as any).id,
    ipAddress: getIpAddress(req),
    userAgent: getUserAgent(req),
    metadata: { email: user.email },
  });

  res.json({
    user: user.toJSON(),
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Token refreshed
 *       401:
 *         description: Invalid refresh token
 */
authRouter.post("/refresh", validateBody(refreshSchema), async (req, res) => {
  const { refreshToken } = req.body as z.infer<typeof refreshSchema>;
  const rotated = await rotateRefreshToken(refreshToken);
  if (!rotated)
    throw new ApiError(401, "Invalid refresh token", "Unauthorized");

  const user = await UserModel.findById(rotated.userId);
  if (!user) throw new ApiError(401, "Invalid refresh token", "Unauthorized");

  const accessToken = signAccessToken({
    sub: (user as any).id,
    role: user.role,
  });
  res.json({ token: accessToken, refreshToken: rotated.newRefreshToken });
});

const logoutSchema = z.object({
  refreshToken: z.string().min(10),
});

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Logout successful
 */
authRouter.post("/logout", validateBody(logoutSchema), async (req, res) => {
  const { refreshToken } = req.body as z.infer<typeof logoutSchema>;
  const revoked = await revokeRefreshToken(refreshToken);

  // Log logout if we have user info
  if (revoked?.userId) {
    await logActivity({
      type: "user.logout",
      userId: revoked.userId,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });
  }

  res.json({ success: true });
});

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 */
authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await UserModel.findById(req.auth!.userId);
  if (!user) throw new ApiError(401, "Unauthorized", "Unauthorized");
  res.json({ user: user.toJSON() });
});

const forgotSchema = z.object({
  email: emailSchema,
});

authRouter.post(
  "/forgot-password",
  validateBody(forgotSchema),
  async (req, res) => {
    const { email } = req.body as z.infer<typeof forgotSchema>;
    const user = await UserModel.findOne({ email }).select("+passwordHash");

    // Always respond success to avoid account enumeration
    if (!user) return res.json({ success: true });

    const token = randomToken(32);
    user.passwordResetTokenHash = sha256(token);
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save();

    // Log password reset request
    await logActivity({
      type: "user.password_reset_requested",
      userId: (user as any).id,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      metadata: { email: user.email },
    });

    // Email sending is wired up in the email module; for now, return a generic success.
    // (In dev you may choose to log token.)
    res.json({ success: true });
  }
);

const resetSchema = z.object({
  token: z.string().min(10),
  newPassword: passwordSchema,
});

authRouter.post(
  "/reset-password",
  validateBody(resetSchema),
  async (req, res) => {
    const { token, newPassword } = req.body as z.infer<typeof resetSchema>;
    const tokenHash = sha256(token);
    const user = await UserModel.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    }).select("+passwordHash");

    if (!user)
      throw new ApiError(400, "Invalid or expired reset token", "BadRequest");

    user.passwordHash = await hashPassword(newPassword);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();

    // Log password reset
    await logActivity({
      type: "user.password_reset",
      userId: (user as any).id,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      metadata: { email: user.email },
    });

    res.json({ success: true });
  }
);
