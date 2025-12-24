import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { ApiError } from "../middleware/errorHandler";
import { uploadProductImage } from "../services/cloudinary";

export const uploadsRouter = Router();

const upload = multer({
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
  upload.single("file"),
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


