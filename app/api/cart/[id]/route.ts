import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { errorToResponse, handleDatabaseError } from "@/lib/errors";
import { requireBuyer, canAccessCartItem } from "@/server/policy/cart.policy";
import { updateCartItem, deleteCartItem } from "@/server/dal/cart.dal";
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
    await requireBuyer(); // Ensure user is authenticated as buyer
    const { id } = await params;
    await canAccessCartItem(id); // Check authorization via policy
    
    const body = await request.json();
    const validated = updateCartItemSchema.parse(body);

    const updated = await updateCartItem(id, validated);
    return NextResponse.json(updated);
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
    await requireBuyer(); // Ensure user is authenticated as buyer
    const { id } = await params;
    await canAccessCartItem(id); // Check authorization via policy

    await deleteCartItem(id);
    return NextResponse.json({ success: true });
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

