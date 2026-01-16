import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { createErrorResponse, ErrorCodes } from "@/lib/api/errors";
import { db } from "@/lib/api/db";
import type { Cart } from "@/types/cart";

/**
 * PUT /api/cart/items/:itemId - Update item quantity
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error || !authResult.user) {
      return createErrorResponse(
        ErrorCodes.UNAUTHORIZED,
        authResult.error || "Authentication required",
        401
      );
    }

    const { itemId } = await params;
    const body = await request.json();
    const { quantity } = body;

    if (typeof quantity !== "number" || quantity < 0) {
      return createErrorResponse(
        ErrorCodes.INVALID_QUANTITY,
        "Quantity must be a number greater than or equal to 0",
        400
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

    const itemIndex = cart.items.findIndex((i: any) => i.id === itemId);

    if (itemIndex === -1) {
      return createErrorResponse(
        ErrorCodes.CART_ITEM_NOT_FOUND,
        "Item not found in cart",
        404
      );
    }

    // If quantity is 0, remove item
    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].updatedAt = new Date();
    }

    // Recalculate totals
    const totalItems = cart.items.reduce(
      (sum: number, i: any) => sum + i.quantity,
      0
    );
    const totalPrice = cart.items.reduce(
      (sum: number, i: any) => sum + i.price * i.quantity,
      0
    );

    await db.updateCart(userId, {
      items: cart.items,
      totalPrice,
      totalItems,
      updatedAt: new Date(),
    });

    const updatedCart = await db.findCartByUserId(userId);

    return NextResponse.json({
      cart: {
        id: updatedCart!.userId || "",
        userId: updatedCart!.userId,
        items: updatedCart!.items.map((i: any) => ({
          ...i,
          createdAt: i.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: i.updatedAt?.toISOString() || new Date().toISOString(),
        })),
        totalPrice: updatedCart!.totalPrice,
        totalItems: updatedCart!.totalItems,
        createdAt: updatedCart!.createdAt.toISOString(),
        updatedAt: updatedCart!.updatedAt.toISOString(),
      },
      item: {
        id: itemId,
        quantity: quantity === 0 ? 0 : quantity,
      },
    });
  } catch (error) {
    console.error("Error updating cart item:", error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to update item quantity",
      500
    );
  }
}

/**
 * DELETE /api/cart/items/:itemId - Remove item from cart
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error || !authResult.user) {
      return createErrorResponse(
        ErrorCodes.UNAUTHORIZED,
        authResult.error || "Authentication required",
        401
      );
    }

    const { itemId } = await params;
    const userId = authResult.user.id;
    const cart = await db.findCartByUserId(userId);

    if (!cart) {
      return createErrorResponse(
        ErrorCodes.CART_NOT_FOUND,
        "Cart not found",
        404
      );
    }

    const itemIndex = cart.items.findIndex((i: any) => i.id === itemId);

    if (itemIndex === -1) {
      return createErrorResponse(
        ErrorCodes.CART_ITEM_NOT_FOUND,
        "Item not found in cart",
        404
      );
    }

    cart.items.splice(itemIndex, 1);

    // Recalculate totals
    const totalItems = cart.items.reduce(
      (sum: number, i: any) => sum + i.quantity,
      0
    );
    const totalPrice = cart.items.reduce(
      (sum: number, i: any) => sum + i.price * i.quantity,
      0
    );

    await db.updateCart(userId, {
      items: cart.items,
      totalPrice,
      totalItems,
      updatedAt: new Date(),
    });

    const updatedCart = await db.findCartByUserId(userId);

    return NextResponse.json({
      cart: {
        id: updatedCart!.userId || "",
        userId: updatedCart!.userId,
        items: updatedCart!.items.map((i: any) => ({
          ...i,
          createdAt: i.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: i.updatedAt?.toISOString() || new Date().toISOString(),
        })),
        totalPrice: updatedCart!.totalPrice,
        totalItems: updatedCart!.totalItems,
        createdAt: updatedCart!.createdAt.toISOString(),
        updatedAt: updatedCart!.updatedAt.toISOString(),
      },
      removedItemId: itemId,
    });
  } catch (error) {
    console.error("Error removing cart item:", error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to remove item from cart",
      500
    );
  }
}



