import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/auth-helpers";
import { createRedirectPayment } from "@/services/payments/oxpay";
import { z } from "zod";

const createPaymentIntentSchema = z.object({
  orderId: z.string(),
});

// POST /api/payments/oxpay/intent - Create payment intent and get redirect URL
export async function POST(request: NextRequest) {
  console.log("🔵 [API] POST /api/payments/oxpay/intent called");
  
  try {
    const user = await requireBuyer();
    console.log("✅ [API] User authenticated:", { userId: user.id, email: user.email });
    
    const body = await request.json();
    console.log("📋 [API] Request body:", body);
    
    const { orderId } = createPaymentIntentSchema.parse(body);
    console.log("✅ [API] Order ID validated:", orderId);

    // Verify order belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
      },
    });

    console.log("📦 [API] Order found:", {
      orderId: order?.id,
      userId: order?.userId,
      total: order?.total?.toString(),
      status: order?.status,
      hasPayment: !!order?.payment,
      paymentStatus: order?.payment?.status,
    });

    if (!order) {
      console.error("❌ [API] Order not found:", orderId);
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.userId !== user.id) {
      console.error("❌ [API] Unauthorized access:", {
        orderUserId: order.userId,
        requestUserId: user.id,
      });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if order already has a payment
    if (!order.payment) {
      console.error("❌ [API] Payment record not found for order:", orderId);
      return NextResponse.json(
        { error: "Payment record not found for this order" },
        { status: 400 }
      );
    }

    // Check if payment is already completed
    if (order.payment.status === "CAPTURED" || order.status === "PAID") {
      console.warn("⚠️ [API] Order already paid:", {
        paymentStatus: order.payment.status,
        orderStatus: order.status,
      });
      return NextResponse.json(
        { error: "Order already paid" },
        { status: 400 }
      );
    }

    // Generate unique reference number
    const referenceNo = `ORD-${orderId}-${Date.now()}`;
    console.log("🔢 [API] Generated reference number:", referenceNo);

    // Create payment URL with OxPay
    console.log("🔄 [API] Calling createRedirectPayment...");
    const { paymentUrl, referenceNo: returnedRef } = await createRedirectPayment(
      referenceNo,
      Number(order.total),
      order.payment.currency
    );

    console.log("✅ [API] Payment URL received from OxPay:", {
      paymentUrl,
      returnedRef,
      urlLength: paymentUrl?.length,
    });

    // Update payment record with reference number
    await prisma.payment.update({
      where: { orderId },
      data: {
        providerRef: returnedRef,
        status: "INITIATED",
      },
    });

    console.log("✅ [API] Payment record updated with reference:", returnedRef);

    const response = {
      paymentUrl,
      referenceNo: returnedRef,
      orderId,
    };

    console.log("✅ [API] Sending response to client:", {
      hasPaymentUrl: !!response.paymentUrl,
      referenceNo: response.referenceNo,
      orderId: response.orderId,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("❌ [API] POST /api/payments/oxpay/intent error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      console.error("❌ [API] Validation error:", error.issues);
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}


