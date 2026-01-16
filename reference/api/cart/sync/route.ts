import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { createErrorResponse, ErrorCodes } from "@/lib/api/errors";
import { db } from "@/lib/api/db";
import type {
  Cart,
  CartItem,
  SyncCartRequest,
  SyncCartResponse,
} from "@/types/cart";

/**
 * POST /api/cart/sync - Sync local and server carts
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error || !authResult.user) {
      return createErrorResponse(
        ErrorCodes.UNAUTHORIZED,
        authResult.error || "Authentication required",
        401
      );
    }

    const body: SyncCartRequest = await request.json();
    const { localCart, lastSyncedAt, mergeStrategy = "merge" } = body;

    if (!Array.isArray(localCart)) {
      return createErrorResponse(
        ErrorCodes.BAD_REQUEST,
        "localCart must be an array",
        400
      );
    }

    const userId = authResult.user.id;
    let serverCart = await db.findCartByUserId(userId);

    // Create server cart if it doesn't exist
    if (!serverCart) {
      serverCart = await db.createCart({
        userId,
        items: [],
        totalPrice: 0,
        totalItems: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    let mergedItems: CartItem[] = [];
    const conflicts: SyncCartResponse["conflicts"] = [];

    // Handle different merge strategies
    if (mergeStrategy === "local") {
      // Use local cart, discard server
      mergedItems = localCart;
    } else if (mergeStrategy === "server") {
      // Use server cart, discard local
      mergedItems = serverCart.items.map((i: any) => ({
        ...i,
        createdAt: i.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: i.updatedAt?.toISOString() || new Date().toISOString(),
      }));
    } else {
      // Merge strategy: combine both carts
      const itemMap = new Map<string, CartItem>();

      // Add server items first
      serverCart.items.forEach((item: any) => {
        itemMap.set(item.id, {
          ...item,
          createdAt: item.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: item.updatedAt?.toISOString() || new Date().toISOString(),
        });
      });

      // Merge local items
      for (const localItem of localCart) {
        const existing = itemMap.get(localItem.id);

        if (existing) {
          // Conflict: same item in both carts
          const serverQuantity = existing.quantity;
          const localQuantity = localItem.quantity;
          const higherQuantity = Math.max(serverQuantity, localQuantity);

          // Use higher quantity
          existing.quantity = higherQuantity;
          // Use server price (server is source of truth)
          existing.price = existing.price;

          if (serverQuantity !== localQuantity) {
            conflicts.push({
              itemId: localItem.id,
              localQuantity,
              serverQuantity,
              resolution: "combined",
            });
          }
        } else {
          // New item from local cart - validate product exists
          const product = await db.findProductById(localItem.productId);
          if (product && product.inStock) {
            itemMap.set(localItem.id, {
              ...localItem,
              price: product.price, // Use server price
            });
          }
          // Skip invalid products
        }
      }

      mergedItems = Array.from(itemMap.values());
    }

    // Recalculate totals
    const totalItems = mergedItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const totalPrice = mergedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Update server cart
    await db.updateCart(userId, {
      items: mergedItems.map((item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(),
      })),
      totalPrice,
      totalItems,
      lastSyncedAt: new Date(),
      updatedAt: new Date(),
    });

    const updatedCart = await db.findCartByUserId(userId);

    const response: SyncCartResponse = {
      cart: {
        id: updatedCart!.userId || "",
        userId: updatedCart!.userId,
        items: mergedItems,
        totalPrice: updatedCart!.totalPrice,
        totalItems: updatedCart!.totalItems,
        lastSyncedAt: updatedCart!.lastSyncedAt?.toISOString(),
        createdAt: updatedCart!.createdAt.toISOString(),
        updatedAt: updatedCart!.updatedAt.toISOString(),
      },
      ...(conflicts.length > 0 && { conflicts }),
      syncedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error syncing cart:", error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to sync cart",
      500
    );
  }
}




