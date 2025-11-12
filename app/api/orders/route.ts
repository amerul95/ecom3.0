import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/auth-helpers";
import { z } from "zod";
import { errorToResponse, handleDatabaseError, ValidationError, NotFoundError } from "@/lib/errors";
import { DEFAULT_COUNTRY, CURRENCY } from "@/types";

const createOrderSchema = z.object({
  shippingAddressId: z.string().cuid().optional(),
  shippingInfo: z.object({
    address: z.string().min(5, "Address must be at least 5 characters"),
    city: z.string().min(2, "City must be at least 2 characters"),
    state: z.string().optional().nullable(),
    postal: z.string().min(4, "Postal code must be at least 4 characters"),
    country: z.string().length(2, "Country must be a 2-letter code").default(DEFAULT_COUNTRY),
  }).optional(),
  paymentMethod: z.string().optional(),
  voucherCode: z.string().optional(),
});

/**
 * GET /api/orders
 * Get user's orders with pagination
 * @returns Paginated list of user's orders
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireBuyer();
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
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
  } catch (error: unknown) {
    const { status, body } = errorToResponse(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * POST /api/orders
 * Create order from cart items
 * Validates stock, calculates totals, creates order with payment record, updates stock, and clears cart
 * @returns Created order with items, shipping, and payment
 */
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
      throw new ValidationError("Cart is empty. Add items to your cart before placing an order.");
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
        throw new ValidationError(
          `Insufficient stock for ${cartItem.product.name}. Available: ${availableStock}, Requested: ${cartItem.quantity}`
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
        throw new NotFoundError("Shipping address", validated.shippingAddressId);
      }
      shippingData = {
        address: `${address.line1}${address.line2 ? `, ${address.line2}` : ""}`,
        city: address.city,
        state: address.state,
        postal: address.postal,
        country: address.country,
      };
    } else if (validated.shippingInfo) {
      // Clean up shipping data - convert empty strings to null for optional fields
      shippingData = {
        address: validated.shippingInfo.address,
        city: validated.shippingInfo.city,
        state: validated.shippingInfo.state && validated.shippingInfo.state.trim() !== "" 
          ? validated.shippingInfo.state 
          : null,
        postal: validated.shippingInfo.postal,
        country: validated.shippingInfo.country || DEFAULT_COUNTRY,
      };
    } else {
      throw new ValidationError("Shipping information is required. Provide either shippingAddressId or shippingInfo.");
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
              provider: "oxpay",
              amount: total,
              status: "INITIATED",
              currency: CURRENCY,
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
  } catch (error: unknown) {
    // Log the full error for debugging
    console.error("POST /api/orders error:", error);
    
    if (error instanceof z.ZodError) {
      console.error("Validation error details:", error.issues);
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    
    // Handle Prisma errors
    if (typeof error === "object" && error !== null && "code" in error) {
      console.error("Database error:", {
        code: (error as { code: string }).code,
        meta: (error as { meta?: unknown }).meta,
      });
      const dbError = handleDatabaseError(error);
      const { status, body } = errorToResponse(dbError);
      return NextResponse.json(body, { status });
    }
    
    // Handle AppError instances
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    const { status, body } = errorToResponse(error);
    console.error("Returning error response:", { status, body });
    return NextResponse.json(body, { status });
  }
}







