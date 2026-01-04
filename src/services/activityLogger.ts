import { ActivityModel, ActivityType } from "../models/Activity";

export interface LogActivityParams {
  type: ActivityType;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an activity to the database
 * This is a fire-and-forget operation that won't block the main request flow
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await ActivityModel.create({
      type: params.type,
      userId: params.userId,
      sessionId: params.sessionId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata || {},
    });
  } catch (error) {
    // Log error but don't throw - activity logging should not break the main flow
    console.error("Failed to log activity:", error);
  }
}

/**
 * Extract IP address from request
 */
export function getIpAddress(req: any): string | undefined {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    undefined
  );
}

/**
 * Extract user agent from request
 */
export function getUserAgent(req: any): string | undefined {
  return req.headers["user-agent"] || undefined;
}

