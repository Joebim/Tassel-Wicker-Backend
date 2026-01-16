import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse, ErrorCodes } from "@/lib/api/errors";
import { isValidPage } from "@/lib/api/validation";
import { db } from "@/lib/api/db";
import type { ContentData } from "@/types/content";

/**
 * GET /api/content/public/:page - Get public content (no auth required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ page: string }> }
) {
  try {
    const { page } = await params;

    if (!isValidPage(page)) {
      return createErrorResponse(
        ErrorCodes.INVALID_PAGE,
        `Invalid page: ${page}`,
        400
      );
    }

    const content = await db.findContentByPage(page);

    if (!content) {
      return createErrorResponse(
        ErrorCodes.CONTENT_NOT_FOUND,
        `Content not found for page: ${page}`,
        404
      );
    }

    // Public response excludes sensitive fields
    const response: Omit<ContentData, "updatedBy" | "createdAt"> = {
      id: content.id,
      page: content.page as ContentData["page"],
      title: content.title,
      content: content.content,
      documentUrl: content.documentUrl,
      updatedAt: content.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching public content:", error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch content",
      500
    );
  }
}



