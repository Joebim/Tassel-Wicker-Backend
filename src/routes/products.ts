import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { ProductModel } from "../models/Product";
import { validateBody } from "../middleware/validate";
import { ApiError } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import multer from "multer";
import { uploadProductImage } from "../services/cloudinary";

export const productsRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

productsRouter.get("/", async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20) || 20));
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
  const productType = typeof req.query.type === "string" ? req.query.type : undefined;
  const productRole = typeof req.query.role === "string" ? req.query.role : undefined;
  const featured =
    typeof req.query.featured === "string" ? req.query.featured === "true" : undefined;
  const inStock = typeof req.query.inStock === "string" ? req.query.inStock === "true" : undefined;

  const filter: any = {};
  if (productType) filter.productType = productType;
  if (productRole) filter.productRole = productRole;
  if (featured !== undefined) filter.featured = featured;
  if (inStock !== undefined) filter.inStock = inStock;
  if (categoryId) {
    if (!mongoose.isValidObjectId(categoryId)) throw new ApiError(400, "Invalid categoryId", "BadRequest");
    filter.categoryId = categoryId;
  }
  if (search) filter.$text = { $search: search };

  const [items, total] = await Promise.all([
    ProductModel.find(filter)
      .sort(search ? { score: { $meta: "textScore" } } : { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ProductModel.countDocuments(filter),
  ]);

  res.json({
    items: items.map((p) => p.toJSON()),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

// Convenience endpoint for Custom page: all standalone products (sub + single mains)
productsRouter.get("/singles", async (_req, res) => {
  const items = await ProductModel.find({ productType: "single" }).sort({ createdAt: -1 }).limit(1000);
  res.json({ items: items.map((p) => p.toJSON()) });
});

productsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid id", "BadRequest");
  const include = typeof req.query.include === "string" ? req.query.include : "";
  const product = await ProductModel.findById(id);
  if (!product) throw new ApiError(404, "Product not found", "NotFound");
  if (include === "linked") {
    const linked = await ProductModel.find({ _id: { $in: (product as any).linkedProductIds || [] } });
    return res.json({ item: product.toJSON(), linkedProducts: linked.map((p) => p.toJSON()) });
  }
  res.json({ item: product.toJSON() });
});

const productSchema = z.object({
  externalId: z.string().min(1).max(120).optional(),
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(20000),
  price: z.number().nonnegative(),
  originalPrice: z.number().nonnegative().optional(),
  images: z.array(z.string().min(1)).default([]),
  coverImage: z.string().min(1).optional(),
  categoryId: z.string().optional(),
  category: z.string().optional(),
  productType: z.enum(["basket", "custom", "single"]).optional(),
  productRole: z.enum(["main", "sub"]).optional(),
  parentProductId: z.string().optional(),
  linkedProductIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).default([]),
  inStock: z.boolean().optional(),
  stockQuantity: z.number().int().nonnegative().optional(),
  featured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isCustom: z.boolean().optional(),
  variants: z
    .array(
      z.object({
        name: z.string().min(1),
        image: z.string().min(1),
        price: z.number().nonnegative(),
      })
    )
    .optional(),
  details: z.any().optional(),
  dimensions: z
    .object({
      length: z.number().nonnegative(),
      width: z.number().nonnegative(),
      height: z.number().nonnegative(),
    })
    .optional(),
  materials: z.array(z.string()).optional(),
  careInstructions: z.string().max(5000).optional(),
});

productsRouter.post(
  "/",
  requireAuth,
  requireRole("admin", "moderator"),
  validateBody(productSchema),
  async (req, res) => {
    const body = req.body as z.infer<typeof productSchema>;
    if (body.categoryId && !mongoose.isValidObjectId(body.categoryId)) {
      throw new ApiError(400, "Invalid categoryId", "BadRequest");
    }
    if (body.parentProductId && !mongoose.isValidObjectId(body.parentProductId)) {
      throw new ApiError(400, "Invalid parentProductId", "BadRequest");
    }
    if (body.linkedProductIds) {
      for (const pid of body.linkedProductIds) {
        if (!mongoose.isValidObjectId(pid)) throw new ApiError(400, "Invalid linkedProductIds", "BadRequest");
      }
    }

    const created = await ProductModel.create({
      ...body,
      categoryId: body.categoryId || undefined,
      inStock: body.inStock ?? true,
      featured: body.featured ?? false,
      stockQuantity: body.stockQuantity ?? 0,
      productType: body.productType ?? "single",
      productRole: body.productRole ?? "main",
      parentProductId: body.parentProductId || undefined,
      linkedProductIds: body.linkedProductIds || [],
      isNew: body.isNew ?? false,
      isCustom: body.isCustom ?? false,
      variants: body.variants || [],
    });

    res.status(201).json({ item: created.toJSON() });
  }
);

productsRouter.put(
  "/:id",
  requireAuth,
  requireRole("admin", "moderator"),
  validateBody(productSchema.partial()),
  async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid id", "BadRequest");

    const body = req.body as Partial<z.infer<typeof productSchema>>;
    if (body.categoryId && !mongoose.isValidObjectId(body.categoryId)) {
      throw new ApiError(400, "Invalid categoryId", "BadRequest");
    }
    if (body.parentProductId && !mongoose.isValidObjectId(body.parentProductId)) {
      throw new ApiError(400, "Invalid parentProductId", "BadRequest");
    }
    if (body.linkedProductIds) {
      for (const pid of body.linkedProductIds) {
        if (!mongoose.isValidObjectId(pid)) throw new ApiError(400, "Invalid linkedProductIds", "BadRequest");
      }
    }

    const updated = await ProductModel.findByIdAndUpdate(id, body, { new: true });
    if (!updated) throw new ApiError(404, "Product not found", "NotFound");
    res.json({ item: updated.toJSON() });
  }
);

productsRouter.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid id", "BadRequest");
    const deleted = await ProductModel.findByIdAndDelete(id);
    if (!deleted) throw new ApiError(404, "Product not found", "NotFound");
    res.json({ success: true });
  }
);

// Upload a new image for a product (Cloudinary) and append it to `images`
productsRouter.post(
  "/:id/images",
  requireAuth,
  requireRole("admin", "moderator"),
  upload.single("file"),
  async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid id", "BadRequest");
    if (!req.file) throw new ApiError(400, "Missing file", "BadRequest");

    const uploaded = await uploadProductImage({
      fileBuffer: req.file.buffer,
      filename: req.file.originalname,
    });

    const updated = await ProductModel.findByIdAndUpdate(
      id,
      { $push: { images: uploaded.url } },
      { new: true }
    );
    if (!updated) throw new ApiError(404, "Product not found", "NotFound");

    res.json({ item: updated.toJSON(), upload: uploaded });
  }
);


