import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/auth-helpers";
import { z } from "zod";
import { errorToResponse, handleDatabaseError, ValidationError, NotFoundError } from "@/lib/errors";

const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional(),
  quantity: z.number().int().positive().max(100, "Quantity cannot exceed 100").default(1),
});

/**
 * GET /api/cart
 * Get user's cart with all items and calculated totals
 * @returns Cart data with items, total, and item count
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireBuyer();

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            category: true,
            seller: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        variant: true,
      },
      orderBy: { addedAt: "desc" },
    });

    const total = cartItems.reduce((sum, item) => {
      const price = item.variant?.price 
        ? Number(item.variant.price) 
        : Number(item.product.price);
      return sum + price * item.quantity;
    }, 0);

    return NextResponse.json({
      items: cartItems,
      total: total.toFixed(2),
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    });
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

    // Check if product exists and has stock
    const product = await prisma.product.findUnique({
      where: { id: validated.productId },
      include: {
        variants: validated.variantId ? { where: { id: validated.variantId } } : false,
      },
    });

    if (!product) {
      throw new NotFoundError("Product", validated.productId);
    }

    // Check variant if provided
    if (validated.variantId) {
      const variant = product.variants?.find((v) => v.id === validated.variantId);
      if (!variant) {
        throw new NotFoundError("Variant", validated.variantId);
      }
      if (variant.stock < validated.quantity) {
        throw new ValidationError(
          `Insufficient stock for variant. Available: ${variant.stock}, Requested: ${validated.quantity}`
        );
      }
    } else {
      if (product.stock < validated.quantity) {
        throw new ValidationError(
          `Insufficient stock. Available: ${product.stock}, Requested: ${validated.quantity}`
        );
      }
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId: user.id,
        productId: validated.productId,
        variantId: validated.variantId ?? null,
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + validated.quantity;
      const cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
        include: {
          product: true,
          variant: true,
        },
      });
      return NextResponse.json(cartItem);
    } else {
      // Create new cart item
      const cartItem = await prisma.cartItem.create({
        data: {
          userId: user.id,
          productId: validated.productId,
          variantId: validated.variantId || null,
          quantity: validated.quantity,
        },
        include: {
          product: true,
          variant: true,
        },
      });
      return NextResponse.json(cartItem, { status: 201 });
    }
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

