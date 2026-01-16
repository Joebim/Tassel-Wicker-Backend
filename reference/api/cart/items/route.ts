import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { createErrorResponse, ErrorCodes } from "@/lib/api/errors";
import { validateCartItem } from "@/lib/api/validation";
import { db } from "@/lib/api/db";
import type { Cart, CartItem } from "@/types/cart";

/**
 * POST /api/cart/items - Add item to cart
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

    const body = await request.json();
    const { item } = body;

    if (!item) {
      return createErrorResponse(
        ErrorCodes.BAD_REQUEST,
        "Item is required",
        400
      );
    }

    // Validate item structure
    const validation = validateCartItem(item);
    if (!validation.valid) {
      return createErrorResponse(
        ErrorCodes.BAD_REQUEST,
        validation.error || "Invalid item data",
        400
      );
    }

    // Validate product exists and is in stock
    const product = await db.findProductById(item.productId);
    if (!product) {
      return createErrorResponse(
        ErrorCodes.PRODUCT_NOT_FOUND,
        "Product not found",
        404
      );
    }

    if (!product.inStock) {
      return createErrorResponse(
        ErrorCodes.PRODUCT_OUT_OF_STOCK,
        "Product is out of stock",
        400
      );
    }

    // Use server price as source of truth
    const serverPrice = product.price;
    if (item.price !== serverPrice) {
      item.price = serverPrice; // Update to server price
    }

    const userId = authResult.user.id;
    let cart = await db.findCartByUserId(userId);

    // Create cart if it doesn't exist
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

    // Check if item already exists
    const existingItemIndex = cart.items.findIndex(
      (i: any) => i.id === item.id
    );

    if (existingItemIndex >= 0) {
      // Increment quantity
      const existingItem = cart.items[existingItemIndex];
      existingItem.quantity += item.quantity || 1;
      existingItem.price = serverPrice; // Update price
      existingItem.updatedAt = new Date();
    } else {
      // Add new item
      const now = new Date();
      cart.items.push({
        ...item,
        quantity: item.quantity || 1,
        price: serverPrice,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Recalculate totals (should be done by pre-save hook, but ensure here)
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
        id: item.id,
        quantity:
          existingItemIndex >= 0
            ? cart.items[existingItemIndex].quantity
            : item.quantity || 1,
      },
    });
  } catch (error) {
    console.error("Error adding item to cart:", error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to add item to cart",
      500
    );
  }
}




