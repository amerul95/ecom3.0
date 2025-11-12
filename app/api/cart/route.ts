import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/auth-helpers";
import { z } from "zod";

const addToCartSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().positive().default(1),
});

// GET /api/cart - Get user's cart
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
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("GET /api/cart error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart
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
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Check variant if provided
    if (validated.variantId) {
      const variant = product.variants?.find((v) => v.id === validated.variantId);
      if (!variant) {
        return NextResponse.json(
          { error: "Variant not found" },
          { status: 404 }
        );
      }
      if (variant.stock < validated.quantity) {
        return NextResponse.json(
          { error: "Insufficient stock for variant" },
          { status: 400 }
        );
      }
    } else {
      if (product.stock < validated.quantity) {
        return NextResponse.json(
          { error: "Insufficient stock" },
          { status: 400 }
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
      const cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + validated.quantity },
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
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/cart error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

