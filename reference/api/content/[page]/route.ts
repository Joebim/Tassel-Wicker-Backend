import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { createErrorResponse, ErrorCodes } from "@/lib/api/errors";
import { isValidPage, validateAboutContent } from "@/lib/api/validation";
import { db } from "@/lib/api/db";
import type { ContentData, UpdateContentRequest } from "@/types/content";

/**
 * GET /api/content/:page - Get content (Admin)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ page: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult.error || !authResult.user) {
      return createErrorResponse(
        ErrorCodes.FORBIDDEN,
        authResult.error || "Admin access required",
        403
      );
    }

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

    const response: ContentData = {
      id: content.id,
      page: content.page as ContentData["page"],
      title: content.title,
      content: content.content,
      documentUrl: content.documentUrl,
      updatedAt: content.updatedAt.toISOString(),
      updatedBy: content.updatedBy,
      createdAt: content.createdAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching content:", error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch content",
      500
    );
  }
}

/**
 * PUT /api/content/:page - Update content
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ page: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult.error || !authResult.user) {
      return createErrorResponse(
        ErrorCodes.FORBIDDEN,
        authResult.error || "Admin access required",
        403
      );
    }

    const { page } = await params;

    if (!isValidPage(page)) {
      return createErrorResponse(
        ErrorCodes.INVALID_PAGE,
        `Invalid page: ${page}`,
        400
      );
    }

    const body: UpdateContentRequest = await request.json();
    const { content, documentUrl } = body;

    if (!content) {
      return createErrorResponse(
        ErrorCodes.BAD_REQUEST,
        "Content is required",
        400
      );
    }

    // Validate About page JSON structure
    if (page === "about") {
      const validation = validateAboutContent(content);
      if (!validation.valid) {
        return createErrorResponse(
          ErrorCodes.INVALID_CONTENT_FORMAT,
          validation.error || "Invalid About page content structure",
          400
        );
      }
    }

    // Get page title
    const pageTitles: Record<string, string> = {
      about: "About Page",
      "cookie-policy": "Cookie Policy",
      "privacy-policy": "Privacy Policy",
      "terms-of-service": "Terms of Service",
      returns: "Returns & Exchanges",
      shipping: "Shipping Information",
    };

    const updated = await db.upsertContent(page, {
      id: page,
      page: page as ContentData["page"],
      title: pageTitles[page] || page,
      content,
      documentUrl: documentUrl || undefined,
      updatedAt: new Date(),
      updatedBy: authResult.user.id,
      createdAt: new Date(),
    });

    const response: ContentData = {
      id: updated.id,
      page: updated.page as ContentData["page"],
      title: updated.title,
      content: updated.content,
      documentUrl: updated.documentUrl,
      updatedAt: updated.updatedAt.toISOString(),
      updatedBy: updated.updatedBy,
      createdAt: updated.createdAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating content:", error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to update content",
      500
    );
  }
}



