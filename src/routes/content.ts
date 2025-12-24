import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import { ContentModel, ContentPage } from "../models/Content";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { ApiError } from "../middleware/errorHandler";
import { validateBody } from "../middleware/validate";
import { uploadDocument } from "../services/cloudinary";

export const contentRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const VALID_PAGES: ContentPage[] = [
  "about",
  "cookie-policy",
  "privacy-policy",
  "terms-of-service",
  "returns",
  "shipping",
];

const PAGE_TITLES: Record<ContentPage, string> = {
  about: "About Page",
  "cookie-policy": "Cookie Policy",
  "privacy-policy": "Privacy Policy",
  "terms-of-service": "Terms of Service",
  returns: "Returns & Exchanges",
  shipping: "Shipping Information",
};

// Helper to validate page
function validatePage(page: string): ContentPage {
  if (!VALID_PAGES.includes(page as ContentPage)) {
    throw new ApiError(
      400,
      `Invalid page. Must be one of: ${VALID_PAGES.join(", ")}`,
      "InvalidPage"
    );
  }
  return page as ContentPage;
}

// Helper to validate About page content structure
function validateAboutContent(content: string): void {
  try {
    const parsed = JSON.parse(content);
    const requiredFields = [
      "heroImage",
      "myWhyTitle",
      "myWhyText1",
      "myWhyText2",
      "myWhyImage",
      "ourStoryTitle",
      "ourStoryText1",
      "ourStoryText2",
      "ourStoryImage",
      "signature",
      "signatureTitle",
      "builtForTitle",
      "builtForVideos",
    ];
    for (const field of requiredFields) {
      if (!(field in parsed)) {
        throw new ApiError(
          400,
          `Invalid About content: missing field '${field}'`,
          "InvalidContentFormat"
        );
      }
      // Validate string fields
      if (field !== "builtForVideos" && typeof parsed[field] !== "string") {
        throw new ApiError(
          400,
          `Invalid About content: field '${field}' must be a string`,
          "InvalidContentFormat"
        );
      }
      // Validate videos array
      if (field === "builtForVideos" && !Array.isArray(parsed[field])) {
        throw new ApiError(
          400,
          `Invalid About content: field '${field}' must be an array`,
          "InvalidContentFormat"
        );
      }
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      400,
      "Invalid About content: must be valid JSON",
      "InvalidContentFormat"
    );
  }
}

// 1. Get Content (Admin)
contentRouter.get(
  "/:page",
  requireAuth,
  requireRole("admin", "moderator"),
  async (req, res) => {
    const page = validatePage(req.params.page);
    const content = await ContentModel.findOne({ page });

    if (!content) {
      throw new ApiError(
        404,
        `Content not found for page: ${page}`,
        "ContentNotFound"
      );
    }

    res.json(content.toJSON());
  }
);

// 2. Get Public Content (No auth required)
contentRouter.get("/public/:page", async (req, res) => {
  const page = validatePage(req.params.page);
  const content = await ContentModel.findOne({ page });

  if (!content) {
    throw new ApiError(
      404,
      `Content not found for page: ${page}`,
      "ContentNotFound"
    );
  }

  const json = content.toJSON();
  // Remove sensitive fields for public endpoint
  delete (json as any).updatedBy;
  delete (json as any).createdAt;

  res.json(json);
});

// 3. Get All Content (Admin)
contentRouter.get(
  "/",
  requireAuth,
  requireRole("admin", "moderator"),
  async (req, res) => {
    const pagesFilter =
      typeof req.query.pages === "string"
        ? req.query.pages.split(",")
        : undefined;

    const filter: any = {};
    if (pagesFilter && pagesFilter.length > 0) {
      const validPages = pagesFilter.filter((p) =>
        VALID_PAGES.includes(p as ContentPage)
      ) as ContentPage[];
      if (validPages.length > 0) {
        filter.page = { $in: validPages };
      }
    }

    const pages = await ContentModel.find(filter).sort({ updatedAt: -1 });
    res.json({
      pages: pages.map((p) => p.toJSON()),
      total: pages.length,
    });
  }
);

const updateContentSchema = z.object({
  content: z.string().min(1),
  documentUrl: z.string().url().optional().nullable(),
});

// 4. Update Content
contentRouter.put(
  "/:page",
  requireAuth,
  requireRole("admin", "moderator"),
  validateBody(updateContentSchema),
  async (req, res) => {
    if (!req.auth?.userId) {
      throw new ApiError(401, "Unauthorized", "Unauthorized");
    }

    const page = validatePage(req.params.page);
    const { content, documentUrl } = req.body as z.infer<
      typeof updateContentSchema
    >;

    // Validate content format for About page
    if (page === "about") {
      validateAboutContent(content);
    }

    const title = PAGE_TITLES[page];

    const updated = await ContentModel.findOneAndUpdate(
      { page },
      {
        id: page,
        page,
        title,
        content,
        documentUrl: documentUrl || null,
        updatedBy: req.auth.userId,
      },
      { upsert: true, new: true }
    );

    res.json(updated.toJSON());
  }
);

// 5. Upload Document
contentRouter.post(
  "/upload",
  requireAuth,
  requireRole("admin", "moderator"),
  upload.single("file"),
  async (req, res) => {
    if (!req.auth?.userId) {
      throw new ApiError(401, "Unauthorized", "Unauthorized");
    }

    const file = req.file;
    if (!file) {
      throw new ApiError(400, "Missing file", "BadRequest");
    }

    const page =
      typeof req.body.page === "string"
        ? validatePage(req.body.page)
        : undefined;
    if (!page) {
      throw new ApiError(400, "Missing page parameter", "BadRequest");
    }

    // Validate file type (PDF only)
    if (file.mimetype !== "application/pdf") {
      throw new ApiError(415, "File must be a PDF", "UnsupportedMediaType");
    }

    // Upload to Cloudinary
    const result = await uploadDocument({
      fileBuffer: file.buffer,
      filename: `${page}-${Date.now()}.pdf`,
    });

    res.json({
      url: result.url,
      filename: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    });
  }
);

