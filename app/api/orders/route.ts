import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/auth-helpers";
import { z } from "zod";

const createOrderSchema = z.object({
  shippingAddressId: z.string().optional(),
  shippingInfo: z.object({
    address: z.string(),
    city: z.string(),
    state: z.string().optional(),
    postal: z.string(),
    country: z.string().default("SG"),
  }).optional(),
});

// GET /api/orders - Get user's orders
export async function GET(request: NextRequest) {
  try {
    const user = await requireBuyer();
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
              variant: true,
            },
          },
          payment: true,
          shipping: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create order from cart
export async function POST(request: NextRequest) {
  try {
    const user = await requireBuyer();
    const body = await request.json();
    const validated = createOrderSchema.parse(body);

    // Get user's cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: true,
        variant: true,
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Validate stock and calculate total
    let total = 0;
    const orderItems: Array<{
      productId: string;
      variantId: string | null;
      quantity: number;
      price: number;
    }> = [];

    for (const cartItem of cartItems) {
      const availableStock = cartItem.variant
        ? cartItem.variant.stock
        : cartItem.product.stock;

      if (cartItem.quantity > availableStock) {
        return NextResponse.json(
          { error: `Insufficient stock for ${cartItem.product.name}` },
          { status: 400 }
        );
      }

      const price = cartItem.variant?.price
        ? Number(cartItem.variant.price)
        : Number(cartItem.product.price);

      total += price * cartItem.quantity;

      orderItems.push({
        productId: cartItem.productId,
        variantId: cartItem.variantId,
        quantity: cartItem.quantity,
        price,
      });
    }

    // Get shipping address
    let shippingData;
    if (validated.shippingAddressId) {
      const address = await prisma.address.findUnique({
        where: { id: validated.shippingAddressId },
      });
      if (!address || address.userId !== user.id) {
        return NextResponse.json(
          { error: "Shipping address not found" },
          { status: 404 }
        );
      }
      shippingData = {
        address: `${address.line1}${address.line2 ? `, ${address.line2}` : ""}`,
        city: address.city,
        state: address.state,
        postal: address.postal,
        country: address.country,
      };
    } else if (validated.shippingInfo) {
      shippingData = validated.shippingInfo;
    } else {
      return NextResponse.json(
        { error: "Shipping information required" },
        { status: 400 }
      );
    }

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          total,
          status: "PENDING",
          items: {
            create: orderItems,
          },
          shipping: {
            create: shippingData,
          },
          payment: {
            create: {
              amount: total,
              status: "INITIATED",
              currency: "SGD",
            },
          },
        },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
          payment: true,
          shipping: true,
        },
      });

      // Update stock
      for (const cartItem of cartItems) {
        if (cartItem.variantId) {
          await tx.variant.update({
            where: { id: cartItem.variantId },
            data: {
              stock: {
                decrement: cartItem.quantity,
              },
            },
          });
        } else {
          await tx.product.update({
            where: { id: cartItem.productId },
            data: {
              stock: {
                decrement: cartItem.quantity,
              },
            },
          });
        }
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { userId: user.id },
      });

      return newOrder;
    });

    return NextResponse.json(order, { status: 201 });
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

    console.error("POST /api/orders error:", error);
    console.error("POST /api/orders error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });

    if (error?.code === "P2025") {
      return NextResponse.json(
        {
          error: "Failed to create order",
          message: "One of the related records could not be found. Please refresh your cart and try again.",
          code: error.code,
        },
        { status: 400 }
      );
    }

    if (error?.code === "P2002") {
      return NextResponse.json(
        {
          error: "Failed to create order",
          message: "Duplicate record detected when creating payment. Please try again.",
          code: error.code,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create order. Please try again.",
        message: error?.message,
        code: error?.code,
      },
      { status: 500 }
    );
  }
}







