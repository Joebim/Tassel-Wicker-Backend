import "dotenv/config";
import path from "path";
import { pathToFileURL } from "url";
import { connectToDatabase } from "../src/config/db";
import { ProductModel } from "../src/models/Product";
import { env } from "../src/config/env";

type AnyRecord = Record<string, any>;

async function main() {
  // Ensure env is loaded/validated
  void env;
  await connectToDatabase();

  const staticModulePath = path.resolve(
    process.cwd(),
    "tassel-wicker-next/utils/productData.ts"
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
      "Could not import static products from tassel-wicker-next/utils/productData.ts"
    );
  }

  const subProducts: any[] = getAllSubProducts();
  const additionalProducts: any[] = getAdditionalProducts();

  // Clear ALL existing products before seeding
  await ProductModel.deleteMany({});

  const createdByExternalId = new Map<string, any>();

  // 1) Create all "leaf" sub products first (basket items)
  for (const p of subProducts) {
    const doc = await ProductModel.create({
      externalId: String(p.id),
      name: p.name,
      description: p.description || "",
      price: Number(p.variants?.[0]?.price ?? p.price ?? 0),
      images: [p.image ?? p.variants?.[0]?.image ?? ""].filter(Boolean),
      coverImage: p.image ?? p.variants?.[0]?.image ?? undefined,
      category: p.category,
      productType: "single",
      productRole: "sub",
      tags: [],
      inStock: true,
      stockQuantity: 9999,
      featured: false,
      isNew: false,
      isCustom: false,
      variants: (p.variants || []).map((v: any) => ({
        name: String(v.name || "Default"),
        image: String(v.image || ""),
        price: Number(v.price || 0),
      })),
      details: p.details || undefined,
    });
    createdByExternalId.set(String(p.id), doc);
  }

  // 2) Create standalone products (some may have child items) - These are singles, not main products
  for (const p of additionalProducts) {
    const externalId = String(p.id);
    const hasChildren = Array.isArray(p.items) && p.items.length > 0;

    const mainDoc = await ProductModel.create({
      externalId,
      name: p.name,
      description: p.description || "",
      price: Number(p.variants?.[0]?.price ?? p.price ?? 0),
      images: [p.image ?? p.variants?.[0]?.image ?? ""].filter(Boolean),
      coverImage: p.image ?? p.variants?.[0]?.image ?? undefined,
      category: p.category,
      productType: "single",
      productRole: "sub", // These are singles, not main products
      tags: [],
      inStock: true,
      stockQuantity: 9999,
      featured: false,
      isNew: false,
      isCustom: false,
      variants: (p.variants || []).map((v: any) => ({
        name: String(v.name || "Default"),
        image: String(v.image || ""),
        price: Number(v.price || 0),
      })),
      details: p.details || p.customOptions || undefined,
      linkedProductIds: [],
    });
    createdByExternalId.set(externalId, mainDoc);

    
    if (hasChildren) {
      const childIds: any[] = [];
      for (const child of p.items) {
        const childDoc = await ProductModel.create({
          externalId: String(child.id),
          name: child.name,
          description: child.description || "",
          price: Number(child.variants?.[0]?.price ?? child.price ?? 0),
          images: [child.image ?? child.variants?.[0]?.image ?? ""].filter(
            Boolean
          ),
          coverImage: child.image ?? child.variants?.[0]?.image ?? undefined,
          category: child.category || p.category,
          productType: "single",
          productRole: "sub",
          parentProductId: mainDoc._id,
          tags: [],
          inStock: true,
          stockQuantity: 9999,
          featured: false,
          isNew: false,
          isCustom: false,
          variants: (child.variants || []).map((v: any) => ({
            name: String(v.name || "Default"),
            image: String(v.image || ""),
            price: Number(v.price || 0),
          })),
          details: child.details || undefined,
        });
        createdByExternalId.set(String(child.id), childDoc);
        childIds.push(childDoc._id);
      }
      await ProductModel.updateOne(
        { _id: mainDoc._id },
        { $set: { linkedProductIds: childIds } }
      );
    }
  }

  // 3) Create main shop products (only The Duro Basket, The Dee Basket, and Build Your Basket)
  const mainProductNames = [
    "The Duro Basket",
    "The Dee Basket",
    "Build Your Basket",
  ];
  const mainProducts = shopProducts.filter((p) =>
    mainProductNames.includes(p.name)
  );

  for (const p of mainProducts) {
    const isCustom = !!p.isCustom || p.category?.toLowerCase() === "custom";
    const productType = isCustom ? "custom" : "basket";

    const linkedExternalIds: string[] = Array.isArray(p.items)
      ? p.items.map((it: any) => String(it.id)).filter(Boolean)
      : [];
    const linkedProductIds = linkedExternalIds
      .map((eid) => createdByExternalId.get(eid))
      .filter(Boolean)
      .map((doc) => doc._id);

    const doc = await ProductModel.create({
      externalId: String(p.id),
      name: p.name,
      description: p.description || "",
      price: Number(p.price || 0),
      images: [p.image || ""].filter(Boolean),
      coverImage: p.image || undefined,
      category: p.category,
      productType,
      productRole: "main",
      tags: [],
      inStock: true,
      stockQuantity: 9999,
      featured: !!p.isFeatured,
      isNew: !!p.isNew,
      isCustom: !!p.isCustom,
      variants: [],
      details: p.details || p.customOptions || undefined,
      linkedProductIds,
    });
    createdByExternalId.set(String(p.id), doc);
  }

  const total = await ProductModel.countDocuments();
  // eslint-disable-next-line no-console
  console.log(`[seed] done. products in db: ${total}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("[seed] failed", e);
  process.exit(1);
});
