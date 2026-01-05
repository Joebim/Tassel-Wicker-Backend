import { Router } from "express";
import { ActivityModel, ActivityType } from "../models/Activity";
import { UserModel } from "../models/User";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { ApiError } from "../middleware/errorHandler";
import mongoose from "mongoose";

export const activitiesRouter = Router();

const VALID_ACTIVITY_TYPES: ActivityType[] = [
  "user.registered",
  "user.login",
  "user.login_failed",
  "user.logout",
  "user.password_reset_requested",
  "user.password_reset",
  "order.created",
  "order.updated",
  "order.cancelled",
  "order.payment_received",
  "cart.item_added",
  "cart.item_updated",
  "cart.item_removed",
  "cart.cleared",
  "product.created",
  "product.updated",
  "product.deleted",
  "content.updated",
  "category.created",
  "category.updated",
  "category.deleted",
];

// Get Activities (Admin only)
activitiesRouter.get(
  "/",
  requireAuth,
  requireRole("admin", "moderator"),
  async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50) || 50));
    const skip = (page - 1) * limit;

    // Filter by activity type
    const typeFilter =
      typeof req.query.type === "string" && VALID_ACTIVITY_TYPES.includes(req.query.type as ActivityType)
        ? (req.query.type as ActivityType)
        : undefined;

    // Filter by user ID
    const userIdFilter = typeof req.query.userId === "string" ? req.query.userId : undefined;

    // Filter by date range
    const startDate =
      typeof req.query.startDate === "string" ? new Date(req.query.startDate) : undefined;
    const endDate = typeof req.query.endDate === "string" ? new Date(req.query.endDate) : undefined;

    // Filter by orderId in metadata
    const orderIdFilter = typeof req.query.orderId === "string" ? req.query.orderId : undefined;

    // Filter by productId in metadata
    const productIdFilter =
      typeof req.query.productId === "string" ? req.query.productId : undefined;

    // Build filter
    const filter: any = {};
    if (typeFilter) filter.type = typeFilter;
    if (userIdFilter) filter.userId = userIdFilter;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }
    if (orderIdFilter) filter["metadata.orderId"] = orderIdFilter;
    if (productIdFilter) filter["metadata.productId"] = productIdFilter;

    // Execute query
    const [activities, total] = await Promise.all([
      ActivityModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ActivityModel.countDocuments(filter),
    ]);

    // Get unique user IDs from activities
    const userIds = activities
      .map((a) => a.userId)
      .filter((id): id is string => !!id)
      .filter((id, index, self) => self.indexOf(id) === index)
      .filter((id) => mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    // Fetch users in bulk
    const users = userIds.length > 0 ? await UserModel.find({ _id: { $in: userIds } }) : [];
    const userMap = new Map<string, any>();
    users.forEach((user) => {
      const userJson = user.toJSON();
      userMap.set(String(user._id), {
        id: userJson.id,
        email: userJson.email,
        firstName: userJson.firstName || null,
        lastName: userJson.lastName || null,
        fullName: userJson.firstName && userJson.lastName
          ? `${userJson.firstName} ${userJson.lastName}`
          : userJson.firstName || userJson.lastName || null,
        role: userJson.role,
      });
    });

    // Map activities with user information
    const activitiesWithUsers = activities.map((a) => {
      const activityJson = a.toJSON() as any;
      if (activityJson.userId) {
        const user = userMap.get(activityJson.userId);
        if (user) {
          activityJson.user = user;
        }
      }
      return activityJson;
    });

    res.json({
      activities: activitiesWithUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
);

// Get Activity Statistics (Admin only)
activitiesRouter.get(
  "/stats",
  requireAuth,
  requireRole("admin", "moderator"),
  async (req, res) => {
    const startDate =
      typeof req.query.startDate === "string" ? new Date(req.query.startDate) : undefined;
    const endDate = typeof req.query.endDate === "string" ? new Date(req.query.endDate) : undefined;

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = startDate;
      if (endDate) dateFilter.createdAt.$lte = endDate;
    }

    // Get activity counts by type
    const activityCounts = await ActivityModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get total unique users
    const uniqueUsers = await ActivityModel.distinct("userId", {
      ...dateFilter,
      userId: { $exists: true, $ne: null },
    });

    // Get recent activities count (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await ActivityModel.countDocuments({
      createdAt: { $gte: last24Hours },
    });

    res.json({
      activityCounts: activityCounts.map((item) => ({
        type: item._id,
        count: item.count,
      })),
      totalUniqueUsers: uniqueUsers.length,
      recentActivitiesCount: recentCount,
      dateRange: {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      },
    });
  }
);

// Get Activity by ID (Admin only)
activitiesRouter.get(
  "/:id",
  requireAuth,
  requireRole("admin", "moderator"),
  async (req, res) => {
    const activity = await ActivityModel.findById(req.params.id);

    if (!activity) {
      throw new ApiError(404, "Activity not found", "NotFound");
    }

    const activityJson = activity.toJSON() as any;

    // Add user information if userId exists
    if (activityJson.userId && mongoose.isValidObjectId(activityJson.userId)) {
      const user = await UserModel.findById(activityJson.userId);
      if (user) {
        const userJson = user.toJSON();
        activityJson.user = {
          id: userJson.id,
          email: userJson.email,
          firstName: userJson.firstName || null,
          lastName: userJson.lastName || null,
          fullName: userJson.firstName && userJson.lastName
            ? `${userJson.firstName} ${userJson.lastName}`
            : userJson.firstName || userJson.lastName || null,
          role: userJson.role,
        };
      }
    }

    res.json(activityJson);
  }
);

