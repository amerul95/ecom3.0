import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { errorToResponse, handleDatabaseError } from "@/lib/errors";
import { requireBuyer } from "@/server/policy/cart.policy";
import { getCart, addToCart } from "@/server/dal/cart.dal";
import { addToCartSchema } from "@/server/dto/cart.dto";

/**
 * GET /api/cart
 * Get user's cart with all items and calculated totals
 * @returns Cart data with items, total, and item count
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireBuyer();
    const cart = await getCart(user.id);
    return NextResponse.json(cart);
  } catch (error: unknown) {
    const { status, body } = errorToResponse(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * POST /api/cart
 * Add item to cart or update quantity if item already exists
 * @param productId - Product ID (required)
 * @param variantId - Variant ID (optional)
 * @param quantity - Quantity to add (default: 1, max: 100)
 * @returns Created or updated cart item
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireBuyer();
    const body = await request.json();
    const validated = addToCartSchema.parse(body);
    
    await addToCart(user.id, validated);
    const cart = await getCart(user.id);
    return NextResponse.json(cart, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    
    // Handle Prisma errors
    if (typeof error === "object" && error !== null && "code" in error) {
      const dbError = handleDatabaseError(error);
      const { status, body } = errorToResponse(dbError);
      return NextResponse.json(body, { status });
    }
    
    const { status, body } = errorToResponse(error);
    return NextResponse.json(body, { status });
  }
}

