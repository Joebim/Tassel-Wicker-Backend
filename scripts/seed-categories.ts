import "dotenv/config";
import path from "path";
import { pathToFileURL } from "url";
import { connectToDatabase } from "../src/config/db";
import { CategoryModel } from "../src/models/Category";
import { env } from "../src/config/env";

type AnyRecord = Record<string, any>;

/**
 * Seed script for Categories
 *
 * This script extracts unique categories from product data and creates category documents.
 * Categories are extracted from:
 * - Basket items (sub products)
 * - Additional standalone products
 * - Main shop products
 *
 * Run with: npm run seed:categories
 */

// Helper function to generate slug from category name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

// Category descriptions (optional, can be customized)
const categoryDescriptions: Record<string, string> = {
  Baskets:
    "Handcrafted wicker baskets with removable cotton liners and vegan leather straps.",
  Stationery:
    "Beautiful journals, notebooks, and writing essentials for mindful moments.",
  Beverages: "Refreshing drinks, juices, and non-alcoholic beverages.",
  "Home & Living":
    "Candles, matches, and home decor items to transform your space.",
  "Food & Treats":
    "Artisan cookies, shortbread, and sweet treats made with quality ingredients.",
  "Beauty & Fragrance":
    "Elegant perfume sets and beauty products for self-care.",
  "Kitchen & Dining":
    "Quality kitchenware and dining essentials for everyday use.",
  Custom: "Customizable celebration baskets and personalized gift options.",
};

async function main() {
  // Ensure env is loaded/validated
  void env;
  await connectToDatabase();

  const staticModulePath = path.resolve(
    process.cwd(),
    "scripts/data/productData.ts"
  );
  // On Windows, dynamic import needs a valid file:// URL.
  const mod = (await import(pathToFileURL(staticModulePath).href)) as AnyRecord;

  const shopProducts: any[] = mod.shopProducts || [];
  const getAllSubProducts: () => any[] = mod.getAllSubProducts;
  const getAdditionalProducts: () => any[] = mod.getAdditionalProducts;

  if (
    !shopProducts.length ||
    typeof getAllSubProducts !== "function" ||
    typeof getAdditionalProducts !== "function"
  ) {
    throw new Error(
      "Could not import static products from scripts/data/productData.ts"
    );
  }

  const subProducts: any[] = getAllSubProducts();
  const additionalProducts: any[] = getAdditionalProducts();

  // Extract all unique categories
  const categorySet = new Set<string>();

  // From sub products (basket items)
  for (const p of subProducts) {
    if (p.category && typeof p.category === "string") {
      categorySet.add(p.category);
    }
  }

  // From additional products
  for (const p of additionalProducts) {
    if (p.category && typeof p.category === "string") {
      categorySet.add(p.category);
    }
    // Also check child items
    if (Array.isArray(p.items)) {
      for (const item of p.items) {
        if (item.category && typeof item.category === "string") {
          categorySet.add(item.category);
        }
      }
    }
  }

  // From main shop products
  for (const p of shopProducts) {
    if (p.category && typeof p.category === "string") {
      categorySet.add(p.category);
    }
  }

  const uniqueCategories = Array.from(categorySet).sort();

  console.log(
    `[seed-categories] Found ${uniqueCategories.length} unique categories:`
  );
  uniqueCategories.forEach((cat) => console.log(`  - ${cat}`));

  // Clear existing categories (optional - comment out if you want to preserve existing)
  // await CategoryModel.deleteMany({});

  const createdCategories: Map<string, any> = new Map();

  // Create or update categories
  for (const categoryName of uniqueCategories) {
    const slug = generateSlug(categoryName);
    const description = categoryDescriptions[categoryName] || undefined;

    // Check if category already exists
    const existing = await CategoryModel.findOne({ slug });
    const isNew = !existing;

    const category = await CategoryModel.findOneAndUpdate(
      { slug },
      {
        name: categoryName,
        slug,
        description,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    createdCategories.set(categoryName, category);
    console.log(
      `[seed-categories] ${
        isNew ? "Created" : "Updated"
      }: ${categoryName} (slug: ${slug})`
    );
  }

  const total = await CategoryModel.countDocuments();
  console.log(`\n[seed-categories] Done. Total categories in db: ${total}`);

  // Display summary
  console.log("\n[seed-categories] Category summary:");
  for (const [name, category] of createdCategories.entries()) {
    console.log(`  - ${name} (${category.slug})`);
  }
}

main().catch((e) => {
  console.error("[seed-categories] Failed:", e);
  process.exit(1);
});
