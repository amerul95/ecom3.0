import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/auth-helpers";
import { errorToResponse } from "@/lib/errors";

/**
 * GET /api/payments/oxpay-v2/status
 * Get payment status by reference (order ID or session ID)
 * @returns Payment and order details
 */
export async function GET(request: NextRequest) {
  console.log("🔵 [API v2] GET /api/payments/oxpay-v2/status called");

  try {
    const user = await requireBuyer();
    console.log("✅ [API v2] User authenticated:", { userId: user.id, email: user.email });

    const searchParams = request.nextUrl.searchParams;
    const ref = searchParams.get("ref") || searchParams.get("orderId");
    console.log("📋 [API v2] Query parameters:", { ref });

    if (!ref) {
      console.error("❌ [API v2] Missing reference number");
      return NextResponse.json(
        { error: "Missing reference number" },
        { status: 400 }
      );
    }

    // Find payment by order ID (merchant_reference_id) or providerRef (session_id)
    console.log("🔍 [API v2] Searching for payment with reference:", ref);
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { orderId: ref },
          { providerRef: ref },
        ],
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                  },
                },
                variant: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log("📦 [API v2] Payment found:", {
      paymentId: payment?.id,
      orderId: payment?.orderId,
      status: payment?.status,
      providerRef: payment?.providerRef,
      amount: payment?.amount?.toString(),
      currency: payment?.currency,
    });

    if (!payment) {
      console.error("❌ [API v2] Payment not found for reference:", ref);
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Verify order belongs to user
    if (payment.order.userId !== user.id) {
      console.error("❌ [API v2] Unauthorized access:", {
        orderUserId: payment.order.userId,
        requestUserId: user.id,
      });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    console.log("✅ [API v2] Returning payment status:", {
      status: payment.status,
      orderStatus: payment.order.status,
    });

    return NextResponse.json({
      payment: {
        id: payment.id,
        status: payment.status,
        providerRef: payment.providerRef,
        amount: payment.amount.toString(),
        currency: payment.currency,
      },
      order: {
        id: payment.order.id,
        status: payment.order.status,
        total: payment.order.total.toString(),
        items: payment.order.items,
      },
    });
  } catch (error: unknown) {
    console.error("❌ [API v2] GET /api/payments/oxpay-v2/status error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    const { status, body } = errorToResponse(error);
    return NextResponse.json(body, { status });
  }
}

