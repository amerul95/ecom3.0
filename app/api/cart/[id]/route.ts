import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/auth-helpers";
import { z } from "zod";
import { errorToResponse, handleDatabaseError, NotFoundError, AuthorizationError, ValidationError } from "@/lib/errors";

const updateCartItemSchema = z.object({
  quantity: z.number().int().positive().max(100, "Quantity cannot exceed 100"),
});

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
    const body = await request.json();
    const validated = updateCartItemSchema.parse(body);

    // Verify cart item belongs to user
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        product: true,
        variant: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundError("Cart item", id);
    }

    if (cartItem.userId !== user.id) {
      throw new AuthorizationError("You do not have permission to modify this cart item");
    }

    // Check stock availability
    const availableStock = cartItem.variant
      ? cartItem.variant.stock
      : cartItem.product.stock;

    if (validated.quantity > availableStock) {
      throw new ValidationError(
        `Insufficient stock. Available: ${availableStock}, Requested: ${validated.quantity}`
      );
    }

    // Update quantity
    const updated = await prisma.cartItem.update({
      where: { id },
      data: { quantity: validated.quantity },
      include: {
        product: true,
        variant: true,
      },
    });

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

/**
 * DELETE /api/cart/[id]
 * Remove item from cart
 * @param id - Cart item ID
 * @returns Success confirmation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireBuyer();
    const { id } = await params;

    // Verify cart item belongs to user
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
    });

    if (!cartItem) {
      throw new NotFoundError("Cart item", id);
    }

    if (cartItem.userId !== user.id) {
      throw new AuthorizationError("You do not have permission to delete this cart item");
    }

    await prisma.cartItem.delete({
      where: { id },
    });

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

