import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { errorToResponse, handleDatabaseError } from "@/lib/errors";
import { requireBuyer, canAccessCartItem } from "@/server/policy/cart.policy";
import { updateCartItem, deleteCartItem, getCart } from "@/server/dal/cart.dal";
import { updateCartItemSchema } from "@/server/dto/cart.dto";

/**
 * PATCH /api/cart/[id]
 * Update cart item quantity
 * @param id - Cart item ID
 * @param quantity - New quantity (must be positive and not exceed stock)
 * @returns Updated cart item
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireBuyer();
    const { id } = await params;
    await canAccessCartItem(id);

    const body = await request.json();
    const validated = updateCartItemSchema.parse(body);

    await updateCartItem(id, validated);
    const cart = await getCart(user.id);
    return NextResponse.json(cart);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireBuyer();
    const { id } = await params;
    await canAccessCartItem(id);

    await deleteCartItem(id);
    const cart = await getCart(user.id);
    return NextResponse.json(cart);
  } catch (error: unknown) {
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

