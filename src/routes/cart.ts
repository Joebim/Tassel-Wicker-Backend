import { Router } from "express";
import { z } from "zod";
import { CartModel, CartItem } from "../models/Cart";
import { ProductModel } from "../models/Product";
import { requireAuth } from "../middleware/auth";
import { optionalAuth } from "../middleware/optionalAuth";
import { ApiError } from "../middleware/errorHandler";
import { validateBody } from "../middleware/validate";
import mongoose from "mongoose";
import {
  logActivity,
  getIpAddress,
  getUserAgent,
} from "../services/activityLogger";

export const cartRouter = Router();

// Helper to get or create cart
async function getOrCreateCart(userId?: string, sessionId?: string) {
  if (userId) {
    let cart = await CartModel.findOne({ userId });
    if (!cart) {
      cart = await CartModel.create({
        userId,
        items: [],
        totalPrice: 0,
        totalItems: 0,
      });
    }
    return cart;
  } else if (sessionId) {
    let cart = await CartModel.findOne({ sessionId });
    if (!cart) {
      cart = await CartModel.create({
        sessionId,
        items: [],
        totalPrice: 0,
        totalItems: 0,
      });
    }
    return cart;
  }
  throw new ApiError(400, "Either userId or sessionId required", "BadRequest");
}

// Helper to validate product exists and get current price
async function validateProduct(productId: string) {
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid productId", "BadRequest");
  }
  const product = await ProductModel.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found", "NotFound");
  }
  if (!product.inStock) {
    throw new ApiError(400, "Product out of stock", "ProductOutOfStock");
  }
  return product;
}

// Helper to populate basket item images from linked products
async function populateBasketItemImages(cart: any): Promise<boolean> {
  // Get all unique product IDs from cart items
  // Process all items, not just those with existing basketItems
  const productIds = cart.items
    .map((item: CartItem) => {
      try {
        return new mongoose.Types.ObjectId(item.productId);
      } catch {
        return null;
      }
    })
    .filter(
      (id: mongoose.Types.ObjectId | null): id is mongoose.Types.ObjectId =>
        id !== null
    );

  if (productIds.length === 0) return false;

  // Fetch all products with their linked product IDs
  const products = await ProductModel.find({ _id: { $in: productIds } });

  // Get all linked product IDs
  const linkedProductIds = products
    .flatMap((p) => p.linkedProductIds || [])
    .filter((id): id is mongoose.Types.ObjectId => id !== null);

  if (linkedProductIds.length === 0) return false;

  let wasModified = false;

  // Fetch all linked products
  const linkedProducts = await ProductModel.find({
    _id: { $in: linkedProductIds },
  });

  // Create a map of product name/category to product data
  const productMap = new Map<string, any>();
  linkedProducts.forEach((p) => {
    const key1 = `${p.name}`.toLowerCase();
    const key2 = `${p.category}`.toLowerCase();
    productMap.set(key1, p);
    productMap.set(key2, p);
  });

  // Create a map of main product ID to its linked products
  const productLinkedMap = new Map<string, any[]>();
  products.forEach((p) => {
    const linked = linkedProducts.filter((lp) =>
      (p.linkedProductIds || []).some(
        (lid: mongoose.Types.ObjectId) => String(lid) === String(lp._id)
      )
    );
    productLinkedMap.set(String(p._id), linked);
  });

  // Update cart items with images and populate missing basketItems
  cart.items.forEach((item: CartItem) => {
    const linkedProducts = productLinkedMap.get(item.productId) || [];

    if (linkedProducts.length > 0) {
      // If basketItems is empty or missing, populate from linked products
      if (!item.basketItems || item.basketItems.length === 0) {
        item.basketItems = linkedProducts.map((lp: any) => ({
          name: lp.name,
          image:
            lp.coverImage ||
            (lp.images && lp.images.length > 0 ? lp.images[0] : ""),
          category: lp.category || "",
        }));
        wasModified = true;
      } else {
        // Update existing basketItems with images if missing
        const updatedBasketItems = item.basketItems.map((bi) => {
          // If image is missing or empty, try to find it from linked products
          if (!bi.image || bi.image.trim() === "") {
            const linkedProduct = linkedProducts.find(
              (lp: any) => lp.name === bi.name || lp.category === bi.category
            );
            if (linkedProduct) {
              const image =
                linkedProduct.coverImage ||
                (linkedProduct.images && linkedProduct.images[0]
                  ? linkedProduct.images[0]
                  : "");
              if (image) {
                wasModified = true;
                return { ...bi, image };
              }
            }
          }
          return bi;
        });
        item.basketItems = updatedBasketItems;
      }

      // Handle customItems similarly if product type is custom
      const product = products.find(
        (p: any) => String(p._id) === item.productId
      );
      if (product && product.productType === "custom") {
        if (!item.customItems || item.customItems.length === 0) {
          item.customItems = linkedProducts.map((lp: any) => ({
            id: String(lp._id),
            name: lp.name,
            image:
              lp.coverImage ||
              (lp.images && lp.images.length > 0 ? lp.images[0] : ""),
            price: lp.price || 0,
          }));
          wasModified = true;
        } else {
          // Update existing customItems with images if missing
          const updatedCustomItems = item.customItems.map((ci) => {
            if (!ci.image || ci.image.trim() === "") {
              const linkedProduct = linkedProducts.find(
                (lp: any) => String(lp._id) === ci.id || lp.name === ci.name
              );
              if (linkedProduct) {
                const image =
                  linkedProduct.coverImage ||
                  (linkedProduct.images && linkedProduct.images[0]
                    ? linkedProduct.images[0]
                    : "");
                if (image) {
                  wasModified = true;
                  return { ...ci, image };
                }
              }
            }
            return ci;
          });
          item.customItems = updatedCustomItems;
        }
      }
    }
  });

  // Return true if we made any changes
  return wasModified;
}

// 1. Get User Cart
cartRouter.get("/", requireAuth, async (req, res) => {
  if (!req.auth?.userId) {
    throw new ApiError(401, "Unauthorized", "Unauthorized");
  }
  const cart = await getOrCreateCart(req.auth.userId);

  // Populate basket item images if missing
  const wasModified = await populateBasketItemImages(cart);
  if (wasModified) {
    await cart.save();
  }

  res.json({ cart: cart.toJSON() });
});

// 2. Get Guest Cart
cartRouter.get("/guest", async (req, res) => {
  const sessionId = req.header("X-Session-ID");
  if (!sessionId) {
    throw new ApiError(400, "Missing X-Session-ID header", "BadRequest");
  }
  const cart = await getOrCreateCart(undefined, sessionId);

  // Populate basket item images if missing
  const wasModified = await populateBasketItemImages(cart);
  if (wasModified) {
    await cart.save();
  }

  res.json({ cart: cart.toJSON() });
});

const cartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  price: z.number().min(0),
  image: z.string(),
  category: z.string(),
  description: z.string().default(""),
  quantity: z.number().int().min(1),
  variantName: z.string().optional(),
  customItems: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        image: z.string(),
        price: z.number().min(0),
      })
    )
    .optional(),
  basketItems: z
    .array(
      z.object({
        name: z.string(),
        image: z.string(),
        category: z.string(),
      })
    )
    .optional(),
});

// 3. Add Item to Cart
cartRouter.post(
  "/items",
  requireAuth,
  validateBody(z.object({ item: cartItemSchema })),
  async (req, res) => {
    if (!req.auth?.userId) {
      throw new ApiError(401, "Unauthorized", "Unauthorized");
    }

    const { item } = req.body as { item: z.infer<typeof cartItemSchema> };

    // Ensure id is set - use productId if id is missing or undefined
    if (!item.id || item.id === "undefined") {
      item.id =
        item.productId + (item.variantName ? `-${item.variantName}` : "");
    }

    // Handle custom baskets (productId is "custom")
    const isCustomBasket = item.productId === "custom";

    let product = null;
    if (!isCustomBasket) {
      // Validate product exists and get current price (only for non-custom items)
      product = await validateProduct(item.productId);

      // Use server price as source of truth
      const serverPrice = product.price;
      if (item.price !== serverPrice) {
        // Update price to match server
        item.price = serverPrice;
      }
    }

    // If product has linked products, populate basketItems/customItems
    if (
      !isCustomBasket &&
      product &&
      product.linkedProductIds &&
      product.linkedProductIds.length > 0
    ) {
      // Fetch linked products to populate basket items
      const linkedProducts = await ProductModel.find({
        _id: { $in: product.linkedProductIds },
      });

      // If basketItems is empty or not provided, populate from linked products
      if (!item.basketItems || item.basketItems.length === 0) {
        item.basketItems = linkedProducts.map((p) => ({
          name: p.name,
          image:
            p.coverImage ||
            (p.images && p.images.length > 0 ? p.images[0] : ""),
          category: p.category || "",
        }));
      } else {
        // Update existing basketItems with images if missing
        item.basketItems = item.basketItems.map((bi) => {
          // Try to find matching product by name or category
          const linkedProduct = linkedProducts.find(
            (p) => p.name === bi.name || p.category === bi.category
          );
          if (linkedProduct && (!bi.image || bi.image.trim() === "")) {
            return {
              ...bi,
              image:
                linkedProduct.coverImage ||
                (linkedProduct.images && linkedProduct.images[0]
                  ? linkedProduct.images[0]
                  : ""),
            };
          }
          return bi;
        });
      }

      // If customItems is empty or not provided but product type is custom, populate from linked products
      if (
        (!item.customItems || item.customItems.length === 0) &&
        product.productType === "custom"
      ) {
        item.customItems = linkedProducts.map((p) => ({
          id: String(p._id),
          name: p.name,
          image:
            p.coverImage ||
            (p.images && p.images.length > 0 ? p.images[0] : ""),
          price: p.price || 0,
        }));
      } else if (item.customItems && item.customItems.length > 0) {
        // Update existing customItems with images if missing
        item.customItems = item.customItems.map((ci) => {
          // Try to find matching product by id or name
          const linkedProduct = linkedProducts.find(
            (p) => String(p._id) === ci.id || p.name === ci.name
          );
          if (linkedProduct && (!ci.image || ci.image.trim() === "")) {
            return {
              ...ci,
              image:
                linkedProduct.coverImage ||
                (linkedProduct.images && linkedProduct.images[0]
                  ? linkedProduct.images[0]
                  : ""),
            };
          }
          return ci;
        });
      }
    }

    // For custom baskets, validate and populate images for customItems
    if (isCustomBasket && item.customItems && item.customItems.length > 0) {
      // Get all product IDs from customItems
      const customItemProductIds = item.customItems
        .map((ci) => {
          try {
            return new mongoose.Types.ObjectId(ci.id);
          } catch {
            return null;
          }
        })
        .filter(
          (id: mongoose.Types.ObjectId | null): id is mongoose.Types.ObjectId =>
            id !== null
        );

      if (customItemProductIds.length > 0) {
        // Fetch products to get their images
        const customProducts = await ProductModel.find({
          _id: { $in: customItemProductIds },
        });

        // Update customItems with images from products
        item.customItems = item.customItems.map((ci) => {
          const customProduct = customProducts.find(
            (p) => String(p._id) === ci.id
          );
          if (customProduct && (!ci.image || ci.image.trim() === "")) {
            return {
              ...ci,
              image:
                customProduct.coverImage ||
                (customProduct.images && customProduct.images.length > 0
                  ? customProduct.images[0]
                  : ""),
            };
          }
          return ci;
        });
      }
    }

    const cart = await getOrCreateCart(req.auth.userId);

    // Check if item already exists
    const existingItemIndex = cart.items.findIndex(
      (i: CartItem) => i.id === item.id
    );
    if (existingItemIndex >= 0) {
      // Update quantity
      cart.items[existingItemIndex].quantity += item.quantity;
      cart.items[existingItemIndex].updatedAt = new Date();
    } else {
      // Add new item - ensure all fields are properly set
      cart.items.push({
        id: item.id,
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        category: item.category,
        description: item.description || "",
        quantity: item.quantity,
        variantName: item.variantName,
        customItems: item.customItems || [],
        basketItems: item.basketItems || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await cart.save();

    // Log cart item added
    await logActivity({
      type: "cart.item_added",
      userId: req.auth.userId,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      metadata: {
        productId: item.productId,
        productName: item.name,
        quantity:
          existingItemIndex >= 0
            ? cart.items[existingItemIndex].quantity
            : item.quantity,
        price: item.price,
      },
    });

    res.json({
      cart: cart.toJSON(),
      item: {
        id: item.id,
        quantity:
          existingItemIndex >= 0
            ? cart.items[existingItemIndex].quantity
            : item.quantity,
      },
    });
  }
);

// 4. Update Item Quantity
cartRouter.put(
  "/items/:itemId",
  requireAuth,
  validateBody(z.object({ quantity: z.number().int().min(0) })),
  async (req, res) => {
    if (!req.auth?.userId) {
      throw new ApiError(401, "Unauthorized", "Unauthorized");
    }

    const { itemId } = req.params;
    const { quantity } = req.body as { quantity: number };

    const cart = await getOrCreateCart(req.auth.userId);
    const itemIndex = cart.items.findIndex((i: CartItem) => i.id === itemId);

    if (itemIndex < 0) {
      throw new ApiError(404, "Item not found in cart", "CartItemNotFound");
    }

    if (quantity === 0) {
      // Remove item
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].updatedAt = new Date();
    }

    await cart.save();

    const item = cart.items[itemIndex];

    // Log cart item updated or removed (if quantity is 0)
    if (quantity === 0) {
      await logActivity({
        type: "cart.item_removed",
        userId: req.auth.userId,
        ipAddress: getIpAddress(req),
        userAgent: getUserAgent(req),
        metadata: {
          productId: item.productId,
          productName: item.name,
        },
      });
    } else {
      await logActivity({
        type: "cart.item_updated",
        userId: req.auth.userId,
        ipAddress: getIpAddress(req),
        userAgent: getUserAgent(req),
        metadata: {
          productId: item.productId,
          productName: item.name,
          quantity,
        },
      });
    }

    res.json({
      cart: cart.toJSON(),
      item: {
        id: itemId,
        quantity: quantity === 0 ? 0 : cart.items[itemIndex].quantity,
      },
    });
  }
);

// 5. Remove Item from Cart
cartRouter.delete("/items/:itemId", requireAuth, async (req, res) => {
  if (!req.auth?.userId) {
    throw new ApiError(401, "Unauthorized", "Unauthorized");
  }

  const { itemId } = req.params;
  const cart = await getOrCreateCart(req.auth.userId);
  const itemIndex = cart.items.findIndex((i: CartItem) => i.id === itemId);

  if (itemIndex < 0) {
    throw new ApiError(404, "Item not found in cart", "CartItemNotFound");
  }

  cart.items.splice(itemIndex, 1);
  await cart.save();

  res.json({
    cart: cart.toJSON(),
    removedItemId: itemId,
  });
});

// 6. Clear Cart
cartRouter.delete("/", requireAuth, async (req, res) => {
  if (!req.auth?.userId) {
    throw new ApiError(401, "Unauthorized", "Unauthorized");
  }

  const cart = await getOrCreateCart(req.auth.userId);
  cart.items = [];
  await cart.save();

  // Log cart cleared
  await logActivity({
    type: "cart.cleared",
    userId: req.auth.userId,
    ipAddress: getIpAddress(req),
    userAgent: getUserAgent(req),
  });

  res.json({ cart: cart.toJSON() });
});

const syncCartSchema = z.object({
  localCart: z.array(cartItemSchema),
  lastSyncedAt: z.string().optional(),
  mergeStrategy: z.enum(["local", "server", "merge"]).default("merge"),
});

// 7. Sync Cart
cartRouter.post(
  "/sync",
  requireAuth,
  validateBody(syncCartSchema),
  async (req, res) => {
    if (!req.auth?.userId) {
      throw new ApiError(401, "Unauthorized", "Unauthorized");
    }

    const { localCart, mergeStrategy = "merge" } = req.body as z.infer<
      typeof syncCartSchema
    >;

    const serverCart = await getOrCreateCart(req.auth.userId);
    const conflicts: Array<{
      itemId: string;
      localQuantity: number;
      serverQuantity: number;
      resolution: "local" | "server" | "combined";
    }> = [];

    if (mergeStrategy === "local") {
      // Use local cart, discard server
      serverCart.items = localCart.map((item) => ({
        ...item,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    } else if (mergeStrategy === "server") {
      // Use server cart, discard local
      // No changes needed
    } else {
      // Merge strategy
      const mergedItems: CartItem[] = [];
      const processedIds = new Set<string>();

      // Add all server items first, converting to plain objects
      for (const serverItem of serverCart.items) {
        const itemId = String(serverItem.id);
        mergedItems.push({
          id: itemId,
          productId: serverItem.productId,
          name: serverItem.name,
          price: serverItem.price,
          image: serverItem.image,
          category: serverItem.category,
          description: serverItem.description || "",
          quantity: serverItem.quantity,
          variantName: serverItem.variantName,
          customItems: serverItem.customItems || [],
          basketItems: serverItem.basketItems || [],
          createdAt: serverItem.createdAt || new Date(),
          updatedAt: serverItem.updatedAt || new Date(),
        });
        processedIds.add(itemId);
      }

      // Process local items
      for (const localItem of localCart) {
        const localItemId = String(localItem.id);
        const existingIndex = mergedItems.findIndex(
          (i) => String(i.id) === localItemId
        );
        if (existingIndex >= 0) {
          // Item exists in both - resolve conflict
          const serverItem = mergedItems[existingIndex];
          const localQuantity = localItem.quantity;
          const serverQuantity = serverItem.quantity;

          // Use higher quantity, server price
          const finalQuantity = Math.max(localQuantity, serverQuantity);
          mergedItems[existingIndex] = {
            ...serverItem,
            quantity: finalQuantity,
            price: serverItem.price, // Server price is source of truth
            updatedAt: new Date(),
          };

          if (localQuantity !== serverQuantity) {
            conflicts.push({
              itemId: localItemId,
              localQuantity,
              serverQuantity,
              resolution:
                finalQuantity === localQuantity
                  ? "local"
                  : finalQuantity === serverQuantity
                  ? "server"
                  : "combined",
            });
          }
        } else if (!processedIds.has(localItemId)) {
          // New item from local - validate product first
          // Double check it's not already processed (safety check)
          try {
            await validateProduct(localItem.productId);
            mergedItems.push({
              id: localItemId,
              productId: localItem.productId,
              name: localItem.name,
              price: localItem.price,
              image: localItem.image,
              category: localItem.category,
              description: localItem.description || "",
              quantity: localItem.quantity,
              variantName: localItem.variantName,
              customItems: localItem.customItems || [],
              basketItems: localItem.basketItems || [],
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            processedIds.add(localItemId);
          } catch (error) {
            // Skip invalid products
            if (error instanceof ApiError && error.code === "NotFound") {
              // Product no longer exists, skip it
              continue;
            }
            throw error;
          }
        }
      }

      serverCart.items = mergedItems;
    }

    serverCart.lastSyncedAt = new Date();
    await serverCart.save();

    res.json({
      cart: serverCart.toJSON(),
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      syncedAt: serverCart.lastSyncedAt.toISOString(),
    });
  }
);

const mergeGuestCartSchema = z.object({
  guestCart: z.array(cartItemSchema),
});

// 8. Merge Guest Cart on Login
cartRouter.post(
  "/merge-guest",
  requireAuth,
  validateBody(mergeGuestCartSchema),
  async (req, res) => {
    if (!req.auth?.userId) {
      throw new ApiError(401, "Unauthorized", "Unauthorized");
    }

    const sessionId = req.header("X-Session-ID");
    const { guestCart } = req.body as z.infer<typeof mergeGuestCartSchema>;

    const userCart = await getOrCreateCart(req.auth.userId);
    const mergedItems: string[] = [];

    // Add guest cart items to user cart
    for (const guestItem of guestCart) {
      try {
        // Validate product
        await validateProduct(guestItem.productId);

        const existingIndex = userCart.items.findIndex(
          (i: CartItem) => i.id === guestItem.id
        );
        if (existingIndex >= 0) {
          // Item exists - use higher quantity
          userCart.items[existingIndex].quantity = Math.max(
            userCart.items[existingIndex].quantity,
            guestItem.quantity
          );
          userCart.items[existingIndex].updatedAt = new Date();
        } else {
          // New item
          userCart.items.push({
            ...guestItem,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          mergedItems.push(guestItem.id);
        }
      } catch (error) {
        // Skip invalid products
        if (error instanceof ApiError && error.code === "NotFound") {
          continue;
        }
        throw error;
      }
    }

    await userCart.save();

    // Delete guest cart if session ID provided
    if (sessionId) {
      await CartModel.deleteOne({ sessionId });
    }

    res.json({
      cart: userCart.toJSON(),
      mergedItems,
    });
  }
);
