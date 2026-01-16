import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { createErrorResponse, ErrorCodes } from "@/lib/api/errors";
import { db } from "@/lib/api/db";
import type { Cart } from "@/types/cart";

/**
 * GET /api/cart - Get user's cart
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error || !authResult.user) {
      return createErrorResponse(
        ErrorCodes.UNAUTHORIZED,
        authResult.error || "Authentication required",
        401
      );
    }

    const userId = authResult.user.id;
    let cart = await db.findCartByUserId(userId);

    // Create empty cart if it doesn't exist (lazy creation)
    if (!cart) {
      cart = await db.createCart({
        userId,
        items: [],
        totalPrice: 0,
        totalItems: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const response: { cart: Cart } = {
      cart: {
        id: cart.userId || "",
        userId: cart.userId,
        items: cart.items.map((item) => ({
          ...item,
          createdAt: item.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: item.updatedAt?.toISOString() || new Date().toISOString(),
        })),
        totalPrice: cart.totalPrice,
        totalItems: cart.totalItems,
        lastSyncedAt: cart.lastSyncedAt?.toISOString(),
        createdAt: cart.createdAt.toISOString(),
        updatedAt: cart.updatedAt.toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching cart:", error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch cart",
      500
    );
  }
}

/**
 * DELETE /api/cart - Clear cart
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error || !authResult.user) {
      return createErrorResponse(
        ErrorCodes.UNAUTHORIZED,
        authResult.error || "Authentication required",
        401
      );
    }

    const userId = authResult.user.id;
    const cart = await db.findCartByUserId(userId);

    if (!cart) {
      return createErrorResponse(
        ErrorCodes.CART_NOT_FOUND,
        "Cart not found",
        404
      );
    }

    // Clear items
    await db.updateCart(userId, {
      items: [],
      totalPrice: 0,
      totalItems: 0,
      updatedAt: new Date(),
    });

    const updatedCart = await db.findCartByUserId(userId);

    return NextResponse.json({
      cart: {
        id: updatedCart!.userId || "",
        userId: updatedCart!.userId,
        items: [],
        totalPrice: 0,
        totalItems: 0,
        createdAt: updatedCart!.createdAt.toISOString(),
        updatedAt: updatedCart!.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to clear cart",
      500
    );
  }
}




