import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { ApiError } from "../middleware/errorHandler";
import { uploadProductImage, uploadMedia, UploadResourceType } from "../services/cloudinary";

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
      if (typeParam === "image" || typeParam === "video" || typeParam === "document" || typeParam === "raw") {
        resourceType = typeParam === "document" ? "raw" : typeParam;
      } else {
        throw new ApiError(400, "Invalid type. Must be 'image', 'video', or 'document'", "BadRequest");
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
      throw new ApiError(
        500,
        error.message || "Upload failed",
        "UploadError"
      );
    }
  }
);


