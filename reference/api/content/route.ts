import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { createErrorResponse, ErrorCodes } from "@/lib/api/errors";
import { isValidPage } from "@/lib/api/validation";
import { db } from "@/lib/api/db";
import type { ContentData } from "@/types/content";

/**
 * GET /api/content - Get all content (Admin)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult.error || !authResult.user) {
      return createErrorResponse(
        ErrorCodes.FORBIDDEN,
        authResult.error || "Admin access required",
        403
      );
    }

    const { searchParams } = new URL(request.url);
    const pagesParam = searchParams.get("pages");

    let pages: string[] | undefined;
    if (pagesParam) {
      pages = pagesParam.split(",").map((p) => p.trim());
      // Validate all pages
      for (const page of pages) {
        if (!isValidPage(page)) {
          return createErrorResponse(
            ErrorCodes.INVALID_PAGE,
            `Invalid page: ${page}`,
            400
          );
        }
      }
    }

    const allContent = await db.findAllContent(pages);

    const response = {
      pages: allContent.map((content) => ({
        id: content.id,
        page: content.page as ContentData["page"],
        title: content.title,
        content: content.content,
        documentUrl: content.documentUrl,
        updatedAt: content.updatedAt.toISOString(),
        updatedBy: content.updatedBy,
        createdAt: content.createdAt.toISOString(),
      })) as ContentData[],
      total: allContent.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching all content:", error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch content",
      500
    );
  }
}




