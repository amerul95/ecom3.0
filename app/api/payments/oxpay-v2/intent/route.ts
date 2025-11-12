import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/auth-helpers";
import { createHostedPaymentPage } from "@/services/payments/oxpay-v2";
import { z } from "zod";
import { errorToResponse } from "@/lib/errors";
import { CURRENCY } from "@/types";

const createPaymentIntentSchema = z.object({
  orderId: z.string().cuid(),
});

/**
 * POST /api/payments/oxpay-v2/intent
 * Create Hosted Payment Page URL for an order
 * @returns Hosted Payment Page URL
 */
export async function POST(request: NextRequest) {
  console.log("🔵 [API v2] POST /api/payments/oxpay-v2/intent called");

  try {
    const user = await requireBuyer();
    console.log("✅ [API v2] User authenticated:", { userId: user.id, email: user.email });

    const body = await request.json();
    console.log("📋 [API v2] Request body:", body);

    const { orderId } = createPaymentIntentSchema.parse(body);
    console.log("✅ [API v2] Order ID validated:", orderId);

    // Verify order belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    console.log("📦 [API v2] Order found:", {
      orderId: order?.id,
      userId: order?.userId,
      total: order?.total?.toString(),
      status: order?.status,
      hasPayment: !!order?.payment,
      paymentStatus: order?.payment?.status,
    });

    if (!order) {
      console.error("❌ [API v2] Order not found:", orderId);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== user.id) {
      console.error("❌ [API v2] Unauthorized access:", {
        orderUserId: order.userId,
        requestUserId: user.id,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if order already has a payment
    if (!order.payment) {
      console.error("❌ [API v2] Payment record not found for order:", orderId);
      return NextResponse.json(
        { error: "Payment record not found for this order" },
        { status: 400 }
      );
    }

    // Check if payment is already completed
    if (order.payment.status === "CAPTURED" || order.status === "PAID") {
      console.warn("⚠️ [API v2] Order already paid:", {
        paymentStatus: order.payment.status,
        orderStatus: order.status,
      });
      return NextResponse.json({ error: "Order already paid" }, { status: 400 });
    }

    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get("origin") || "http://localhost:3000";
    const successUrl = `${baseUrl}/api/payments/oxpay-v2/return?status=success`;
    const failureUrl = `${baseUrl}/api/payments/oxpay-v2/return?status=failure`;
    const notificationUrl = `${baseUrl}/api/payments/oxpay-v2/webhook`;

    console.log("🔄 [API v2] Creating Hosted Payment Page...");
    console.log("📋 [API v2] Redirect URLs:", {
      successUrl,
      failureUrl,
      notificationUrl,
    });

    // Create Hosted Payment Page URL
    const { hppUrl, sessionId } = await createHostedPaymentPage({
      merchantReferenceId: orderId,
      description: `Order ${orderId}`,
      amount: Number(order.total),
      currency: order.payment.currency || CURRENCY,
      successUrl,
      failureUrl,
      notificationUrl,
      payerName: order.user.name || "Customer",
      payerEmail: order.user.email || user.email,
      payerPhone: "12345678", // Default phone - OxPay requires phone but we don't store it
      capture: true,
    });

    console.log("✅ [API v2] Hosted Payment Page URL received:", {
      hppUrl,
      sessionId,
    });

    // Update payment record with session ID if available
    if (sessionId) {
      await prisma.payment.update({
        where: { orderId },
        data: {
          providerRef: sessionId,
          status: "INITIATED",
        },
      });
      console.log("✅ [API v2] Payment record updated with session ID:", sessionId);
    }

    const response = {
      paymentUrl: hppUrl,
      sessionId,
      orderId,
    };

    console.log("✅ [API v2] Sending response to client:", {
      hasPaymentUrl: !!response.paymentUrl,
      sessionId: response.sessionId,
      orderId: response.orderId,
    });

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("❌ [API v2] POST /api/payments/oxpay-v2/intent error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof z.ZodError) {
      console.error("❌ [API v2] Validation error:", error.issues);
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    const { status, body } = errorToResponse(error);
    return NextResponse.json(body, { status });
  }
}

