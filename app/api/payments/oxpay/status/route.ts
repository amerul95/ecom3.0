import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/auth-helpers";
import { verifyWebhookSignature, OxPayState } from "@/services/payments/oxpay";

// GET /api/payments/oxpay/status - Get payment status by reference number
export async function GET(request: NextRequest) {
  console.log("🔵 [API] GET /api/payments/oxpay/status called");
  
  try {
    const user = await requireBuyer();
    console.log("✅ [API] User authenticated:", { userId: user.id, email: user.email });
    
    const searchParams = request.nextUrl.searchParams;
    const ref = searchParams.get("ref");
    console.log("📋 [API] Query parameters:", { ref });

    if (!ref) {
      console.error("❌ [API] Missing reference number");
      return NextResponse.json(
        { error: "Missing reference number" },
        { status: 400 }
      );
    }

    // Find payment by reference number
    console.log("🔍 [API] Searching for payment with reference:", ref);
    const payment = await prisma.payment.findFirst({
      where: {
        providerRef: ref,
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

    console.log("📦 [API] Payment found:", {
      paymentId: payment?.id,
      orderId: payment?.orderId,
      status: payment?.status,
      providerRef: payment?.providerRef,
      amount: payment?.amount?.toString(),
      currency: payment?.currency,
    });

    if (!payment) {
      console.error("❌ [API] Payment not found for reference:", ref);
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Verify order belongs to user
    if (payment.order.userId !== user.id) {
      console.error("❌ [API] Unauthorized access:", {
        orderUserId: payment.order.userId,
        requestUserId: user.id,
      });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    console.log("✅ [API] Returning payment status:", {
      status: payment.status,
      orderStatus: payment.order.status,
    });

    return NextResponse.json(payment);
  } catch (error: unknown) {
    console.error("❌ [API] GET /api/payments/oxpay/status error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    if (error instanceof Error && (error.message === "Unauthorized" || error.message.includes("Forbidden"))) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/payments/oxpay/status - Webhook handler for payment status updates
export async function POST(request: NextRequest) {
  console.log("🔵 [WEBHOOK] POST /api/payments/oxpay/status called");
  console.log("📋 [WEBHOOK] Request headers:", Object.fromEntries(request.headers.entries()));
  
  try {
    const body = await request.json();
    console.log("📦 [WEBHOOK] Webhook payload received:", JSON.stringify(body, null, 2));

    // Extract reference number and other payment details
    const referenceNo = body.referenceNo || body.reference_no;
    const state = body.state || body.transactionState || body.status;
    const respCode = body.respCode || body.resp_code;
    const respMsg = body.respMsg || body.resp_msg;
    const providerRef = body.providerRef || body.provider_ref || body.transactionId;
    const receiptNumber = body.receiptNumber || body.receipt_number;
    const brandName = body.brandName || body.brand_name;
    const truncatedPan = body.truncatedPan || body.truncated_pan;
    const signature = body.signature;

    console.log("🔍 [WEBHOOK] Extracted data:", {
      referenceNo,
      state,
      respCode,
      respMsg,
      providerRef,
      receiptNumber,
      brandName,
      truncatedPan,
      hasSignature: !!signature,
    });

    if (!referenceNo) {
      console.error("❌ [WEBHOOK] Missing referenceNo in payload");
      return NextResponse.json(
        { error: "Missing referenceNo" },
        { status: 400 }
      );
    }

    // Verify signature if provided (recommended for production)
    if (signature) {
      console.log("🔐 [WEBHOOK] Verifying signature...");
      const isValid = verifyWebhookSignature(body, signature);
      console.log("🔐 [WEBHOOK] Signature verification result:", isValid);
      
      if (!isValid) {
        console.error("❌ [WEBHOOK] Invalid webhook signature:", referenceNo);
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
      console.log("✅ [WEBHOOK] Signature verified successfully");
    } else {
      console.warn("⚠️ [WEBHOOK] No signature provided - skipping verification");
    }

    // Find payment by reference number
    console.log("🔍 [WEBHOOK] Searching for payment with reference:", referenceNo);
    const payment = await prisma.payment.findFirst({
      where: {
        providerRef: referenceNo,
      },
      include: {
        order: true,
      },
    });

    console.log("📦 [WEBHOOK] Payment found:", {
      paymentId: payment?.id,
      orderId: payment?.orderId,
      currentStatus: payment?.status,
      currentOrderStatus: payment?.order?.status,
    });

    if (!payment) {
      console.error("❌ [WEBHOOK] Payment not found for referenceNo:", referenceNo);
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Map OxPay state to PaymentStatus enum
    console.log("🔄 [WEBHOOK] Mapping OxPay state to internal statuses. OxPay state:", state);
    let paymentStatus: "INITIATED" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED" = "INITIATED";
    let orderStatus: "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED" = "PENDING";

    if (state === OxPayState.AUTHORIZED || state === "2") {
      paymentStatus = "CAPTURED";
      orderStatus = "PAID";
      console.log("✅ [WEBHOOK] Payment AUTHORIZED - setting to CAPTURED/PAID");
    } else if (state === OxPayState.FAILED || state === "3") {
      paymentStatus = "FAILED";
      orderStatus = "CANCELLED";
      console.log("❌ [WEBHOOK] Payment FAILED - setting to FAILED/CANCELLED");
    } else if (state === OxPayState.CANCELLED || state === "4") {
      paymentStatus = "FAILED";
      orderStatus = "CANCELLED";
      console.log("❌ [WEBHOOK] Payment CANCELLED - setting to FAILED/CANCELLED");
    } else if (state === OxPayState.REFUNDED || state === "5") {
      paymentStatus = "REFUNDED";
      orderStatus = "REFUNDED";
      console.log("🔄 [WEBHOOK] Payment REFUNDED - setting to REFUNDED");
    } else if (state === OxPayState.VOIDED || state === "6") {
      paymentStatus = "FAILED";
      orderStatus = "CANCELLED";
      console.log("❌ [WEBHOOK] Payment VOIDED - setting to FAILED/CANCELLED");
    } else {
      console.warn("⚠️ [WEBHOOK] Unknown state:", state, "- keeping INITIATED/PENDING");
    }

    console.log("📝 [WEBHOOK] Status mapping result:", {
      paymentStatus,
      orderStatus,
      previousPaymentStatus: payment.status,
      previousOrderStatus: payment.order.status,
    });

    // Update payment and order in transaction
    console.log("💾 [WEBHOOK] Updating payment and order in database...");
    await prisma.$transaction(async (tx) => {
      // Update payment
      console.log("💾 [WEBHOOK] Updating payment record:", {
        paymentId: payment.id,
        newStatus: paymentStatus,
        newProviderRef: providerRef || payment.providerRef,
      });
      
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          providerRef: providerRef || payment.providerRef,
          rawPayload: body,
        },
      });

      // Update order status
      console.log("💾 [WEBHOOK] Updating order status:", {
        orderId: payment.orderId,
        newStatus: orderStatus,
      });
      
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: orderStatus,
        },
      });
    });

    console.log("✅ [WEBHOOK] Payment and order updated successfully");

    // Return success response to OxPay
    const response = {
      respCode: "00",
      respMsg: "Success",
    };
    
    console.log("✅ [WEBHOOK] Sending success response to OxPay:", response);
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("❌ [WEBHOOK] POST /api/payments/oxpay/status error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    
    return NextResponse.json(
      { 
        respCode: "99",
        respMsg: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 }
    );
  }
}
