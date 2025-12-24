import { Router } from "express";
import { z } from "zod";
import { CartModel, CartItem } from "../models/Cart";
import { ProductModel } from "../models/Product";
import { requireAuth } from "../middleware/auth";
import { optionalAuth } from "../middleware/optionalAuth";
import { ApiError } from "../middleware/errorHandler";
import { validateBody } from "../middleware/validate";
import mongoose from "mongoose";

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

// 1. Get User Cart
cartRouter.get("/", requireAuth, async (req, res) => {
  if (!req.auth?.userId) {
    throw new ApiError(401, "Unauthorized", "Unauthorized");
  }
  const cart = await getOrCreateCart(req.auth.userId);
  res.json({ cart: cart.toJSON() });
});

// 2. Get Guest Cart
cartRouter.get("/guest", async (req, res) => {
  const sessionId = req.header("X-Session-ID");
  if (!sessionId) {
    throw new ApiError(400, "Missing X-Session-ID header", "BadRequest");
  }
  const cart = await getOrCreateCart(undefined, sessionId);
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

    // Validate product exists and get current price
    const product = await validateProduct(item.productId);

    // Use server price as source of truth
    const serverPrice = product.price;
    if (item.price !== serverPrice) {
      // Update price to match server
      item.price = serverPrice;
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
      // Add new item
      cart.items.push({
        ...item,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await cart.save();

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

      // Add all server items first
      for (const serverItem of serverCart.items) {
        mergedItems.push({ ...serverItem });
        processedIds.add(serverItem.id);
      }

      // Process local items
      for (const localItem of localCart) {
        const existingIndex = mergedItems.findIndex(
          (i) => i.id === localItem.id
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
              itemId: localItem.id,
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
        } else {
          // New item from local - validate product first
          try {
            await validateProduct(localItem.productId);
            mergedItems.push({
              ...localItem,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
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
