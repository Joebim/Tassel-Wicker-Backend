import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { CategoryModel } from "../models/Category";
import { validateBody } from "../middleware/validate";
import { ApiError } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { slugify } from "../utils/slugify";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (_req, res) => {
  const categories = await CategoryModel.find().sort({ name: 1 });
  res.json({ items: categories.map((c) => c.toJSON()) });
});

categoriesRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid id", "BadRequest");
  const category = await CategoryModel.findById(id);
  if (!category) throw new ApiError(404, "Category not found", "NotFound");
  res.json({ item: category.toJSON() });
});

const upsertCategorySchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  image: z.string().url().optional(),
});

categoriesRouter.post(
  "/",
  requireAuth,
  requireRole("admin", "moderator"),
  validateBody(upsertCategorySchema),
  async (req, res) => {
    const body = req.body as z.infer<typeof upsertCategorySchema>;
    const slug = (body.slug ? slugify(body.slug) : slugify(body.name)) || slugify(body.name);
    const created = await CategoryModel.create({
      name: body.name,
      slug,
      description: body.description,
      image: body.image,
    });
    res.status(201).json({ item: created.toJSON() });
  }
);

categoriesRouter.put(
  "/:id",
  requireAuth,
  requireRole("admin", "moderator"),
  validateBody(upsertCategorySchema.partial()),
  async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid id", "BadRequest");

    const body = req.body as Partial<z.infer<typeof upsertCategorySchema>>;
    const update: any = { ...body };
    if (body.slug) update.slug = slugify(body.slug);
    if (body.name && !body.slug) update.slug = slugify(body.name);

    const updated = await CategoryModel.findByIdAndUpdate(id, update, { new: true });
    if (!updated) throw new ApiError(404, "Category not found", "NotFound");
    res.json({ item: updated.toJSON() });
  }
);

categoriesRouter.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid id", "BadRequest");
    const deleted = await CategoryModel.findByIdAndDelete(id);
    if (!deleted) throw new ApiError(404, "Category not found", "NotFound");
    res.json({ success: true });
  }
);


