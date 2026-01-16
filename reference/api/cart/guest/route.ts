import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse, ErrorCodes } from "@/lib/api/errors";
import { db } from "@/lib/api/db";
import type { Cart } from "@/types/cart";

/**
 * GET /api/cart/guest - Get guest cart by session ID
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get("X-Session-ID");

    if (!sessionId) {
      return createErrorResponse(
        ErrorCodes.BAD_REQUEST,
        "Session ID is required",
        400
      );
    }

    let cart = await db.findCartBySessionId(sessionId);

    // Create empty cart if it doesn't exist
    if (!cart) {
      cart = await db.createCart({
        sessionId,
        items: [],
        totalPrice: 0,
        totalItems: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const response: { cart: Cart } = {
      cart: {
        id: cart.sessionId || "",
        sessionId: cart.sessionId,
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
    console.error("Error fetching guest cart:", error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch guest cart",
      500
    );
  }
}




