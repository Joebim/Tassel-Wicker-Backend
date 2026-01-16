import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { createErrorResponse, ErrorCodes } from "@/lib/api/errors";
import { db } from "@/lib/api/db";
import type {
  Cart,
  MergeGuestCartRequest,
  MergeGuestCartResponse,
} from "@/types/cart";

/**
 * POST /api/cart/merge-guest - Merge guest cart into user cart on login
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

    const sessionId = request.headers.get("X-Session-ID");
    const body: MergeGuestCartRequest = await request.json();
    const { guestCart } = body;

    if (!Array.isArray(guestCart)) {
      return createErrorResponse(
        ErrorCodes.BAD_REQUEST,
        "guestCart must be an array",
        400
      );
    }

    const userId = authResult.user.id;
    let userCart = await db.findCartByUserId(userId);

    // Create user cart if it doesn't exist
    if (!userCart) {
      userCart = await db.createCart({
        userId,
        items: [],
        totalPrice: 0,
        totalItems: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const mergedItems: string[] = [];
    const itemMap = new Map<string, any>();

    // Add existing user cart items
    userCart.items.forEach((item: any) => {
      itemMap.set(item.id, {
        ...item,
        createdAt: item.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: item.updatedAt?.toISOString() || new Date().toISOString(),
      });
    });

    // Merge guest cart items
    for (const guestItem of guestCart) {
      const existing = itemMap.get(guestItem.id);

      if (existing) {
        // Item exists in both - use higher quantity
        existing.quantity = Math.max(existing.quantity, guestItem.quantity);
        existing.updatedAt = new Date().toISOString();
      } else {
        // New item from guest cart - validate product
        const product = await db.findProductById(guestItem.productId);
        if (product && product.inStock) {
          itemMap.set(guestItem.id, {
            ...guestItem,
            price: product.price, // Use server price
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          mergedItems.push(guestItem.id);
        }
      }
    }

    const finalItems = Array.from(itemMap.values());

    // Recalculate totals
    const totalItems = finalItems.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0
    );
    const totalPrice = finalItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    // Update user cart
    await db.updateCart(userId, {
      items: finalItems.map((item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(),
      })),
      totalPrice,
      totalItems,
      updatedAt: new Date(),
    });

    // Delete guest cart if session ID provided
    if (sessionId) {
      await db.deleteCartBySessionId(sessionId);
    }

    const updatedCart = await db.findCartByUserId(userId);

    const response: MergeGuestCartResponse = {
      cart: {
        id: updatedCart!.userId || "",
        userId: updatedCart!.userId,
        items: finalItems,
        totalPrice: updatedCart!.totalPrice,
        totalItems: updatedCart!.totalItems,
        createdAt: updatedCart!.createdAt.toISOString(),
        updatedAt: updatedCart!.updatedAt.toISOString(),
      },
      mergedItems,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error merging guest cart:", error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to merge guest cart",
      500
    );
  }
}




