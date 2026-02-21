import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/server/policy/auth.policy";
import { createHostedPaymentPage } from "@/Payment/handler/OxpayHandler";
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
  try {
    const user = await requireBuyer();

    const body = await request.json();
    const { orderId } = createPaymentIntentSchema.parse(body);

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

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if order already has a payment
    if (!order.payment) {
      return NextResponse.json(
        { error: "Payment record not found for this order" },
        { status: 400 }
      );
    }

    // Check if payment is already completed
    if (order.payment.status === "CAPTURED" || order.status === "PAID") {
      return NextResponse.json({ error: "Order already paid" }, { status: 400 });
    }

    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get("origin") || "http://localhost:3000";
    const successUrl = `${baseUrl}/api/payments/oxpay-v2/return?status=success`;
    const failureUrl = `${baseUrl}/api/payments/oxpay-v2/return?status=failure`;
    const notificationUrl = `${baseUrl}/api/payments/oxpay-v2/webhook`;

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

    // Update payment record with session ID if available
    if (sessionId) {
      await prisma.payment.update({
        where: { orderId },
        data: {
          providerRef: sessionId,
          status: "INITIATED",
        },
      });
    }

    const response = {
      paymentUrl: hppUrl,
      sessionId,
      orderId,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    const { status, body } = errorToResponse(error);
    return NextResponse.json(body, { status });
  }
}

