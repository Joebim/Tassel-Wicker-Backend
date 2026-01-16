import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { ApiError } from "../middleware/errorHandler";
import {
  uploadProductImage,
  uploadMedia,
  UploadResourceType,
  cloudinary,
  ensureCloudinaryConfigured,
} from "../services/cloudinary";
import {
  logActivity,
  getIpAddress,
  getUserAgent,
} from "../services/activityLogger";
import { ProductModel } from "../models/Product";
import { CategoryModel } from "../models/Category";
import { ContentModel } from "../models/Content";
import { OrderModel } from "../models/Order";

export const uploadsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for videos and large files
});

// Image upload (8MB limit)
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

/**
 * Upload a product image to Cloudinary.
 *
 * Multipart form-data:
 * - file: image file
 */
uploadsRouter.post(
  "/product-image",
  requireAuth,
  requireRole("admin", "moderator"),
  imageUpload.single("file"),
  async (req, res) => {
    const file = req.file;
    if (!file) throw new ApiError(400, "Missing file", "BadRequest");

    const result = await uploadProductImage({
      fileBuffer: file.buffer,
      filename: file.originalname,
    });

    // Log product image upload
    await logActivity({
      type: "upload.product_image",
      userId: req.auth!.userId,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      metadata: {
        url: result.url,
        filename: file.originalname,
      },
    });

    res.json({ success: true, ...result });
  }
);

/**
 * Upload media files (images, videos, documents) to Cloudinary.
 *
 * Supports:
 * - Images: jpg, jpeg, png, gif, webp, svg
 * - Videos: mp4, webm, mov, avi, mkv
 * - Documents: pdf, doc, docx, txt, etc.
 *
 * Multipart form-data:
 * - file: The file to upload
 * - type: (optional) "image" | "video" | "document". If not provided, auto-detected from file type
 * - folder: (optional) Custom folder path in Cloudinary
 */
uploadsRouter.post(
  "/media",
  requireAuth,
  requireRole("admin", "moderator"),
  upload.single("file"),
  async (req, res) => {
    const file = req.file;
    if (!file) {
      throw new ApiError(400, "Missing file", "BadRequest");
    }

    // Determine resource type from query/body or file extension
    const typeParam = (req.body.type || req.query.type) as string | undefined;
    let resourceType: UploadResourceType = "image";

    if (typeParam) {
      if (
        typeParam === "image" ||
        typeParam === "video" ||
        typeParam === "document" ||
        typeParam === "raw"
      ) {
        resourceType = typeParam === "document" ? "raw" : typeParam;
      } else {
        throw new ApiError(
          400,
          "Invalid type. Must be 'image', 'video', or 'document'",
          "BadRequest"
        );
      }
    } else {
      // Auto-detect from file mimetype
      const mimeType = file.mimetype.toLowerCase();
      if (mimeType.startsWith("image/")) {
        resourceType = "image";
      } else if (mimeType.startsWith("video/")) {
        resourceType = "video";
      } else {
        resourceType = "raw"; // For documents and other files
      }
    }

    const folder = req.body.folder || req.query.folder;

    try {
      const result = await uploadMedia({
        fileBuffer: file.buffer,
        filename: file.originalname,
        resourceType,
        folder: folder as string | undefined,
      });

      // Log media upload
      await logActivity({
        type: "upload.media",
        userId: req.auth!.userId,
        ipAddress: getIpAddress(req),
        userAgent: getUserAgent(req),
        metadata: {
          url: result.url,
          resourceType,
          filename: file.originalname,
        },
      });

      res.json({
        success: true,
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
        duration: result.duration,
        format: result.format,
        bytes: result.bytes,
        resourceType,
      });
    } catch (error: any) {
      throw new ApiError(500, error.message || "Upload failed", "UploadError");
    }
  }
);

/**
 * @openapi
 * /api/uploads:
 *   get:
 *     tags: [Uploads]
 *     summary: Get all uploads grouped by folder (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of uploads grouped by folder
 */
uploadsRouter.get("/", requireAuth, requireRole("admin"), async (_req, res) => {
  ensureCloudinaryConfigured();

  // 1. Fetch resources from Cloudinary
  // 1. Fetch resources from Cloudinary (images, videos, and raw files)
  let allResources: any[] = [];

  try {
    const [images, videos, raw] = await Promise.all([
      cloudinary.api.resources({
        resource_type: "image",
        type: "upload",
        max_results: 500,
        direction: "desc",
      }),
      cloudinary.api.resources({
        resource_type: "video",
        type: "upload",
        max_results: 500,
        direction: "desc",
      }),
      cloudinary.api.resources({
        resource_type: "raw",
        type: "upload",
        max_results: 500,
        direction: "desc",
      }),
    ]);

    allResources = [...images.resources, ...videos.resources, ...raw.resources];
  } catch (err: any) {
    console.error("Cloudinary Fetch Error:", err);
    throw new ApiError(
      500,
      "Failed to fetch uploads from Cloudinary: " + (err.message || err)
    );
  }

  // 2. Fetch all DB references to identify linked images
  const [products, categories, contents, orders] = await Promise.all([
    ProductModel.find({}, { images: 1, variants: 1, coverImage: 1 }).lean(),
    CategoryModel.find({}, { image: 1 }).lean(),
    ContentModel.find({}, { documentUrl: 1, content: 1 }).lean(),
    OrderModel.find({}, { "items.productImage": 1 }).lean(),
  ]);

  const linkedUrls = new Set<string>();

  // Helper to add URL/PublicId to Sets
  const addLink = (url?: string) => {
    if (!url) return;
    linkedUrls.add(url);
  };

  // Products
  products.forEach((p) => {
    p.images?.forEach((img: any) => addLink(img.url));
    if (p.coverImage) addLink(p.coverImage);
    p.variants?.forEach((v: any) => addLink(v.image));
  });

  // Categories
  categories.forEach((c) => {
    if (c.image) addLink(c.image);
  });

  // Content
  // Content
  contents.forEach((c) => {
    if (c.documentUrl) addLink(c.documentUrl);

    // 1. Regex for HTML content
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    const sourceRegex = /<source[^>]+src="([^">]+)"/g;
    const iframeRegex = /<iframe[^>]+src="([^">]+)"/g;

    let match;
    while ((match = imgRegex.exec(c.content)) !== null) addLink(match[1]);
    while ((match = sourceRegex.exec(c.content)) !== null) addLink(match[1]);
    while ((match = iframeRegex.exec(c.content)) !== null) addLink(match[1]);

    // 2. Parsed JSON check (for About page structure)
    try {
      const data = JSON.parse(c.content);
      // Recursively find strings that look like Cloudinary URLs
      const findUrls = (obj: any) => {
        if (!obj) return;
        if (typeof obj === "string") {
          if (obj.includes("res.cloudinary.com") || obj.includes("/upload/")) {
            addLink(obj);
          }
        } else if (Array.isArray(obj)) {
          obj.forEach(findUrls);
        } else if (typeof obj === "object") {
          Object.values(obj).forEach(findUrls);
        }
      };
      findUrls(data);
    } catch {
      // Not JSON, ignore
    }
  });

  // Orders
  orders.forEach((o) => {
    o.items?.forEach((item: any) => addLink(item.productImage));
  });

  // 3. Group by folder & Link check
  const foldersMap = new Map<string, any[]>();

  allResources.forEach((resource) => {
    const isLinked =
      linkedUrls.has(resource.secure_url) || linkedUrls.has(resource.url);

    let folderName = "Uncategorized";
    if (resource.folder) {
      folderName = resource.folder;
    } else {
      // Try to extract from public_id if folder prop is missing
      const parts = resource.public_id.split("/");
      if (parts.length > 1) {
        folderName = parts.slice(0, -1).join("/");
      }
    }

    if (!foldersMap.has(folderName)) {
      foldersMap.set(folderName, []);
    }

    foldersMap.get(folderName)!.push({
      ...resource,
      isLinked,
    });
  });

  // Convert map to array
  const grouped = Array.from(foldersMap.entries()).map(([folder, files]) => ({
    folder,
    files,
  }));

  // Sort folders by name
  grouped.sort((a, b) => a.folder.localeCompare(b.folder));

  res.json(grouped);
});

/**
 * @openapi
 * /api/uploads/{publicId}:
 *   delete:
 *     tags: [Uploads]
 *     summary: Delete an upload (Admin only)
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema: { type: string }
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upload deleted
 */
uploadsRouter.delete(
  "/:publicId(*)", // Use wildcard to capture slashes in publicId
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const { publicId } = req.params;
    if (!publicId) throw new ApiError(400, "Missing publicId");

    ensureCloudinaryConfigured();

    try {
      await cloudinary.uploader.destroy(publicId);

      // Log deletion
      await logActivity({
        type: "upload.deleted",
        userId: req.auth!.userId,
        ipAddress: getIpAddress(req),
        userAgent: getUserAgent(req),
        metadata: {
          publicId,
        },
      });

      res.json({ success: true, message: "Deleted successfully" });
    } catch (err) {
      throw new ApiError(500, "Failed to delete upload");
    }
  }
);
