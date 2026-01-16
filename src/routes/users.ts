import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { UserModel } from "../models/User";
import { validateBody } from "../middleware/validate";
import { ApiError } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import {
  logActivity,
  getIpAddress,
  getUserAgent,
} from "../services/activityLogger";

export const usersRouter = Router();

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (Admin/Moderator)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [admin, customer, moderator] }
 *     responses:
 *       200:
 *         description: List of users returned
 */
usersRouter.get(
  "/",
  requireAuth,
  requireRole("admin", "moderator"),
  async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit || 20) || 20)
    );
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const role =
      typeof req.query.role === "string" ? req.query.role : undefined;

    const filter: any = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      UserModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      UserModel.countDocuments(filter),
    ]);

    res.json({
      items: items.map((u) => u.toJSON()),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }
);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID (Admin/Moderator)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
usersRouter.get(
  "/:id",
  requireAuth,
  requireRole("admin", "moderator"),
  async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      throw new ApiError(400, "Invalid id", "BadRequest");

    const user = await UserModel.findById(id);
    if (!user) throw new ApiError(404, "User not found", "NotFound");

    res.json({ item: user.toJSON() });
  }
);

const updateSelfSchema = z.object({
  firstName: z.string().min(1).max(120).optional(),
  lastName: z.string().min(1).max(120).optional(),
  phone: z.string().min(3).max(40).optional(),
  preferences: z
    .object({
      newsletter: z.boolean().optional(),
      marketing: z.boolean().optional(),
      currency: z.string().optional(),
      language: z.string().optional(),
    })
    .optional(),
});

/**
 * @openapi
 * /api/users/me:
 *   patch:
 *     tags: [Users]
 *     summary: Update own profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               phone: { type: string }
 *               preferences:
 *                 type: object
 *                 properties:
 *                   newsletter: { type: boolean }
 *                   marketing: { type: boolean }
 *                   currency: { type: string }
 *                   language: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 */
usersRouter.patch(
  "/me",
  requireAuth,
  validateBody(updateSelfSchema),
  async (req, res) => {
    const userId = req.auth!.userId;
    const body = req.body as z.infer<typeof updateSelfSchema>;

    const update: any = { ...body };
    delete update.preferences; // Handle preferences separately to merge

    // If preferences provided, we need to merge with existing or just set
    // Mongoose map/subdocument handling can be tricky with partial updates,
    // so let's use dot notation for preferences or just overwrite if structure matches
    if (body.preferences) {
      Object.entries(body.preferences).forEach(([key, value]) => {
        update[`preferences.${key}`] = value;
      });
    }

    const updated = await UserModel.findByIdAndUpdate(userId, update, {
      new: true,
    });

    if (!updated) throw new ApiError(404, "User not found", "NotFound");

    await logActivity({
      type: "user.updated",
      userId: userId,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      metadata: {
        changes: body,
      },
    });

    res.json({ item: updated.toJSON() });
  }
);

const updateUserSchema = z.object({
  firstName: z.string().min(1).max(120).optional(),
  lastName: z.string().min(1).max(120).optional(),
  phone: z.string().min(3).max(40).optional(),
  role: z.enum(["admin", "customer", "moderator"]).optional(),
  isEmailVerified: z.boolean().optional(),
});

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update a user (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               phone: { type: string }
 *               role: { type: string, enum: [admin, customer, moderator] }
 *               isEmailVerified: { type: boolean }
 *     responses:
 *       200:
 *         description: User updated successfully
 */
usersRouter.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  validateBody(updateUserSchema),
  async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      throw new ApiError(400, "Invalid id", "BadRequest");

    const body = req.body as z.infer<typeof updateUserSchema>;

    const updated = await UserModel.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!updated) throw new ApiError(404, "User not found", "NotFound");

    // Log user update
    await logActivity({
      type: "user.updated",
      userId: req.auth!.userId,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      metadata: {
        updatedUserId: id,
        changes: body,
      },
    });

    res.json({ item: updated.toJSON() });
  }
);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted
 */
usersRouter.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      throw new ApiError(400, "Invalid id", "BadRequest");

    // Prevent self-deletion
    if (id === req.auth!.userId) {
      throw new ApiError(
        400,
        "You cannot delete your own account",
        "BadRequest"
      );
    }

    const deleted = await UserModel.findByIdAndDelete(id);
    if (!deleted) throw new ApiError(404, "User not found", "NotFound");

    // Log user deletion
    await logActivity({
      type: "user.deleted",
      userId: req.auth!.userId,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      metadata: {
        deletedUserId: id,
        email: deleted.email,
      },
    });

    res.json({ success: true });
  }
);
