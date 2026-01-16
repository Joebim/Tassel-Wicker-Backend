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
import {
  logActivity,
  getIpAddress,
  getUserAgent,
} from "../services/activityLogger";

export const productsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

/**
 * @openapi
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: List all products
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of products returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items: { type: array, items: { $ref: '#/components/schemas/Product' } }
 *                 total: { type: integer }
 */
productsRouter.get("/", async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20) || 20));
  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : "";
  const categoryId =
    typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
  const productType =
    typeof req.query.type === "string" ? req.query.type : undefined;
  const productRole =
    typeof req.query.role === "string" ? req.query.role : undefined;
  const featured =
    typeof req.query.featured === "string"
      ? req.query.featured === "true"
      : undefined;
  const inStock =
    typeof req.query.inStock === "string"
      ? req.query.inStock === "true"
      : undefined;

  const filter: any = {};
  if (productType) filter.productType = productType;
  if (productRole) filter.productRole = productRole;
  if (featured !== undefined) filter.featured = featured;
  if (inStock !== undefined) filter.inStock = inStock;
  if (categoryId) {
    if (!mongoose.isValidObjectId(categoryId))
      throw new ApiError(400, "Invalid categoryId", "BadRequest");
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
  const items = await ProductModel.find({ productType: "single" })
    .sort({ createdAt: -1 })
    .limit(1000);
  res.json({ items: items.map((p) => p.toJSON()) });
});

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 item: { $ref: '#/components/schemas/Product' }
 *       404:
 *         description: Product not found
 */
productsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id))
    throw new ApiError(400, "Invalid id", "BadRequest");
  const include =
    typeof req.query.include === "string" ? req.query.include : "";
  const product = await ProductModel.findById(id);
  if (!product) throw new ApiError(404, "Product not found", "NotFound");
  if (include === "linked") {
    const linked = await ProductModel.find({
      _id: { $in: (product as any).linkedProductIds || [] },
    });
    return res.json({
      item: product.toJSON(),
      linkedProducts: linked.map((p) => p.toJSON()),
    });
  }
  res.json({ item: product.toJSON() });
});

const productImageSchema = z.object({
  url: z.string().min(1),
  isCover: z.boolean().optional(),
});

const productSchema = z.object({
  externalId: z.string().min(1).max(120).optional(),
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(20000),
  price: z.number().nonnegative(),
  originalPrice: z.number().nonnegative().optional(),
  images: z.array(productImageSchema).default([]),
  coverImage: z.string().min(1).optional(), // Deprecated: kept for backward compatibility
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
  dimensions: z.any().optional(),
  materials: z.array(z.string()).optional(),
  careInstructions: z.string().max(5000).optional(),
});

/**
 * @openapi
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product (Admin/Moderator)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Product' }
 *     responses:
 *       201:
 *         description: Product created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
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
    if (
      body.parentProductId &&
      !mongoose.isValidObjectId(body.parentProductId)
    ) {
      throw new ApiError(400, "Invalid parentProductId", "BadRequest");
    }
    if (body.linkedProductIds) {
      for (const pid of body.linkedProductIds) {
        if (!mongoose.isValidObjectId(pid))
          throw new ApiError(400, "Invalid linkedProductIds", "BadRequest");
      }
    }

    // Handle images with isCover flag
    let images = body.images || [];
    if (images.length > 0) {
      const coverCount = images.filter((img) => img.isCover === true).length;
      if (coverCount > 1) {
        throw new ApiError(
          400,
          "Only one image can be set as cover",
          "BadRequest"
        );
      }

      // If no cover is set, set the first image as cover
      if (coverCount === 0 && images.length > 0) {
        images = images.map((img, index) => ({
          ...img,
          isCover: index === 0,
        }));
      }

      // Update coverImage for backward compatibility
      const coverImage = images.find((img) => img.isCover === true);
      if (coverImage) {
        body.coverImage = coverImage.url;
      } else if (images.length > 0) {
        body.coverImage = images[0].url;
      }
    }

    const created = await ProductModel.create({
      ...body,
      images,
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

    // Log product creation
    await logActivity({
      type: "product.created",
      userId: req.auth!.userId,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      metadata: {
        productId: (created as any).id,
        name: created.name,
      },
    });

    res.status(201).json({ item: created.toJSON() });
  }
);

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update a product (Admin/Moderator)
 *     description: Update any field of an existing product. All fields are optional.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               externalId:
 *                 type: string
 *                 maxLength: 120
 *                 description: External reference ID
 *               name:
 *                 type: string
 *                 maxLength: 200
 *                 description: Product name
 *               description:
 *                 type: string
 *                 maxLength: 20000
 *                 description: Product description
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Current price
 *               originalPrice:
 *                 type: number
 *                 minimum: 0
 *                 description: Original price (for showing discounts)
 *               images:
 *                 type: array
 *                 description: Array of product images
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       description: Image URL
 *                     isCover:
 *                       type: boolean
 *                       description: Set as cover image (only one can be true)
 *               coverImage:
 *                 type: string
 *                 description: Cover image URL (deprecated, use images array)
 *               categoryId:
 *                 type: string
 *                 description: Category ID
 *               category:
 *                 type: string
 *                 description: Category name
 *               productType:
 *                 type: string
 *                 enum: [basket, custom, single]
 *                 description: Type of product
 *               productRole:
 *                 type: string
 *                 enum: [main, sub]
 *                 description: Product role (main or sub-product)
 *               parentProductId:
 *                 type: string
 *                 description: Parent product ID (for sub-products)
 *               linkedProductIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of linked product IDs
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Product tags
 *               inStock:
 *                 type: boolean
 *                 description: Whether product is in stock
 *               stockQuantity:
 *                 type: integer
 *                 minimum: 0
 *                 description: Available stock quantity
 *               featured:
 *                 type: boolean
 *                 description: Whether product is featured
 *               isNew:
 *                 type: boolean
 *                 description: Whether product is new
 *               isCustom:
 *                 type: boolean
 *                 description: Whether product is customizable
 *               variants:
 *                 type: array
 *                 description: Product variants
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Variant name
 *                     image:
 *                       type: string
 *                       description: Variant image URL
 *                     price:
 *                       type: number
 *                       minimum: 0
 *                       description: Variant price
 *               details:
 *                 type: object
 *                 description: Additional product details (flexible schema)
 *               dimensions:
 *                 type: object
 *                 description: Product dimensions (dynamic object)
 *               materials:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Materials used
 *               careInstructions:
 *                 type: string
 *                 maxLength: 5000
 *                 description: Care instructions
 *           example:
 *             name: "Premium Wicker Gift Basket"
 *             description: "A beautifully handcrafted wicker basket filled with premium items"
 *             price: 89.99
 *             originalPrice: 120.00
 *             images:
 *               - url: "https://example.com/image1.jpg"
 *                 isCover: true
 *               - url: "https://example.com/image2.jpg"
 *                 isCover: false
 *             categoryId: "60d5ec49f1b2c72b8c8e4f1a"
 *             category: "Gift Baskets"
 *             productType: "basket"
 *             productRole: "main"
 *             linkedProductIds: ["60d5ec49f1b2c72b8c8e4f1b", "60d5ec49f1b2c72b8c8e4f1c"]
 *             tags: ["premium", "handcrafted", "gift"]
 *             inStock: true
 *             stockQuantity: 25
 *             featured: true
 *             isNew: false
 *             isCustom: false
 *             variants:
 *               - name: "Small"
 *                 image: "https://example.com/small.jpg"
 *                 price: 69.99
 *               - name: "Large"
 *                 image: "https://example.com/large.jpg"
 *                 price: 109.99
 *             dimensions:
 *               length: 30
 *               width: 20
 *               height: 15
 *             materials: ["Natural Wicker", "Cotton Lining"]
 *             careInstructions: "Wipe clean with a damp cloth. Avoid direct sunlight."
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 item:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin/Moderator only)
 */
productsRouter.put(
  "/:id",
  requireAuth,
  requireRole("admin", "moderator"),
  validateBody(productSchema.partial()),
  async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      throw new ApiError(400, "Invalid id", "BadRequest");

    const body = req.body as Partial<z.infer<typeof productSchema>>;
    if (body.categoryId && !mongoose.isValidObjectId(body.categoryId)) {
      throw new ApiError(400, "Invalid categoryId", "BadRequest");
    }
    if (
      body.parentProductId &&
      !mongoose.isValidObjectId(body.parentProductId)
    ) {
      throw new ApiError(400, "Invalid parentProductId", "BadRequest");
    }
    if (body.linkedProductIds) {
      for (const pid of body.linkedProductIds) {
        if (!mongoose.isValidObjectId(pid))
          throw new ApiError(400, "Invalid linkedProductIds", "BadRequest");
      }
    }

    // Handle images with isCover flag
    // If images are being updated, ensure only one image has isCover: true
    if (body.images && Array.isArray(body.images)) {
      const coverCount = body.images.filter(
        (img) => img.isCover === true
      ).length;
      if (coverCount > 1) {
        throw new ApiError(
          400,
          "Only one image can be set as cover",
          "BadRequest"
        );
      }

      // If an image is set as cover, update coverImage field for backward compatibility
      const coverImage = body.images.find((img) => img.isCover === true);
      if (coverImage) {
        body.coverImage = coverImage.url;
      } else if (body.images.length > 0) {
        // If no cover is set, use the first image
        body.coverImage = body.images[0].url;
      }
    }

    const updated = await ProductModel.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!updated) throw new ApiError(404, "Product not found", "NotFound");

    // Log product update
    await logActivity({
      type: "product.updated",
      userId: req.auth!.userId,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      metadata: {
        productId: (updated as any).id,
        name: updated.name,
      },
    });

    res.json({ item: updated.toJSON() });
  }
);

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product deleted
 *       404:
 *         description: Product not found
 */
productsRouter.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      throw new ApiError(400, "Invalid id", "BadRequest");
    const deleted = await ProductModel.findByIdAndDelete(id);
    if (!deleted) throw new ApiError(404, "Product not found", "NotFound");

    // Log product deletion
    await logActivity({
      type: "product.deleted",
      userId: req.auth!.userId,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      metadata: {
        productId: id,
        name: deleted.name,
      },
    });

    res.json({ success: true });
  }
);

/**
 * @openapi
 * /api/products/{id}/images:
 *   post:
 *     tags: [Products]
 *     summary: Upload an image to a product (Admin/Moderator)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       404:
 *         description: Product not found
 */
// Upload a new image for a product (Cloudinary) and append it to `images`
productsRouter.post(
  "/:id/images",
  requireAuth,
  requireRole("admin", "moderator"),
  upload.single("file"),
  async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      throw new ApiError(400, "Invalid id", "BadRequest");
    if (!req.file) throw new ApiError(400, "Missing file", "BadRequest");

    const uploaded = await uploadProductImage({
      fileBuffer: req.file.buffer,
      filename: req.file.originalname,
    });

    // Get current product to check if it has any images
    const product = await ProductModel.findById(id);
    if (!product) throw new ApiError(404, "Product not found", "NotFound");

    // Add new image with isCover: false by default (unless it's the first image)
    const isFirstImage = product.images.length === 0;
    const newImage = {
      url: uploaded.url,
      isCover: isFirstImage, // Set as cover if it's the first image
    };

    // Build update operation
    const updateData: any = {
      $push: { images: newImage },
    };

    // If this is the first image, also update coverImage for backward compatibility
    if (isFirstImage) {
      updateData.coverImage = uploaded.url;
    }

    const updated = await ProductModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updated) throw new ApiError(404, "Product not found", "NotFound");

    // Log product image upload
    await logActivity({
      type: "product.image_uploaded",
      userId: req.auth!.userId,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      metadata: {
        productId: id,
        url: uploaded.url,
      },
    });

    res.json({ item: updated.toJSON(), upload: uploaded });
  }
);
